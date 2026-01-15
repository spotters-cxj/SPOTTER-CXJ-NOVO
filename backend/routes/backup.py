from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from datetime import datetime, timezone
import os
import json
import zipfile
import shutil

router = APIRouter(prefix="/backup", tags=["backup"])

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
    shutil.rmtree(dump_dir, ignore_errors=True)
    
    return backup_path, backup_name

@router.post("/create")
async def create_backup(request: Request):
    """Create backup and return download link (gestao only)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    try:
        # Create backup ZIP
        backup_path, backup_name = await create_backup_zip(db)
        
        # Log backup
        await db.backup_logs.insert_one({
            "backup_id": f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "filename": backup_name,
            "created_by": user['user_id'],
            "created_by_name": user['name'],
            "created_at": datetime.now(timezone.utc),
            "status": "success",
            "type": "manual"
        })
        
        # Return file for download
        return FileResponse(
            path=backup_path,
            filename=backup_name,
            media_type="application/zip"
        )
        
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
    
    # Get last backup
    last_backup = await db.backup_logs.find_one(
        {"status": "success"}, 
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    return {
        "configured": True,
        "last_backup": last_backup
    }
