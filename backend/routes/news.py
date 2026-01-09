from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level
import uuid

router = APIRouter(prefix="/news", tags=["news"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user as auth_get_user
    return await auth_get_user(request)

async def require_gestao(request: Request):
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito à gestão")
    return user

@router.get("")
async def list_news(request: Request, limit: int = 20):
    """List published news (public)"""
    db = await get_db(request)
    
    news = await db.news.find(
        {"published": True},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return news

@router.get("/{news_id}")
async def get_news(request: Request, news_id: str):
    """Get single news article"""
    db = await get_db(request)
    
    news = await db.news.find_one({"news_id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    return news

@router.post("")
async def create_news(request: Request):
    """Create news article (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    body = await request.json()
    
    news = {
        "news_id": f"news_{uuid.uuid4().hex[:8]}",
        "title": body.get("title"),
        "content": body.get("content"),
        "location": body.get("location"),
        "image": body.get("image"),
        "references": body.get("references"),
        "author_id": user["user_id"],
        "author_name": user["name"],
        "published": body.get("published", True),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.news.insert_one(news)
    
    return {"news_id": news["news_id"], "message": "Notícia criada"}

@router.put("/{news_id}")
async def update_news(request: Request, news_id: str):
    """Update news article (gestao+)"""
    await require_gestao(request)
    db = await get_db(request)
    body = await request.json()
    
    update_data = {}
    for field in ["title", "content", "location", "image", "references", "published"]:
        if field in body:
            update_data[field] = body[field]
    
    if update_data:
        await db.news.update_one({"news_id": news_id}, {"$set": update_data})
    
    return {"message": "Notícia atualizada"}

@router.delete("/{news_id}")
async def delete_news(request: Request, news_id: str):
    """Delete news article (gestao+)"""
    await require_gestao(request)
    db = await get_db(request)
    
    result = await db.news.delete_one({"news_id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    return {"message": "Notícia excluída"}
