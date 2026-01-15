"""
Scheduled Tasks for Spotters CXJ
- Automatic backup every 12 hours
- Weekly statistics report every Sunday
"""
import asyncio
import os
import shutil
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

# Configuration
BACKUP_INTERVAL_HOURS = 12
REPORT_CHECK_INTERVAL_HOURS = 6  # Check every 6 hours if it's time for weekly report
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
GOOGLE_DRIVE_FOLDER_ID = os.environ.get('GOOGLE_DRIVE_FOLDER_ID', '')
GOOGLE_CREDENTIALS_PATH = os.environ.get('GOOGLE_CREDENTIALS_PATH', '/app/backend/google_credentials.json')
LOCAL_BACKUP_DIR = "/app/backend/backups"
MAX_LOCAL_BACKUPS = 10

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
        collections = await export_database_to_json(db, dump_dir)
        
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for col_name in collections:
                json_path = os.path.join(dump_dir, f"{col_name}.json")
                if os.path.exists(json_path):
                    zipf.write(json_path, f"database/{col_name}.json")
            
            uploads_dir = "/app/backend/uploads"
            if os.path.exists(uploads_dir):
                for root, dirs, files in os.walk(uploads_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, uploads_dir)
                        zipf.write(file_path, f"uploads/{arcname}")
        
        return backup_path, backup_name
    finally:
        shutil.rmtree(dump_dir, ignore_errors=True)

def save_backup_locally(backup_path: str, backup_name: str) -> str:
    """Save backup to local directory"""
    os.makedirs(LOCAL_BACKUP_DIR, exist_ok=True)
    local_path = os.path.join(LOCAL_BACKUP_DIR, backup_name)
    shutil.copy2(backup_path, local_path)
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
        
        backups.sort(key=lambda x: x[1], reverse=True)
        
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
        raise Exception(f"Credentials file not found")
    
    if not GOOGLE_DRIVE_FOLDER_ID:
        raise Exception("Google Drive folder ID not configured")
    
    credentials = service_account.Credentials.from_service_account_file(
        GOOGLE_CREDENTIALS_PATH,
        scopes=['https://www.googleapis.com/auth/drive.file']
    )
    
    service = build('drive', 'v3', credentials=credentials)
    
    file_metadata = {
        'name': file_name,
        'parents': [GOOGLE_DRIVE_FOLDER_ID]
    }
    
    media = MediaFileUpload(file_path, mimetype='application/zip', resumable=True)
    
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
    local_path = None
    
    try:
        logger.info("Starting automatic backup...")
        
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
            if GOOGLE_DRIVE_FOLDER_ID:
                drive_file = upload_to_google_drive(backup_path, backup_name)
                google_drive_success = True
                logger.info(f"Backup uploaded to Google Drive")
        except Exception as e:
            logger.warning(f"Google Drive upload failed: {e}")
            if not error_message:
                error_message = f"Google Drive: {str(e)}"
        
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
        
        if local_backup_saved:
            log_entry["local_path"] = local_path
        
        if error_message:
            log_entry["error"] = error_message
        
        await db.backup_logs.insert_one(log_entry)
        
        # Send email if failed
        if not local_backup_saved:
            try:
                from email_service import send_backup_failure_notification
                send_backup_failure_notification(error_message, "automático")
            except Exception as e:
                logger.warning(f"Could not send email notification: {e}")
        
        logger.info(f"Backup completed. Local: {local_backup_saved}, Drive: {google_drive_success}")
        return local_backup_saved
        
    except Exception as e:
        error_message = str(e)
        logger.error(f"Automatic backup failed: {error_message}")
        
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
        
        try:
            from email_service import send_backup_failure_notification
            send_backup_failure_notification(error_message, "automático")
        except:
            pass
        
        return False
    finally:
        if backup_path and os.path.exists(backup_path):
            os.remove(backup_path)

