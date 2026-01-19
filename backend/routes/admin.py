from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
from models import User, UserUpdate, HIERARCHY_LEVELS, get_highest_role_level
from routes.logs import create_audit_log, get_client_ip

router = APIRouter(prefix="/admin", tags=["admin"])

async def get_db(request: Request):
    return request.app.state.db

async def require_admin(request: Request):
    """Require admin level or higher"""
    from routes.auth import get_current_user_from_request
    user = await get_current_user_from_request(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user

async def require_lider(request: Request):
    """Require lider level"""
    from routes.auth import get_current_user_from_request
    user = await get_current_user_from_request(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["lider"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a líderes")
    return user

@router.get("/users")
async def list_users(request: Request):
    """List all users (admin only)"""
    admin = await require_admin(request)
    db = await get_db(request)
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@router.put("/users/{user_id}/role")
async def update_user_role(request: Request, user_id: str):
    """Update user role/tags (admin only)"""
    admin = await require_admin(request)
    db = await get_db(request)
    body = await request.json()
    
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Cannot change lider if not lider
    admin_level = get_highest_role_level(admin.get("tags", []))
    target_level = get_highest_role_level(target_user.get("tags", []))
    
    if target_level >= admin_level and admin["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Não pode alterar usuário de nível igual ou superior")
    
    old_tags = target_user.get("tags", [])
    new_tags = body.get("tags", old_tags)
    
    await db.users.update_one({"user_id": user_id}, {"$set": {"tags": new_tags}})
    
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
    
    return {"message": "Tags atualizadas"}

@router.put("/users/{user_id}/approve")
async def approve_user(request: Request, user_id: str):
    """Approve or reject user (admin only)"""
    admin = await require_admin(request)
    db = await get_db(request)
    body = await request.json()
    
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    approved = body.get("approved", False)
    old_approved = target_user.get("approved", False)
    
    await db.users.update_one({"user_id": user_id}, {"$set": {"approved": approved}})
    
    # Log the action
    action = "approve" if approved else "reject"
    await create_audit_log(
        db,
        admin_id=admin["user_id"],
        admin_name=admin["name"],
        admin_email=admin.get("email"),
        action=action,
        entity_type="user",
        entity_id=user_id,
        entity_name=target_user.get("name"),
        details=f"Usuário {'aprovado' if approved else 'rejeitado'}",
        old_value={"approved": old_approved},
        new_value={"approved": approved},
        ip_address=get_client_ip(request)
    )
    
    return {"message": "Status atualizado"}

@router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Delete user (admin only, cannot delete lider)"""
    admin = await require_admin(request)
    db = await get_db(request)
    
    target_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if "lider" in target_user.get("tags", []):
        raise HTTPException(status_code=400, detail="Não pode excluir líder")
    
    # Check hierarchy
    admin_level = get_highest_role_level(admin.get("tags", []))
    target_level = get_highest_role_level(target_user.get("tags", []))
    
    if target_level >= admin_level:
        raise HTTPException(status_code=403, detail="Não pode excluir usuário de nível igual ou superior")
    
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    
    # Log the action
    await create_audit_log(
        db,
        admin_id=admin["user_id"],
        admin_name=admin["name"],
        admin_email=admin.get("email"),
        action="delete",
        entity_type="user",
        entity_id=user_id,
        entity_name=target_user.get("name"),
        details=f"Usuário excluído",
        ip_address=get_client_ip(request)
    )
    
    return {"message": "Usuário excluído"}
