"""
Scheduled Tasks for Spotters CXJ
Includes automatic backup every 12 hours with local storage and email notifications
"""
import asyncio
import os
import shutil
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

# Local backup directory
LOCAL_BACKUP_DIR = "/app/backend/backups"
MAX_LOCAL_BACKUPS = 10  # Keep last 10 backups

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

def save_backup_locally(backup_path: str, backup_name: str) -> str:
    """Save backup to local directory"""
    os.makedirs(LOCAL_BACKUP_DIR, exist_ok=True)
    
    local_path = os.path.join(LOCAL_BACKUP_DIR, backup_name)
    shutil.copy2(backup_path, local_path)
    
    # Cleanup old backups (keep only MAX_LOCAL_BACKUPS)
    cleanup_old_backups()
    
    return local_path

def cleanup_old_backups():
    """Remove old backups, keeping only the most recent ones"""
    try:
        if not os.path.exists(LOCAL_BACKUP_DIR):
            return
        
        backups = []
        for f in os.listdir(LOCAL_BACKUP_DIR):
            if f.endswith('.zip'):
                full_path = os.path.join(LOCAL_BACKUP_DIR, f)
                backups.append((full_path, os.path.getmtime(full_path)))
        
        # Sort by modification time (newest first)
        backups.sort(key=lambda x: x[1], reverse=True)
        
        # Remove old backups
        for backup_path, _ in backups[MAX_LOCAL_BACKUPS:]:
            os.remove(backup_path)
            logger.info(f"Removed old backup: {backup_path}")
            
    except Exception as e:
        logger.warning(f"Error cleaning up old backups: {e}")

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
    """Perform automatic backup - saves locally and tries Google Drive"""
    db = await get_db()
    backup_path = None
    local_backup_saved = False
    google_drive_success = False
    error_message = None
    
    try:
        logger.info("Starting automatic backup...")
        
        # Create backup
        backup_path, backup_name = await create_backup_zip(db)
        logger.info(f"Backup created: {backup_name}")
        
        # Save locally first (always)
        try:
            local_path = save_backup_locally(backup_path, backup_name)
            local_backup_saved = True
            logger.info(f"Backup saved locally: {local_path}")
        except Exception as e:
            logger.error(f"Failed to save backup locally: {e}")
            error_message = f"Erro ao salvar backup local: {str(e)}"
        
        # Try Google Drive upload
        try:
            drive_file = upload_to_google_drive(backup_path, backup_name)
            google_drive_success = True
            logger.info(f"Backup uploaded to Google Drive: {drive_file.get('webViewLink')}")
        except Exception as e:
            logger.warning(f"Google Drive upload failed: {e}")
            if not error_message:
                error_message = f"Erro no Google Drive: {str(e)}"
        
        # Log result
        log_entry = {
            "backup_id": f"auto_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "filename": backup_name,
            "created_by": "system",
            "created_by_name": "Backup Automático",
            "created_at": datetime.now(timezone.utc),
            "status": "success" if local_backup_saved else "error",
            "type": "automatic",
            "local_saved": local_backup_saved,
            "google_drive_saved": google_drive_success
        }
        
        if google_drive_success:
            log_entry["drive_file_id"] = drive_file.get('id')
            log_entry["drive_link"] = drive_file.get('webViewLink')
        
        if local_backup_saved:
            log_entry["local_path"] = local_path
        
        if error_message:
            log_entry["error"] = error_message
        
        await db.backup_logs.insert_one(log_entry)
        
        # Send email notification if Google Drive failed but local succeeded
        if local_backup_saved and not google_drive_success:
            try:
                from email_service import send_backup_failure_notification
                send_backup_failure_notification(
                    f"Google Drive falhou, mas o backup local foi salvo.\n\nErro: {error_message}\n\nBackup local: {local_path}",
                    "automático"
                )
            except Exception as e:
                logger.warning(f"Could not send email notification: {e}")
        
        # Send failure notification if local also failed
        if not local_backup_saved:
            try:
                from email_service import send_backup_failure_notification
                send_backup_failure_notification(error_message, "automático")
            except Exception as e:
                logger.warning(f"Could not send email notification: {e}")
        
        logger.info(f"Automatic backup completed. Local: {local_backup_saved}, Google Drive: {google_drive_success}")
        return local_backup_saved
        
    except Exception as e:
        error_message = str(e)
        logger.error(f"Automatic backup failed: {error_message}")
        
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
                "error": error_message
            })
        except:
            pass
        
        # Send failure notification
        try:
            from email_service import send_backup_failure_notification
            send_backup_failure_notification(error_message, "automático")
        except Exception as email_error:
            logger.warning(f"Could not send email notification: {email_error}")
        
        return False
    finally:
        # Cleanup temp file
        if backup_path and os.path.exists(backup_path):
            os.remove(backup_path)

async def backup_scheduler():
    """Run backup scheduler - backup every 12 hours"""
    logger.info(f"Backup scheduler started. Running every {BACKUP_INTERVAL_HOURS} hours.")
    logger.info(f"Local backups will be saved to: {LOCAL_BACKUP_DIR}")
    
    # Run first backup after 1 minute (to not block startup)
    await asyncio.sleep(60)
    
    while True:
        try:
            await perform_automatic_backup()
        except Exception as e:
            logger.error(f"Backup scheduler error: {str(e)}")
        
        # Wait for next backup (12 hours)
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
