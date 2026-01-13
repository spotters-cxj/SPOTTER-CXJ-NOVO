from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from datetime import datetime, timezone
import os
import json
import subprocess
import zipfile
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import asyncio

router = APIRouter(prefix="/backup", tags=["backup"])

# Google Drive configuration
SCOPES = ['https://www.googleapis.com/auth/drive.file']
CREDENTIALS_PATH = os.getenv('GOOGLE_CREDENTIALS_PATH', '/app/backend/google_credentials.json')
FOLDER_ID = os.getenv('GOOGLE_DRIVE_FOLDER_ID')

async def get_db(request: Request):
    return request.app.state.db

async def require_gestao(request: Request):
    """Require gestao level or higher for backup operations"""
    from routes.auth import get_current_user
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Gestão access required")
    return user

def get_drive_service():
    """Initialize Google Drive API service"""
    if not os.path.exists(CREDENTIALS_PATH):
        raise HTTPException(status_code=500, detail="Google credentials not found")
    
    credentials = service_account.Credentials.from_service_account_file(
        CREDENTIALS_PATH, 
        scopes=SCOPES
    )
    service = build('drive', 'v3', credentials=credentials)
    return service

def create_mongo_dump():
    """Create MongoDB dump using JSON export (no mongodump needed)"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dump_dir = f"/tmp/backup_mongo_{timestamp}"
    os.makedirs(dump_dir, exist_ok=True)
    
    # We'll export directly in the backup function using the db connection
    return dump_dir

async def export_database_to_json(db, dump_dir):
    """Export all collections to JSON files"""
    from bson import json_util
    import json
    
    collections = await db.list_collection_names()
    
    for col_name in collections:
        documents = await db[col_name].find({}, {"_id": 0}).to_list(10000)
        
        # Write to JSON file
        json_path = os.path.join(dump_dir, f"{col_name}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(documents, f, default=str, ensure_ascii=False, indent=2)
    
    return collections

async def create_backup_zip_async(db):
    """Create complete backup ZIP file"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_name = f"spotters_backup_{timestamp}.zip"
    backup_path = f"/tmp/{backup_name}"
    
    # Create dump directory
    dump_dir = create_mongo_dump()
    
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
    
    # Cleanup dump directory
    import shutil
    shutil.rmtree(dump_dir, ignore_errors=True)
    
    return backup_path, backup_name

def upload_to_drive(file_path, file_name):
    """Upload backup to Google Drive"""
    service = get_drive_service()
    
    file_metadata = {
        'name': file_name,
        'parents': [FOLDER_ID]
    }
    
    media = MediaFileUpload(file_path, resumable=True)
    
    try:
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()
        
        return file
    except Exception as e:
        error_message = str(e)
        if 'storageQuotaExceeded' in error_message or 'storage quota' in error_message.lower():
            raise Exception(
                "A Service Account não tem cota de armazenamento. "
                "SOLUÇÃO: Compartilhe a pasta do Google Drive com a Service Account "
                "(email encontrado em google_credentials.json 'client_email') "
                "e dê permissão de 'Editor'."
            )
        raise

@router.post("/create")
async def create_backup(request: Request, background_tasks: BackgroundTasks):
    """Create and upload backup to Google Drive (gestao only)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    if not FOLDER_ID:
        raise HTTPException(
            status_code=500, 
            detail="Google Drive folder ID not configured"
        )
    
    try:
        # Create backup ZIP using async method
        backup_path, backup_name = await create_backup_zip_async(db)
        
        # Upload to Google Drive
        result = upload_to_drive(backup_path, backup_name)
        
        # Cleanup local file
        os.remove(backup_path)
        
        # Log backup
        await db.backup_logs.insert_one({
            "backup_id": result['id'],
            "filename": backup_name,
            "created_by": user['user_id'],
            "created_by_name": user['name'],
            "created_at": datetime.now(timezone.utc),
            "drive_link": result.get('webViewLink'),
            "status": "success"
        })
        
        return {
            "message": "Backup criado e enviado para Google Drive com sucesso!",
            "filename": backup_name,
            "drive_link": result.get('webViewLink'),
            "file_id": result['id']
        }
        
    except Exception as e:
        # Log error
        await db.backup_logs.insert_one({
            "filename": "error",
            "created_by": user['user_id'],
            "created_at": datetime.now(timezone.utc),
            "status": "error",
            "error": str(e)
        })
        
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {str(e)}")

@router.get("/history")
async def get_backup_history(request: Request, limit: int = 10):
    """Get backup history (admin only)"""
    await require_gestao(request)
    db = await get_db(request)
    
    logs = await db.backup_logs.find(
        {}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return logs

@router.get("/status")
async def get_backup_status(request: Request):
    """Get backup system status (admin only)"""
    await require_gestao(request)
    
    # Check if credentials exist
    creds_exist = os.path.exists(CREDENTIALS_PATH)
    folder_configured = bool(FOLDER_ID)
    
    # Get last backup
    db = await get_db(request)
    last_backup = await db.backup_logs.find_one(
        {"status": "success"}, 
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    return {
        "configured": creds_exist and folder_configured,
        "credentials_path": CREDENTIALS_PATH,
        "credentials_exist": creds_exist,
        "folder_id": FOLDER_ID,
        "folder_configured": folder_configured,
        "last_backup": last_backup
    }

async def scheduled_backup(db):
    """Function for scheduled automatic backups"""
    try:
        # Create backup using async method
        backup_path, backup_name = await create_backup_zip_async(db)
        
        # Upload to Drive
        result = upload_to_drive(backup_path, backup_name)
        
        # Cleanup
        os.remove(backup_path)
        
        # Log
        await db.backup_logs.insert_one({
            "backup_id": result['id'],
            "filename": backup_name,
            "created_by": "system",
            "created_by_name": "Auto Backup",
            "created_at": datetime.now(timezone.utc),
            "drive_link": result.get('webViewLink'),
            "status": "success",
            "type": "automatic"
        })
        
        logger.info(f"Backup automático concluído: {backup_name}")
        return True
    except Exception as e:
        logger.error(f"Erro no backup automático: {e}")
        await db.backup_logs.insert_one({
            "filename": "auto_backup_error",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc),
            "status": "error",
            "error": str(e),
            "type": "automatic"
        })
        return False
