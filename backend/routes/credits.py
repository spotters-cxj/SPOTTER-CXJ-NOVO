from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import CreditMember, CreditMemberCreate, CreditMemberUpdate, HIERARCHY_LEVELS, get_highest_role_level
import uuid

router = APIRouter(prefix="/credits", tags=["credits"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user as auth_get_user
    return await auth_get_user(request)

@router.get("")
async def list_credits(request: Request):
    """List all credit members (public)"""
    db = await get_db(request)
    
    credits = await db.credits.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return credits

@router.post("")
async def create_credit(request: Request):
    """Create credit member (admin+)"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    body = await request.json()
    
    credit = {
        "member_id": f"credit_{uuid.uuid4().hex[:8]}",
        "name": body.get("name"),
        "role": body.get("role"),
        "description": body.get("description"),
        "instagram": body.get("instagram"),
        "order": body.get("order", 0),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.credits.insert_one(credit)
    
    return {"message": "Membro adicionado aos créditos", "member_id": credit["member_id"]}

@router.put("/{member_id}")
async def update_credit(request: Request, member_id: str):
    """Update credit member (admin+)"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    body = await request.json()
    
    existing = await db.credits.find_one({"member_id": member_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    update_data = {}
    for field in ["name", "role", "description", "instagram", "order"]:
        if field in body:
            update_data[field] = body[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    await db.credits.update_one({"member_id": member_id}, {"$set": update_data})
    
    return {"message": "Membro atualizado com sucesso"}

@router.delete("/{member_id}")
async def delete_credit(request: Request, member_id: str):
    """Delete credit member (admin+)"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    
    result = await db.credits.delete_one({"member_id": member_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Membro não encontrado")
    
    return {"message": "Membro removido dos créditos"}
