from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level
import uuid

router = APIRouter(prefix="/logs", tags=["logs"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user as auth_get_user
    return await auth_get_user(request)

async def require_gestao(request: Request):
    """Require gestao level or higher to view logs"""
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito à gestão")
    return user

def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

async def create_audit_log(
    db,
    admin_id: str,
    admin_name: str,
    action: str,
    entity_type: str,
    entity_id: str = None,
    entity_name: str = None,
    details: str = None,
    old_value: dict = None,
    new_value: dict = None,
    ip_address: str = None,
    admin_email: str = None
):
    """Create an audit log entry"""
    log = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "admin_id": admin_id,
        "admin_name": admin_name,
        "admin_email": admin_email,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_name": entity_name,
        "details": details,
        "old_value": old_value,
        "new_value": new_value,
        "ip_address": ip_address,
        "created_at": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(log)
    return log

@router.get("")
async def list_logs(
    request: Request, 
    limit: int = 100, 
    skip: int = 0,
    action: str = None,
    entity_type: str = None,
    admin_id: str = None
):
    """List audit logs (gestao+)"""
    await require_gestao(request)
    db = await get_db(request)
    
    query = {}
    if action:
        query["action"] = action
    if entity_type:
        query["entity_type"] = entity_type
    if admin_id:
        query["admin_id"] = admin_id
    
    logs = await db.audit_logs.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.audit_logs.count_documents(query)
    
    return {
        "logs": logs,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.get("/actions")
async def get_action_types(request: Request):
    """Get available action types"""
    await require_gestao(request)
    
    return {
        "actions": [
            {"value": "create", "label": "Criação"},
            {"value": "update", "label": "Atualização"},
            {"value": "delete", "label": "Exclusão"},
            {"value": "approve", "label": "Aprovação"},
            {"value": "reject", "label": "Rejeição"},
            {"value": "tag_change", "label": "Alteração de Tag"},
            {"value": "settings_change", "label": "Alteração de Configurações"},
            {"value": "login", "label": "Login"},
            {"value": "logout", "label": "Logout"}
        ],
        "entity_types": [
            {"value": "user", "label": "Usuário"},
            {"value": "photo", "label": "Foto"},
            {"value": "news", "label": "Notícia"},
            {"value": "leader", "label": "Líder"},
            {"value": "memory", "label": "Recordação"},
            {"value": "settings", "label": "Configurações"},
            {"value": "page", "label": "Página"},
            {"value": "evaluation", "label": "Avaliação"}
        ]
    }

@router.get("/stats")
async def get_log_stats(request: Request):
    """Get log statistics"""
    await require_gestao(request)
    db = await get_db(request)
    
    # Count by action
    action_pipeline = [
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    action_stats = await db.audit_logs.aggregate(action_pipeline).to_list(20)
    
    # Count by admin
    admin_pipeline = [
        {"$group": {"_id": {"id": "$admin_id", "name": "$admin_name"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    admin_stats = await db.audit_logs.aggregate(admin_pipeline).to_list(10)
    
    # Recent activity (last 24h)
    from datetime import timedelta
    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_count = await db.audit_logs.count_documents({"created_at": {"$gte": yesterday}})
    
    return {
        "by_action": [{"action": s["_id"], "count": s["count"]} for s in action_stats],
        "by_admin": [{"admin_id": s["_id"]["id"], "admin_name": s["_id"]["name"], "count": s["count"]} for s in admin_stats],
        "recent_24h": recent_count,
        "total": await db.audit_logs.count_documents({})
    }
