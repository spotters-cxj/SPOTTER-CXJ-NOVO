from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level
from routes.logs import create_audit_log, get_client_ip
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

async def require_news_permission(request: Request):
    """Require jornalista, gestao, admin or lider to manage news"""
    user = await get_current_user(request)
    allowed_tags = ["jornalista", "gestao", "admin", "lider"]
    if not any(tag in user.get("tags", []) for tag in allowed_tags):
        raise HTTPException(
            status_code=403, 
            detail="Apenas jornalistas ou administradores podem gerenciar notícias"
        )
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
    """Create news article (jornalista+)"""
    user = await require_news_permission(request)
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
    
    # Log the action
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user["name"],
        admin_email=user.get("email"),
        action="create",
        entity_type="news",
        entity_id=news["news_id"],
        entity_name=news["title"],
        details=f"Notícia criada: {news['title']}",
        ip_address=get_client_ip(request)
    )
    
    return {"news_id": news["news_id"], "message": "Notícia criada"}

@router.put("/{news_id}")
async def update_news(request: Request, news_id: str):
    """Update news article (jornalista+)"""
    user = await require_news_permission(request)
    db = await get_db(request)
    body = await request.json()
    
    # Get current news
    old_news = await db.news.find_one({"news_id": news_id}, {"_id": 0})
    if not old_news:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    update_data = {}
    for field in ["title", "content", "location", "image", "references", "published"]:
        if field in body:
            update_data[field] = body[field]
    
    if update_data:
        await db.news.update_one({"news_id": news_id}, {"$set": update_data})
        
        # Log the action
        await create_audit_log(
            db,
            admin_id=user["user_id"],
            admin_name=user["name"],
            admin_email=user.get("email"),
            action="update",
            entity_type="news",
            entity_id=news_id,
            entity_name=old_news.get("title"),
            details=f"Notícia atualizada",
            old_value={k: old_news.get(k) for k in update_data.keys()},
            new_value=update_data,
            ip_address=get_client_ip(request)
        )
    
    return {"message": "Notícia atualizada"}

@router.delete("/{news_id}")
async def delete_news(request: Request, news_id: str):
    """Delete news article (jornalista+)"""
    user = await require_news_permission(request)
    db = await get_db(request)
    
    # Get news before deleting
    news = await db.news.find_one({"news_id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    await db.news.delete_one({"news_id": news_id})
    
    # Log the action
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user["name"],
        admin_email=user.get("email"),
        action="delete",
        entity_type="news",
        entity_id=news_id,
        entity_name=news.get("title"),
        details=f"Notícia excluída: {news.get('title')}",
        ip_address=get_client_ip(request)
    )
    
    return {"message": "Notícia excluída"}
