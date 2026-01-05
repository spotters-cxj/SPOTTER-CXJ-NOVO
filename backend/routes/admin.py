from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
from models import User, UserUpdate
from routes.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

async def get_db(request: Request):
    return request.app.state.db

async def require_admin(request: Request):
    """Require admin role"""
    from routes.auth import get_current_user as get_user
    user = await get_user(request)
    if user.role not in ["admin_principal", "admin_authorized"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_admin_principal(request: Request):
    """Require admin principal role"""
    from routes.auth import get_current_user as get_user
    user = await get_user(request)
    if user.role != "admin_principal":
        raise HTTPException(status_code=403, detail="Admin principal access required")
    return user

@router.get("/users")
async def list_users(request: Request):
    """List all users (admin only)"""
    admin = await require_admin(request)
    db = await get_db(request)
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@router.put("/users/{user_id}/role")
async def update_user_role(request: Request, user_id: str, update: UserUpdate):
    """Update user role (admin principal only)"""
    admin = await require_admin_principal(request)
    db = await get_db(request)
    
    # Cannot change admin_principal role
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.get("role") == "admin_principal":
        raise HTTPException(status_code=400, detail="Cannot change admin principal role")
    
    if update.role and update.role not in ["admin_authorized", "contributor"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    update_data = {}
    if update.role:
        update_data["role"] = update.role
    
    await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    return {"message": "User role updated"}

@router.put("/users/{user_id}/approve")
async def approve_user(request: Request, user_id: str, update: UserUpdate):
    """Approve or reject user (admin only)"""
    admin = await require_admin(request)
    db = await get_db(request)
    
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update.approved is not None:
        await db.users.update_one({"user_id": user_id}, {"$set": {"approved": update.approved}})
    
    return {"message": "User approval status updated"}

@router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Delete user (admin only, cannot delete admin_principal)"""
    admin = await require_admin(request)
    db = await get_db(request)
    
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.get("role") == "admin_principal":
        raise HTTPException(status_code=400, detail="Cannot delete admin principal")
    
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": "User deleted"}
