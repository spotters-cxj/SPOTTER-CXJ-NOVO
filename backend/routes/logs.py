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

@router.get("/evaluations")
async def list_evaluations(
    request: Request,
    limit: int = 100,
    skip: int = 0,
    evaluator_id: str = None,
    photo_id: str = None,
    date_from: str = None,
    date_to: str = None
):
    """List all photo evaluations with details (gestao+)"""
    await require_gestao(request)
    db = await get_db(request)
    
    query = {}
    if evaluator_id:
        query["evaluator_id"] = evaluator_id
    if photo_id:
        query["photo_id"] = photo_id
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query["created_at"] = {"$gte": from_date}
        except:
            pass
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            if "created_at" in query:
                query["created_at"]["$lte"] = to_date
            else:
                query["created_at"] = {"$lte": to_date}
        except:
            pass
    
    evaluations = await db.evaluations.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with photo data
    enriched = []
    for ev in evaluations:
        photo = await db.photos.find_one({"photo_id": ev["photo_id"]}, {"_id": 0, "title": 1, "url": 1, "author_name": 1, "status": 1})
        enriched.append({
            "evaluation_id": ev.get("evaluation_id"),
            "photo_id": ev.get("photo_id"),
            "photo_title": photo.get("title") if photo else "Foto removida",
            "photo_url": photo.get("url") if photo else None,
            "photo_author": photo.get("author_name") if photo else "Desconhecido",
            "photo_status": photo.get("status") if photo else "unknown",
            "evaluator_id": ev.get("evaluator_id"),
            "evaluator_name": ev.get("evaluator_name"),
            "criteria": ev.get("criteria", {}),
            "final_score": ev.get("final_score", 0),
            "comment": ev.get("comment"),
            "created_at": ev.get("created_at")
        })
    
    total = await db.evaluations.count_documents(query)
    
    return {
        "evaluations": enriched,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.get("/evaluations/stats")
async def get_evaluation_stats(request: Request):
    """Get evaluation statistics"""
    await require_gestao(request)
    db = await get_db(request)
    
    from datetime import timedelta
    
    # Total evaluations
    total = await db.evaluations.count_documents({})
    
    # Last 24h
    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_24h = await db.evaluations.count_documents({"created_at": {"$gte": yesterday}})
    
    # Last 7 days
    last_week = datetime.now(timezone.utc) - timedelta(days=7)
    recent_7d = await db.evaluations.count_documents({"created_at": {"$gte": last_week}})
    
    # By evaluator
    evaluator_pipeline = [
        {"$group": {"_id": {"id": "$evaluator_id", "name": "$evaluator_name"}, "count": {"$sum": 1}, "avg_score": {"$avg": "$final_score"}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    by_evaluator = await db.evaluations.aggregate(evaluator_pipeline).to_list(20)
    
    # Average score
    avg_pipeline = [
        {"$group": {"_id": None, "avg_score": {"$avg": "$final_score"}}}
    ]
    avg_result = await db.evaluations.aggregate(avg_pipeline).to_list(1)
    avg_score = avg_result[0]["avg_score"] if avg_result else 0
    
    return {
        "total": total,
        "recent_24h": recent_24h,
        "recent_7d": recent_7d,
        "average_score": round(avg_score, 2) if avg_score else 0,
        "by_evaluator": [
            {
                "evaluator_id": e["_id"]["id"],
                "evaluator_name": e["_id"]["name"],
                "count": e["count"],
                "avg_score": round(e["avg_score"], 2)
            } for e in by_evaluator
        ]
    }

@router.get("/security")
async def list_security_logs(request: Request, limit: int = 50):
    """List security logs (unauthorized attempts etc.)"""
    await require_gestao(request)
    db = await get_db(request)
    
    logs = await db.security_logs.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"logs": logs, "total": len(logs)}