async def collect_weekly_stats():
    """Collect statistics for weekly report"""
    db = await get_db()
    
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    
    # Total counts
    total_users = await db.users.count_documents({})
    total_photos = await db.photos.count_documents({})
    total_news = await db.news.count_documents({"published": True})
    
    # Pending counts
    pending_photos = await db.photos.count_documents({"status": "pending"})
    pending_users = await db.users.count_documents({"approved": False})
    
    # Weekly counts
    new_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    new_photos = await db.photos.count_documents({"created_at": {"$gte": week_ago}})
    photos_approved = await db.photos.count_documents({
        "status": "approved",
        "updated_at": {"$gte": week_ago}
    })
    photos_rejected = await db.photos.count_documents({
        "status": "rejected", 
        "updated_at": {"$gte": week_ago}
    })
    
    # Top contributors this week
    pipeline = [
        {"$match": {"created_at": {"$gte": week_ago}}},
        {"$group": {"_id": "$author_id", "count": {"$sum": 1}, "name": {"$first": "$author_name"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_contributors_cursor = db.photos.aggregate(pipeline)
    top_contributors = []
    async for doc in top_contributors_cursor:
        top_contributors.append({"name": doc.get("name", "N/A"), "count": doc.get("count", 0)})
    
    # Backup info
    local_backup_count = 0
    if os.path.exists(LOCAL_BACKUP_DIR):
        local_backup_count = len([f for f in os.listdir(LOCAL_BACKUP_DIR) if f.endswith('.zip')])
    
    last_backup_doc = await db.backup_logs.find_one(
        {"status": "success"},
        {"_id": 0, "created_at": 1},
        sort=[("created_at", -1)]
    )
    last_backup = "N/A"
    if last_backup_doc:
        last_backup = last_backup_doc["created_at"].strftime('%d/%m/%Y %H:%M')
    
    return {
        "total_users": total_users,
        "total_photos": total_photos,
        "total_news": total_news,
        "pending_photos": pending_photos,
        "pending_users": pending_users,
        "new_users": new_users,
        "new_photos": new_photos,
        "photos_approved": photos_approved,
        "photos_rejected": photos_rejected,
        "top_contributors": top_contributors,
        "local_backups": local_backup_count,
        "last_backup": last_backup
    }

async def send_weekly_report_task():
    """Send weekly statistics report"""
    try:
        logger.info("Collecting weekly statistics...")
        stats = await collect_weekly_stats()
        
        logger.info("Sending weekly report email...")
        from email_service import send_weekly_report
        result = send_weekly_report(stats)
        
        if result:
            logger.info("Weekly report sent successfully!")
        else:
            logger.warning("Failed to send weekly report")
            
        return result
    except Exception as e:
        logger.error(f"Error sending weekly report: {e}")
        return False

async def backup_scheduler():
    """Run backup scheduler - backup every 12 hours"""
    logger.info(f"Backup scheduler started. Running every {BACKUP_INTERVAL_HOURS} hours.")
    logger.info(f"Local backups saved to: {LOCAL_BACKUP_DIR}")
    
    # Wait 1 minute before first backup
    await asyncio.sleep(60)
    
    while True:
        try:
            await perform_automatic_backup()
        except Exception as e:
            logger.error(f"Backup scheduler error: {str(e)}")
        
        await asyncio.sleep(BACKUP_INTERVAL_HOURS * 60 * 60)

async def weekly_report_scheduler():
    """Run weekly report scheduler - sends report every Sunday at 10:00 AM"""
    logger.info("Weekly report scheduler started. Reports sent every Sunday at 10:00 AM.")
    
    # Wait 2 minutes before starting checks
    await asyncio.sleep(120)
    
    last_report_week = None
    
    while True:
        try:
            now = datetime.now()
            current_week = now.isocalendar()[1]
            
            # Send report on Sunday (weekday 6) around 10:00 AM
            if now.weekday() == 6 and 9 <= now.hour <= 11 and last_report_week != current_week:
                logger.info("It's Sunday! Sending weekly report...")
                await send_weekly_report_task()
                last_report_week = current_week
                
        except Exception as e:
            logger.error(f"Weekly report scheduler error: {str(e)}")
        
        # Check every 6 hours
        await asyncio.sleep(REPORT_CHECK_INTERVAL_HOURS * 60 * 60)

def start_backup_scheduler():
    """Start the backup scheduler in background"""
    loop = asyncio.get_event_loop()
    loop.create_task(backup_scheduler())
    loop.create_task(weekly_report_scheduler())
    logger.info("Backup and weekly report schedulers created")

# Function to manually trigger weekly report (for testing)
async def trigger_weekly_report():
    """Manually trigger weekly report"""
    return await send_weekly_report_task()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(trigger_weekly_report())
