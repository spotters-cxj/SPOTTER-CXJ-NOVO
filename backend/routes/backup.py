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
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

router = APIRouter(prefix="/backup", tags=["backup"])

# Google Drive configuration
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_credentials_path():
    return os.environ.get('GOOGLE_CREDENTIALS_PATH', '/app/backend/google_credentials.json')

def get_folder_id():
    return os.environ.get('GOOGLE_DRIVE_FOLDER_ID', '')

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
    creds_path = get_credentials_path()
    if not os.path.exists(creds_path):
        raise HTTPException(status_code=500, detail="Google credentials not found")
    
    credentials = service_account.Credentials.from_service_account_file(
        creds_path, 
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
    folder_id = get_folder_id()
    
    file_metadata = {
        'name': file_name,
        'parents': [folder_id]
    }
    
    media = MediaFileUpload(file_path, resumable=True)
    
    try:
        # First, verify the folder exists and is accessible
        try:
            folder = service.files().get(
                fileId=folder_id,
                supportsAllDrives=True,
                fields='id, name, owners'
            ).execute()
            print(f"Uploading to folder: {folder.get('name')}")
        except Exception as folder_error:
            raise Exception(
                f"Não foi possível acessar a pasta do Google Drive. "
                f"Verifique se a pasta foi compartilhada com a Service Account. "
                f"Erro: {str(folder_error)}"
            )
        
        # Upload the file
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            supportsAllDrives=True,
            fields='id, name, webViewLink'
        ).execute()
        
        return file
    except Exception as e:
        error_message = str(e)
        if 'storageQuotaExceeded' in error_message or 'storage quota' in error_message.lower():
            raise Exception(
                "Erro de cota de armazenamento. "
                "A Service Account precisa de permissão de EDITOR na pasta do Google Drive. "
                "Certifique-se de: 1) Compartilhar a pasta (não apenas um arquivo) "
                "2) Dar permissão de Editor (não apenas Visualizador) "
                "3) Email: backup-site-spotters@backup-spotters-cxj.iam.gserviceaccount.com"
            )
        raise

@router.post("/create-local")
async def create_local_backup(request: Request):
    """Create backup and return download link (gestao only) - Alternative when Google Drive fails"""
    from fastapi.responses import FileResponse
    
    user = await require_gestao(request)
    db = await get_db(request)
    
    try:
        # Create backup ZIP
        backup_path, backup_name = await create_backup_zip_async(db)
        
        # Log backup
        await db.backup_logs.insert_one({
            "backup_id": f"local_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "filename": backup_name,
            "created_by": user['user_id'],
            "created_by_name": user['name'],
            "created_at": datetime.now(timezone.utc),
            "status": "success",
            "type": "local"
        })
        
        return FileResponse(
            path=backup_path,
            filename=backup_name,
            media_type="application/zip"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {str(e)}")

@router.post("/create")
async def create_backup(request: Request, background_tasks: BackgroundTasks):
    """Create and upload backup to Google Drive (gestao only)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    folder_id = get_folder_id()
    if not folder_id:
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
    
    creds_path = get_credentials_path()
    folder_id = get_folder_id()
    
    # Check if credentials exist
    creds_exist = os.path.exists(creds_path)
    folder_configured = bool(folder_id)
    
    # Get last backup
    db = await get_db(request)
    last_backup = await db.backup_logs.find_one(
        {"status": "success"}, 
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    return {
        "configured": creds_exist and folder_configured,
        "credentials_path": creds_path,
        "credentials_exist": creds_exist,
        "folder_id": folder_id,
        "folder_configured": folder_configured,
        "last_backup": last_backup
    }

async def scheduled_backup(db):
    """Function for scheduled automatic backups"""
    folder_id = get_folder_id()
    if not folder_id:
        print("Backup automático cancelado: FOLDER_ID não configurado")
        return
    
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
