from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level
from routes.logs import create_audit_log, get_client_ip
import uuid

router = APIRouter(prefix="/members", tags=["members"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user as auth_get_user
    return await auth_get_user(request)

async def require_admin(request: Request):
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user

async def create_notification(db, user_id: str, notif_type: str, message: str, data: dict = None):
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "type": notif_type,
        "message": message,
        "data": data or {},
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification)

@router.get("")
async def list_members(request: Request, tag: str = None):
    """List all members (public)"""
    db = await get_db(request)
    
    query = {"approved": True}
    if tag:
        query["tags"] = tag
    
    members = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0, "email": 0}
    ).to_list(500)
    
    # Sort by hierarchy
    def sort_key(m):
        return -get_highest_role_level(m.get("tags", []))
    
    members.sort(key=sort_key)
    
    return members

@router.get("/hierarchy")
async def get_hierarchy(request: Request):
    """Get members grouped by hierarchy"""
    db = await get_db(request)
    
    members = await db.users.find(
        {"approved": True},
        {"_id": 0, "password_hash": 0, "email": 0}
    ).to_list(500)
    
    hierarchy = {
        "lideres": [],
        "admins": [],
        "gestao": [],
        "produtores": [],
        "avaliadores": [],
        "colaboradores": [],
        "spotters": [],
        "jornalistas": [],
        "diretores": []
    }
    
    for member in members:
        tags = member.get("tags", [])
        if "lider" in tags:
            hierarchy["lideres"].append(member)
        elif "admin" in tags:
            hierarchy["admins"].append(member)
        elif "gestao" in tags:
            hierarchy["gestao"].append(member)
        elif "produtor" in tags:
            hierarchy["produtores"].append(member)
        elif "avaliador" in tags:
            hierarchy["avaliadores"].append(member)
        elif "colaborador" in tags:
            hierarchy["colaboradores"].append(member)
        elif "jornalista" in tags:
            hierarchy["jornalistas"].append(member)
        elif "diretor_aeroporto" in tags:
            hierarchy["diretores"].append(member)
        else:
            hierarchy["spotters"].append(member)
    
    return hierarchy

@router.get("/{user_id}")
async def get_member(request: Request, user_id: str):
    """Get member profile"""
    db = await get_db(request)
    
    member = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    # Get member's approved photos
    photos = await db.photos.find(
        {"author_id": user_id, "status": "approved"},
        {"_id": 0}
    ).sort("approved_at", -1).limit(20).to_list(20)
    
    # Get stats
    total_photos = await db.photos.count_documents({"author_id": user_id, "status": "approved"})
    
    # Calculate average rating
    pipeline = [
        {"$match": {"author_id": user_id, "status": "approved", "public_rating": {"$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$public_rating"}}}
    ]
    result = await db.photos.aggregate(pipeline).to_list(1)
    avg_rating = result[0]["avg"] if result else 0
    
    member["photos"] = photos
    member["stats"] = {
        "total_photos": total_photos,
        "average_rating": round(avg_rating, 2)
    }
    
    return member

@router.put("/{user_id}/tags")
async def update_member_tags(request: Request, user_id: str):
    """Update member tags (admin only)"""
    admin = await require_admin(request)
    db = await get_db(request)
    body = await request.json()
    
    new_tags = body.get("tags", [])
    if not new_tags:
        new_tags = ["spotter_cxj"]
    
    # Validate tags
    valid_tags = ["lider", "admin", "gestao", "produtor", "avaliador", "colaborador", "spotter_cxj", "vip", "podio", "jornalista", "diretor_aeroporto"]
    for tag in new_tags:
        if tag not in valid_tags:
            raise HTTPException(status_code=400, detail=f"Tag inválida: {tag}")
    
    # Get current user
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    old_tags = target_user.get("tags", [])
    
    # Check if adding new tags
    new_added = [t for t in new_tags if t not in old_tags]
    
    # Update
    is_vip = "vip" in new_tags or "colaborador" in new_tags
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"tags": new_tags, "is_vip": is_vip}}
    )
    
    # Send notification for new tags
    if new_added:
        tags_str = ", ".join([t.upper() for t in new_added])
        await create_notification(
            db, user_id, "tag_assigned",
            f"🏷️ Você recebeu a(s) tag(s): {tags_str}",
            {"tags": new_added}
        )
    
    # Log the action
    await create_audit_log(
        db,
        admin_id=admin["user_id"],
        admin_name=admin["name"],
        admin_email=admin.get("email"),
        action="tag_change",
        entity_type="user",
        entity_id=user_id,
        entity_name=target_user.get("name"),
        details=f"Tags alteradas de {old_tags} para {new_tags}",
        old_value={"tags": old_tags},
        new_value={"tags": new_tags},
        ip_address=get_client_ip(request)
    )
    
    return {"message": "Tags atualizadas", "tags": new_tags}

@router.put("/{user_id}/approve")
async def approve_member(request: Request, user_id: str):
    """Approve or reject member (admin only)"""
    admin = await require_admin(request)
    db = await get_db(request)
    body = await request.json()
    
    approved = body.get("approved", False)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"approved": approved}}
    )
    
    if approved:
        await create_notification(
            db, user_id, "tag_assigned",
            "✅ Sua conta foi aprovada! Agora você pode enviar fotos."
        )
    
    return {"message": "Status atualizado", "approved": approved}

@router.delete("/{user_id}")
async def delete_member(request: Request, user_id: str):
    """Delete member (admin only, cannot delete lider)"""
    admin = await require_admin(request)
    db = await get_db(request)
    
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if "lider" in target.get("tags", []):
        raise HTTPException(status_code=403, detail="Não é possível excluir líder")
    
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": "Membro excluído"}
