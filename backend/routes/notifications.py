from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/notifications", tags=["notifications"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user_from_request
    return await get_current_user_from_request(request)

@router.get("")
async def list_notifications(request: Request, unread_only: bool = False):
    """List user's notifications"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    query = {"user_id": user["user_id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return notifications

@router.get("/count")
async def get_unread_count(request: Request):
    """Get unread notifications count"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "read": False
    })
    
    return {"unread": count}

@router.put("/{notification_id}/read")
async def mark_as_read(request: Request, notification_id: str):
    """Mark notification as read"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"message": "Marcada como lida"}

@router.put("/read-all")
async def mark_all_as_read(request: Request):
    """Mark all notifications as read"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    await db.notifications.update_many(
        {"user_id": user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "Todas marcadas como lidas"}
