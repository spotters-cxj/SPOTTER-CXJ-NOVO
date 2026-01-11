from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level
import json
import os
import asyncio
import logging

router = APIRouter(prefix="/backup", tags=["backup"])
logger = logging.getLogger(__name__)

BACKUP_DIR = "/app/backend/backups"

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user as auth_get_user
    return await auth_get_user(request)

async def require_admin(request: Request):
    """Require admin level or higher"""
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user

def ensure_backup_dir():
    """Ensure backup directory exists"""
    os.makedirs(BACKUP_DIR, exist_ok=True)

async def create_backup(db, backup_type: str = "manual") -> dict:
    """Create a backup of all collections"""
    ensure_backup_dir()
    
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_data = {
        "backup_id": f"backup_{timestamp}",
        "type": backup_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "collections": {}
    }
    
    # Collections to backup
    collections = [
        "users", "photos", "evaluations", "comments", "public_ratings",
        "notifications", "news", "leaders", "memories", "settings",
        "pages", "stats", "airport_timeline", "spotters_milestones",
        "audit_logs", "user_sessions", "gallery", "security_logs"
    ]
    
    for collection_name in collections:
        try:
            collection = db[collection_name]
            documents = await collection.find({}, {"_id": 0}).to_list(None)
            backup_data["collections"][collection_name] = {
                "count": len(documents),
                "documents": documents
            }
            logger.info(f"Backup: {collection_name} - {len(documents)} documentos")
        except Exception as e:
            logger.error(f"Erro ao fazer backup de {collection_name}: {e}")
            backup_data["collections"][collection_name] = {
                "count": 0,
                "documents": [],
                "error": str(e)
            }
    
    # Save to file
    filename = f"backup_{timestamp}_{backup_type}.json"
    filepath = os.path.join(BACKUP_DIR, filename)
    
    # Custom JSON encoder for datetime
    class DateTimeEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            return super().default(obj)
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, cls=DateTimeEncoder, ensure_ascii=False, indent=2)
    
    # Get file size
    file_size = os.path.getsize(filepath)
    
    backup_data["filename"] = filename
    backup_data["filepath"] = filepath
    backup_data["file_size"] = file_size
    backup_data["file_size_mb"] = round(file_size / (1024 * 1024), 2)
    
    logger.info(f"Backup criado: {filename} ({backup_data['file_size_mb']} MB)")
    
    return backup_data

@router.post("/create")
async def create_backup_endpoint(request: Request):
    """Create a manual backup (admin only)"""
    user = await require_admin(request)
    db = await get_db(request)
    
    try:
        backup_info = await create_backup(db, "manual")
        
        # Log the action
        from routes.logs import create_audit_log
        await create_audit_log(
            db,
            admin_id=user["user_id"],
            admin_name=user["name"],
            action="create",
            entity_type="backup",
            entity_id=backup_info["backup_id"],
            entity_name=backup_info["filename"],
            details=f"Backup manual criado: {backup_info['file_size_mb']} MB",
            admin_email=user.get("email")
        )
        
        return {
            "success": True,
            "message": "Backup criado com sucesso",
            "backup_id": backup_info["backup_id"],
            "filename": backup_info["filename"],
            "file_size_mb": backup_info["file_size_mb"],
            "collections": {k: v["count"] for k, v in backup_info["collections"].items()},
            "created_at": backup_info["created_at"]
        }
    except Exception as e:
        logger.error(f"Erro ao criar backup: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {str(e)}")

@router.get("/download/{filename}")
async def download_backup(request: Request, filename: str):
    """Download a backup file (admin only)"""
    await require_admin(request)
    
    filepath = os.path.join(BACKUP_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Arquivo de backup não encontrado")
    
    # Security check - prevent directory traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")
    
    def iterfile():
        with open(filepath, "rb") as f:
            yield from f
    
    return StreamingResponse(
        iterfile(),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Length": str(os.path.getsize(filepath))
        }
    )

@router.get("/list")
async def list_backups(request: Request):
    """List all available backups (admin only)"""
    await require_admin(request)
    
    ensure_backup_dir()
    
    backups = []
    for filename in os.listdir(BACKUP_DIR):
        if filename.endswith(".json") and filename.startswith("backup_"):
            filepath = os.path.join(BACKUP_DIR, filename)
            stat = os.stat(filepath)
            backups.append({
                "filename": filename,
                "size_bytes": stat.st_size,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
            })
    
    # Sort by date descending
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "backups": backups,
        "total": len(backups),
        "backup_directory": BACKUP_DIR
    }

@router.delete("/{filename}")
async def delete_backup(request: Request, filename: str):
    """Delete a backup file (admin only)"""
    user = await require_admin(request)
    db = await get_db(request)
    
    filepath = os.path.join(BACKUP_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Arquivo de backup não encontrado")
    
    # Security check
    if ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")
    
    os.remove(filepath)
    
    # Log the action
    from routes.logs import create_audit_log
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user["name"],
        action="delete",
        entity_type="backup",
        entity_name=filename,
        details=f"Backup excluído: {filename}",
        admin_email=user.get("email")
    )
    
    return {"success": True, "message": f"Backup {filename} excluído"}

@router.get("/status")
async def get_backup_status(request: Request):
    """Get backup system status (admin only)"""
    await require_admin(request)
    
    ensure_backup_dir()
    
    # Get last backup
    backups = []
    for filename in os.listdir(BACKUP_DIR):
        if filename.endswith(".json") and filename.startswith("backup_"):
            filepath = os.path.join(BACKUP_DIR, filename)
            stat = os.stat(filepath)
            backups.append({
                "filename": filename,
                "created_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
            })
    
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    
    last_backup = backups[0] if backups else None
    
    # Calculate total size
    total_size = sum(
        os.path.getsize(os.path.join(BACKUP_DIR, f)) 
        for f in os.listdir(BACKUP_DIR) 
        if f.endswith(".json")
    )
    
    return {
        "enabled": True,
        "backup_directory": BACKUP_DIR,
        "total_backups": len(backups),
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "last_backup": {
            "filename": last_backup["filename"],
            "created_at": last_backup["created_at"].isoformat()
        } if last_backup else None
    }

# Função para backup automático (chamada por scheduler)
async def scheduled_backup(db):
    """Create an automatic scheduled backup"""
    try:
        backup_info = await create_backup(db, "automatic")
        logger.info(f"Backup automático concluído: {backup_info['filename']}")
        
        # Limpar backups antigos (manter últimos 10)
        ensure_backup_dir()
        backups = []
        for filename in os.listdir(BACKUP_DIR):
            if filename.endswith(".json") and "automatic" in filename:
                filepath = os.path.join(BACKUP_DIR, filename)
                stat = os.stat(filepath)
                backups.append({
                    "filename": filename,
                    "filepath": filepath,
                    "created_at": stat.st_mtime
                })
        
        # Sort by date and remove old ones
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        for old_backup in backups[10:]:
            try:
                os.remove(old_backup["filepath"])
                logger.info(f"Backup antigo removido: {old_backup['filename']}")
            except Exception as e:
                logger.error(f"Erro ao remover backup antigo: {e}")
        
        return backup_info
    except Exception as e:
        logger.error(f"Erro no backup automático: {e}")
        return None
