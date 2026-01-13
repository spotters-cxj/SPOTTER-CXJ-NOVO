from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone
import uuid
import os
from PIL import Image
import io

router = APIRouter(prefix="/memories", tags=["memories"])

async def get_db(request: Request):
    return request.app.state.db

async def require_director(request: Request):
    """Require diretor_aeroporto, lider, admin or gestao"""
    from routes.auth import get_current_user
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user(request)
    
    allowed_tags = ["diretor_aeroporto", "lider", "admin", "gestao"]
    if not any(tag in user.get("tags", []) for tag in allowed_tags):
        raise HTTPException(
            status_code=403, 
            detail="Apenas diretores do aeroporto ou administradores podem gerenciar recordações"
        )
    return user

@router.get("")
async def list_memories(request: Request, limit: int = 100):
    """List all memories (public)"""
    db = await get_db(request)
    memories = await db.memories.find({}, {"_id": 0}).sort("year", -1).limit(limit).to_list(limit)
    return memories

@router.post("")
async def create_memory(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    year: str = Form(...),
    author: str = Form(...),
    file: UploadFile = File(...)
):
    """Create new memory - Directors only"""
    user = await require_director(request)
    db = await get_db(request)
    
    # Validate file
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Apenas imagens são permitidas")
    
    # Read and validate
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 10MB")
    
    try:
        img = Image.open(io.BytesIO(file_content))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Arquivo de imagem inválido")
    
    # Generate ID and save file
    memory_id = f"memory_{uuid.uuid4().hex[:12]}"
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{memory_id}.{file_ext}"
    upload_dir = "/app/backend/uploads/memories"
    os.makedirs(upload_dir, exist_ok=True)
    
    with open(f"{upload_dir}/{filename}", "wb") as f:
        f.write(file_content)
    
    # Create record
    memory_data = {
        "memory_id": memory_id,
        "title": title,
        "description": description,
        "year": year,
        "author": author,
        "url": f"/api/uploads/memories/{filename}",
        "created_by": user["user_id"],
        "created_by_name": user["name"],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.memories.insert_one(memory_data)
    return {"memory_id": memory_id, "message": "Recordação criada com sucesso"}

@router.put("/{memory_id}")
async def update_memory(
    request: Request,
    memory_id: str,
    title: str = Form(None),
    description: str = Form(None),
    year: str = Form(None),
    author: str = Form(None)
):
    """Update memory - Directors only"""
    user = await require_director(request)
    db = await get_db(request)
    
    memory = await db.memories.find_one({"memory_id": memory_id})
    if not memory:
        raise HTTPException(status_code=404, detail="Recordação não encontrada")
    
    # Build update dict with only provided fields
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if description is not None:
        update_data["description"] = description
    if year is not None:
        update_data["year"] = year
    if author is not None:
        update_data["author"] = author
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.memories.update_one(
            {"memory_id": memory_id},
            {"$set": update_data}
        )
    
    return {"message": "Recordação atualizada com sucesso"}

@router.delete("/{memory_id}")
async def delete_memory(request: Request, memory_id: str):
    """Delete memory - Directors only"""
    user = await require_director(request)
    db = await get_db(request)
    
    memory = await db.memories.find_one({"memory_id": memory_id}, {"_id": 0})
    if not memory:
        raise HTTPException(status_code=404, detail="Recordação não encontrada")
    
    # Delete file
    url = memory.get("url", "")
    if url.startswith("/api/uploads/memories/"):
        filename = url.split("/")[-1]
        file_path = f"/app/backend/uploads/memories/{filename}"
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
    
    await db.memories.delete_one({"memory_id": memory_id})
    return {"message": "Recordação excluída com sucesso"}
