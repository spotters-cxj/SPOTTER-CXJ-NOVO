from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/timeline", tags=["timeline"])

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

async def require_admin_principal(request: Request):
    from routes.auth import get_current_user
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["lider"]:
        raise HTTPException(status_code=403, detail="Lider access required")
    return user

# Timeline Models
class TimelineItem(BaseModel):
    item_id: Optional[str] = None
    year: str
    title: Optional[str] = None
    description: str
    order: int = 0

class TimelineItemCreate(BaseModel):
    year: str
    title: Optional[str] = None
    description: str
    order: int = 0

# Airport Timeline (only admin_principal can edit)
@router.get("/airport")
async def get_airport_timeline(request: Request):
    """Get airport timeline (public)"""
    db = await get_db(request)
    items = await db.airport_timeline.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Return defaults if empty
    if not items:
        return [
            {"item_id": "default_1", "year": "1940s", "description": "Início das operações aeroportuárias em Caxias do Sul", "order": 0},
            {"item_id": "default_2", "year": "1970s", "description": "Primeiras grandes reformas e ampliação da pista", "order": 1},
            {"item_id": "default_3", "year": "1990s", "description": "Modernização do terminal de passageiros", "order": 2},
            {"item_id": "default_4", "year": "2000s", "description": "Início dos voos comerciais regulares", "order": 3},
            {"item_id": "default_5", "year": "2010s", "description": "Novas ampliações e melhorias na infraestrutura", "order": 4},
            {"item_id": "default_6", "year": "2020s", "description": "Consolidação como importante hub regional", "order": 5}
        ]
    return items

@router.post("/airport")
async def create_airport_timeline_item(request: Request, item: TimelineItemCreate):
    """Add airport timeline item (admin principal only)"""
    await require_admin_principal(request)
    db = await get_db(request)
    
    item_data = item.dict()
    item_data["item_id"] = f"airport_{uuid.uuid4().hex[:8]}"
    item_data["created_at"] = datetime.now(timezone.utc)
    
    await db.airport_timeline.insert_one(item_data)
    return {**item_data, "_id": None}

@router.put("/airport/{item_id}")
async def update_airport_timeline_item(request: Request, item_id: str, item: TimelineItemCreate):
    """Update airport timeline item (admin principal only)"""
    await require_admin_principal(request)
    db = await get_db(request)
    
    update_data = item.dict()
    result = await db.airport_timeline.update_one(
        {"item_id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Updated"}

@router.delete("/airport/{item_id}")
async def delete_airport_timeline_item(request: Request, item_id: str):
    """Delete airport timeline item (admin principal only)"""
    await require_admin_principal(request)
    db = await get_db(request)
    
    result = await db.airport_timeline.delete_one({"item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Deleted"}

# Spotters Milestones
@router.get("/spotters")
async def get_spotters_milestones(request: Request):
    """Get spotters milestones (public)"""
    db = await get_db(request)
    items = await db.spotters_milestones.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    
    # Return defaults if empty
    if not items:
        return [
            {"item_id": "default_1", "year": "2015", "title": "Fundação", "description": "Primeiro encontro oficial dos fundadores", "order": 0},
            {"item_id": "default_2", "year": "2016", "title": "Redes Sociais", "description": "Criação das páginas no Instagram e YouTube", "order": 1},
            {"item_id": "default_3", "year": "2017", "title": "Primeiro Day Spotter", "description": "Evento oficial no aeroporto CXJ", "order": 2},
            {"item_id": "default_4", "year": "2018", "title": "Reconhecimento", "description": "Parceria com a administração do aeroporto", "order": 3},
            {"item_id": "default_5", "year": "2020", "title": "Expansão Digital", "description": "Crescimento nas redes durante a pandemia", "order": 4},
            {"item_id": "default_6", "year": "2023", "title": "Comunidade Consolidada", "description": "Mais de 50 membros ativos", "order": 5}
        ]
    return items

@router.post("/spotters")
async def create_spotters_milestone(request: Request, item: TimelineItemCreate):
    """Add spotters milestone (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    item_data = item.dict()
    item_data["item_id"] = f"spotter_{uuid.uuid4().hex[:8]}"
    item_data["created_at"] = datetime.now(timezone.utc)
    
    await db.spotters_milestones.insert_one(item_data)
    return {**item_data, "_id": None}

@router.put("/spotters/{item_id}")
async def update_spotters_milestone(request: Request, item_id: str, item: TimelineItemCreate):
    """Update spotters milestone (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    update_data = item.dict()
    result = await db.spotters_milestones.update_one(
        {"item_id": item_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Updated"}

@router.delete("/spotters/{item_id}")
async def delete_spotters_milestone(request: Request, item_id: str):
    """Delete spotters milestone (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    result = await db.spotters_milestones.delete_one({"item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Deleted"}
