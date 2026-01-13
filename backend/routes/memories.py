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
async def list_memories(request: Request):
    """List all memories (public)"""
    db = await get_db(request)
    memories = await db.memories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return memories

@router.post("")
async def create_memory(request: Request, memory: MemoryCreate):
    """Create new memory (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    memory_data = memory.dict()
    memory_data["memory_id"] = f"memory_{uuid.uuid4().hex[:8]}"
    memory_data["created_at"] = datetime.now(timezone.utc)
    
    await db.memories.insert_one(memory_data)
    
    return {**memory_data, "_id": None}

@router.put("/{memory_id}")
async def update_memory(request: Request, memory_id: str, update: MemoryUpdate):
    """Update memory (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    existing = await db.memories.find_one({"memory_id": memory_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    update_data = update.dict(exclude_unset=True)
    if update_data:
        await db.memories.update_one({"memory_id": memory_id}, {"$set": update_data})
    
    updated = await db.memories.find_one({"memory_id": memory_id}, {"_id": 0})
    return updated

@router.delete("/{memory_id}")
async def delete_memory(request: Request, memory_id: str):
    """Delete memory (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    result = await db.memories.delete_one({"memory_id": memory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    return {"message": "Memory deleted"}
