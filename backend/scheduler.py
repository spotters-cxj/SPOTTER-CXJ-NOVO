"""
Scheduled Tasks for Spotters CXJ
Includes automatic backup every 12 hours
"""
import asyncio
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

# Configuration
BACKUP_INTERVAL_HOURS = 12
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
GOOGLE_DRIVE_FOLDER_ID = os.environ.get('GOOGLE_DRIVE_FOLDER_ID', '103tuOyqiSzCDkdpVcWyHYKYXro3pG1_y')
GOOGLE_CREDENTIALS_PATH = os.environ.get('GOOGLE_CREDENTIALS_PATH', '/app/backend/google_credentials.json')

async def get_db():
    """Get database connection"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def export_database_to_json(db, dump_dir):
    """Export all collections to JSON files"""
    import json
    collections = await db.list_collection_names()
    
    for col_name in collections:
        documents = await db[col_name].find({}, {"_id": 0}).to_list(10000)
        json_path = os.path.join(dump_dir, f"{col_name}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(documents, f, default=str, ensure_ascii=False, indent=2)
    
    return collections

async def create_backup_zip(db):
    """Create complete backup ZIP file"""
    import zipfile
    import shutil
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_name = f"spotters_auto_backup_{timestamp}.zip"
    backup_path = f"/tmp/{backup_name}"
    dump_dir = f"/tmp/backup_dump_{timestamp}"
    
    os.makedirs(dump_dir, exist_ok=True)
    
    try:
        # Export database to JSON
        collections = await export_database_to_json(db, dump_dir)
        
        # Create ZIP with everything
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add JSON dumps
            for col_name in collections:
                json_path = os.path.join(dump_dir, f"{col_name}.json")
                if os.path.exists(json_path):
                    zipf.write(json_path, f"database/{col_name}.json")
            
            # Add photos
            uploads_dir = "/app/backend/uploads"
            if os.path.exists(uploads_dir):
                for root, dirs, files in os.walk(uploads_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, uploads_dir)
                        zipf.write(file_path, f"uploads/{arcname}")
        
        return backup_path, backup_name
    finally:
        # Cleanup dump directory
        shutil.rmtree(dump_dir, ignore_errors=True)

def upload_to_google_drive(file_path: str, file_name: str):
    """Upload file to Google Drive"""
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    
    if not os.path.exists(GOOGLE_CREDENTIALS_PATH):
        raise Exception(f"Credentials file not found: {GOOGLE_CREDENTIALS_PATH}")
    
    credentials = service_account.Credentials.from_service_account_file(
        GOOGLE_CREDENTIALS_PATH,
        scopes=['https://www.googleapis.com/auth/drive.file']
    )
    
    service = build('drive', 'v3', credentials=credentials)
    
    file_metadata = {
        'name': file_name,
        'parents': [GOOGLE_DRIVE_FOLDER_ID]
    }
    
    media = MediaFileUpload(
        file_path,
        mimetype='application/zip',
        resumable=True
    )
    
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, name, webViewLink',
        supportsAllDrives=True
    ).execute()
    
    return file

async def perform_automatic_backup():
    """Perform automatic backup to Google Drive"""
    db = await get_db()
    backup_path = None
    
    try:
        logger.info("Starting automatic backup...")
        
        # Create backup
        backup_path, backup_name = await create_backup_zip(db)
        logger.info(f"Backup created: {backup_name}")
        
        # Upload to Google Drive
        drive_file = upload_to_google_drive(backup_path, backup_name)
        logger.info(f"Backup uploaded to Google Drive: {drive_file.get('webViewLink')}")
        
        # Log success
        await db.backup_logs.insert_one({
            "backup_id": f"auto_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "filename": backup_name,
            "created_by": "system",
            "created_by_name": "Backup Automático",
            "created_at": datetime.now(timezone.utc),
            "status": "success",
            "type": "automatic",
            "drive_file_id": drive_file.get('id'),
            "drive_link": drive_file.get('webViewLink')
        })
        
        logger.info("Automatic backup completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Automatic backup failed: {str(e)}")
        
        # Log error
        try:
            await db.backup_logs.insert_one({
                "backup_id": f"auto_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "filename": "error",
                "created_by": "system",
                "created_by_name": "Backup Automático",
                "created_at": datetime.now(timezone.utc),
                "status": "error",
                "type": "automatic",
                "error": str(e)
            })
        except:
            pass
        
        return False
    finally:
        # Cleanup
        if backup_path and os.path.exists(backup_path):
            os.remove(backup_path)

async def backup_scheduler():
    """Run backup scheduler - backup every 12 hours"""
    logger.info(f"Backup scheduler started. Running every {BACKUP_INTERVAL_HOURS} hours.")
    
    while True:
        try:
            await perform_automatic_backup()
        except Exception as e:
            logger.error(f"Backup scheduler error: {str(e)}")
        
        # Wait for next backup
        await asyncio.sleep(BACKUP_INTERVAL_HOURS * 60 * 60)

def start_backup_scheduler():
    """Start the backup scheduler in background"""
    loop = asyncio.get_event_loop()
    loop.create_task(backup_scheduler())
    logger.info("Backup scheduler task created")

if __name__ == "__main__":
    # For testing
    logging.basicConfig(level=logging.INFO)
    asyncio.run(perform_automatic_backup())
