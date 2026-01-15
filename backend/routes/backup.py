from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from datetime import datetime, timezone
import os
import json
import zipfile
import shutil
import asyncio

router = APIRouter(prefix="/backup", tags=["backup"])

# Config from environment
GOOGLE_DRIVE_FOLDER_ID = os.environ.get('GOOGLE_DRIVE_FOLDER_ID', '103tuOyqiSzCDkdpVcWyHYKYXro3pG1_y')
GOOGLE_CREDENTIALS_PATH = os.environ.get('GOOGLE_CREDENTIALS_PATH', '/app/backend/google_credentials.json')
LOCAL_BACKUP_DIR = "/app/backend/backups"

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

def get_google_drive_service():
    """Initialize Google Drive API service"""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        
        if not os.path.exists(GOOGLE_CREDENTIALS_PATH):
            raise Exception(f"Credentials file not found: {GOOGLE_CREDENTIALS_PATH}")
        
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/drive.file']
        )
        
        service = build('drive', 'v3', credentials=credentials)
        return service
    except Exception as e:
        raise Exception(f"Failed to initialize Google Drive: {str(e)}")

async def export_database_to_json(db, dump_dir):
    """Export all collections to JSON files"""
    collections = await db.list_collection_names()
    
    for col_name in collections:
        documents = await db[col_name].find({}, {"_id": 0}).to_list(10000)
        json_path = os.path.join(dump_dir, f"{col_name}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(documents, f, default=str, ensure_ascii=False, indent=2)
    
    return collections

async def create_backup_zip(db):
    """Create complete backup ZIP file"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_name = f"spotters_backup_{timestamp}.zip"
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

def upload_to_google_drive(file_path: str, file_name: str):
    """Upload file to Google Drive"""
    from googleapiclient.http import MediaFileUpload
    
    service = get_google_drive_service()
    
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

@router.post("/google-drive")
async def create_google_drive_backup(request: Request):
    """Create backup and upload to Google Drive (gestao only)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    try:
        backup_path, backup_name = await create_backup_zip(db)
        
        try:
            drive_file = upload_to_google_drive(backup_path, backup_name)
            
            await db.backup_logs.insert_one({
                "backup_id": f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "filename": backup_name,
                "created_by": user['user_id'],
                "created_by_name": user['name'],
                "created_at": datetime.now(timezone.utc),
                "status": "success",
                "type": "google_drive",
                "drive_file_id": drive_file.get('id'),
                "drive_link": drive_file.get('webViewLink')
            })
            
            return {
                "success": True,
                "message": "Backup enviado para Google Drive com sucesso!",
                "drive_link": drive_file.get('webViewLink')
            }
        finally:
            if os.path.exists(backup_path):
                os.remove(backup_path)
                
    except Exception as e:
        await db.backup_logs.insert_one({
            "backup_id": f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "filename": "error",
            "created_by": user['user_id'],
            "created_by_name": user['name'],
            "created_at": datetime.now(timezone.utc),
            "status": "error",
            "type": "google_drive",
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=f"Erro ao enviar backup: {str(e)}")

@router.post("/manual")
async def create_manual_backup(request: Request):
    """Create backup and return download link (gestao only)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    try:
        backup_path, backup_name = await create_backup_zip(db)
        
        await db.backup_logs.insert_one({
            "backup_id": f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "filename": backup_name,
            "created_by": user['user_id'],
            "created_by_name": user['name'],
            "created_at": datetime.now(timezone.utc),
            "status": "success",
            "type": "manual_download"
        })
        
        return FileResponse(
            path=backup_path,
            filename=backup_name,
            media_type="application/zip",
            background=BackgroundTasks()
        )
        
    except Exception as e:
        await db.backup_logs.insert_one({
            "backup_id": f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "filename": "error",
            "created_by": user['user_id'],
            "created_by_name": user['name'],
            "created_at": datetime.now(timezone.utc),
            "status": "error",
            "type": "manual_download",
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {str(e)}")

@router.get("/local")
async def list_local_backups(request: Request):
    """List local backups stored on server (gestao only)"""
    await require_gestao(request)
    
    backups = []
    if os.path.exists(LOCAL_BACKUP_DIR):
        for f in os.listdir(LOCAL_BACKUP_DIR):
            if f.endswith('.zip'):
                full_path = os.path.join(LOCAL_BACKUP_DIR, f)
                stat = os.stat(full_path)
                backups.append({
                    "filename": f,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "path": full_path
                })
    
    # Sort by date (newest first)
    backups.sort(key=lambda x: x['created_at'], reverse=True)
    return backups

@router.get("/local/download/{filename}")
async def download_local_backup(request: Request, filename: str):
    """Download a local backup file (gestao only)"""
    await require_gestao(request)
    
    # Security: prevent path traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")
    
    file_path = os.path.join(LOCAL_BACKUP_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/zip"
    )

@router.delete("/local/{filename}")
async def delete_local_backup(request: Request, filename: str):
    """Delete a local backup file (gestao only)"""
    await require_gestao(request)
    
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")
    
    file_path = os.path.join(LOCAL_BACKUP_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    os.remove(file_path)
    return {"success": True, "message": "Backup excluído"}

@router.post("/test-email")
async def test_email_notification(request: Request):
    """Send a test email notification (gestao only)"""
    await require_gestao(request)
    
    try:
        from email_service import send_test_email
        result = send_test_email()
        
        if result:
            return {"success": True, "message": "Email de teste enviado!"}
        else:
            return {"success": False, "message": "Falha ao enviar email. Verifique as configurações SMTP."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")

@router.get("/history")
async def get_backup_history(request: Request, limit: int = 20):
    """Get backup history (gestao only)"""
    await require_gestao(request)
    db = await get_db(request)
    
    logs = await db.backup_logs.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return logs

@router.get("/status")
async def get_backup_status(request: Request):
    """Get backup system status (gestao only)"""
    await require_gestao(request)
    db = await get_db(request)
    
    last_backup = await db.backup_logs.find_one(
        {"status": "success"}, 
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    last_drive_backup = await db.backup_logs.find_one(
        {"status": "success", "type": "google_drive"}, 
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    last_auto_backup = await db.backup_logs.find_one(
        {"type": "automatic"}, 
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    # Count local backups
    local_backup_count = 0
    local_backup_size = 0
    if os.path.exists(LOCAL_BACKUP_DIR):
        for f in os.listdir(LOCAL_BACKUP_DIR):
            if f.endswith('.zip'):
                local_backup_count += 1
                local_backup_size += os.path.getsize(os.path.join(LOCAL_BACKUP_DIR, f))
    
    google_drive_configured = os.path.exists(GOOGLE_CREDENTIALS_PATH) and bool(GOOGLE_DRIVE_FOLDER_ID)
    
    # Check email configuration
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    email_configured = bool(smtp_password)
    
    return {
        "google_drive_configured": google_drive_configured,
        "google_drive_folder_id": GOOGLE_DRIVE_FOLDER_ID,
        "email_notifications_configured": email_configured,
        "notification_email": os.environ.get('NOTIFICATION_EMAIL', 'spotterscxj@gmail.com'),
        "local_backup_count": local_backup_count,
        "local_backup_size_mb": round(local_backup_size / (1024 * 1024), 2),
        "backup_interval_hours": 12,
        "last_backup": last_backup,
        "last_drive_backup": last_drive_backup,
        "last_auto_backup": last_auto_backup
    }

@router.get("/config")
async def get_backup_config(request: Request):
    """Get backup configuration (gestao only)"""
    await require_gestao(request)
    
    return {
        "google_drive_folder_id": GOOGLE_DRIVE_FOLDER_ID,
        "credentials_configured": os.path.exists(GOOGLE_CREDENTIALS_PATH),
        "local_backup_dir": LOCAL_BACKUP_DIR,
        "email_configured": bool(os.environ.get('SMTP_PASSWORD', '')),
        "notification_email": os.environ.get('NOTIFICATION_EMAIL', 'spotterscxj@gmail.com')
    }

@router.post("/create")
async def create_backup(request: Request):
    """Alias for manual backup (gestao only)"""
    return await create_manual_backup(request)
