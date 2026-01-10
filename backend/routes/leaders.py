from fastapi import APIRouter, HTTPException, Request
from typing import List
from datetime import datetime, timezone
from models import Leader, LeaderCreate, LeaderUpdate
import uuid

router = APIRouter(prefix="/leaders", tags=["leaders"])

async def get_db(request: Request):
    return request.app.state.db

async def require_admin(request: Request):
    from routes.auth import get_current_user
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Gestao access required")
    return user

@router.get("")
async def list_leaders(request: Request):
    """List all leaders (public)"""
    db = await get_db(request)
    leaders = await db.leaders.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return leaders

@router.post("")
async def create_leader(request: Request, leader: LeaderCreate):
    """Create new leader (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    leader_data = leader.dict()
    leader_data["leader_id"] = f"leader_{uuid.uuid4().hex[:8]}"
    leader_data["created_at"] = datetime.now(timezone.utc)
    
    await db.leaders.insert_one(leader_data)
    
    return {**leader_data, "_id": None}

@router.put("/{leader_id}")
async def update_leader(request: Request, leader_id: str, update: LeaderUpdate):
    """Update leader (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    existing = await db.leaders.find_one({"leader_id": leader_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    update_data = update.dict(exclude_unset=True)
    if update_data:
        await db.leaders.update_one({"leader_id": leader_id}, {"$set": update_data})
    
    updated = await db.leaders.find_one({"leader_id": leader_id}, {"_id": 0})
    return updated

@router.delete("/{leader_id}")
async def delete_leader(request: Request, leader_id: str):
    """Delete leader (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    result = await db.leaders.delete_one({"leader_id": leader_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    return {"message": "Leader deleted"}
