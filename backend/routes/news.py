from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level, NewsStatus
from routes.logs import create_audit_log, get_client_ip
import uuid

router = APIRouter(prefix="/news", tags=["news"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user_from_request
    return await get_current_user_from_request(request)

async def require_gestao(request: Request):
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito à gestão")
    return user

@router.get("")
async def list_news(request: Request, limit: int = 20):
    """List published news (public)
    
    Retorna apenas notícias:
    - Com status 'published' ou published=True (compatibilidade)
    - Que não estejam agendadas para o futuro
    """
    db = await get_db(request)
    now = datetime.now(timezone.utc)
    
    # Buscar notícias publicadas (compatível com formato antigo e novo)
    news = await db.news.find(
        {
            "$or": [
                # Formato novo: status = published
                {"status": NewsStatus.PUBLISHED},
                # Formato antigo: published = True (e sem status definido ou não é draft)
                {"published": True, "status": {"$ne": NewsStatus.DRAFT}}
            ],
            # Excluir notícias agendadas para o futuro
            "$or": [
                {"scheduled_at": {"$exists": False}},
                {"scheduled_at": None},
                {"scheduled_at": {"$lte": now}}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return news

@router.get("/drafts")
async def list_drafts(request: Request, limit: int = 50):
    """List draft news (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    # List all draft news
    news = await db.news.find(
        {
            "$or": [
                {"status": NewsStatus.DRAFT},
                {"published": {"$ne": True}, "status": {"$exists": False}}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return news

@router.get("/scheduled")
async def list_scheduled(request: Request, limit: int = 50):
    """List scheduled news (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    now = datetime.now(timezone.utc)
    
    # List news scheduled for future publication
    news = await db.news.find(
        {
            "scheduled_at": {"$exists": True, "$ne": None, "$gt": now}
        },
        {"_id": 0}
    ).sort("scheduled_at", 1).limit(limit).to_list(limit)
    
    return news

@router.get("/all")
async def list_all_news(request: Request, limit: int = 50):
    """List all news including drafts (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    news = await db.news.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Adicionar status calculado para compatibilidade
    now = datetime.now(timezone.utc)
    for item in news:
        # Determinar status de exibição
        if item.get("status") == NewsStatus.DRAFT or (not item.get("published") and not item.get("status")):
            item["display_status"] = "draft"
        elif item.get("scheduled_at") and item["scheduled_at"] > now:
            item["display_status"] = "scheduled"
        else:
            item["display_status"] = "published"
    
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
    
    # Processar status
    status = body.get("status", NewsStatus.PUBLISHED)
    if status not in [NewsStatus.DRAFT, NewsStatus.PUBLISHED]:
        status = NewsStatus.PUBLISHED
    
    # Processar data de agendamento
    scheduled_at = None
    if body.get("scheduled_at"):
        try:
            scheduled_at = body["scheduled_at"]
            if isinstance(scheduled_at, str):
                scheduled_at = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
        except:
            scheduled_at = None
    
    # Se tem agendamento futuro, status deve ser draft até publicação
    now = datetime.now(timezone.utc)
    if scheduled_at and scheduled_at > now:
        status = NewsStatus.DRAFT
    
    news = {
        "news_id": f"news_{uuid.uuid4().hex[:8]}",
        "title": body.get("title"),
        "content": body.get("content"),
        "location": body.get("location"),
        "image": body.get("image"),
        "references": body.get("references"),
        "author_id": user["user_id"],
        "author_name": user["name"],
        "status": status,
        "scheduled_at": scheduled_at,
        "published": status == NewsStatus.PUBLISHED,  # Compatibilidade
        "created_at": now
    }
    
    await db.news.insert_one(news)
    
    # Log the action
    status_text = "rascunho" if status == NewsStatus.DRAFT else "publicada"
    if scheduled_at:
        status_text = f"agendada para {scheduled_at.strftime('%d/%m/%Y %H:%M')}"
    
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user["name"],
        admin_email=user.get("email"),
        action="create",
        entity_type="news",
        entity_id=news["news_id"],
        entity_name=news["title"],
        details=f"Notícia criada ({status_text}): {news['title']}",
        ip_address=get_client_ip(request)
    )
    
    return {"news_id": news["news_id"], "message": "Notícia criada"}

@router.put("/{news_id}")
async def update_news(request: Request, news_id: str):
    """Update news article (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    body = await request.json()
    
    # Get current news
    old_news = await db.news.find_one({"news_id": news_id}, {"_id": 0})
    if not old_news:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    update_data = {}
    allowed_fields = ["title", "content", "location", "image", "references", "status", "scheduled_at"]
    
    for field in allowed_fields:
        if field in body:
            value = body[field]
            
            # Processar data de agendamento
            if field == "scheduled_at" and value:
                try:
                    if isinstance(value, str):
                        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    value = None
            
            update_data[field] = value
    
    # Atualizar campo published para compatibilidade
    if "status" in update_data:
        update_data["published"] = update_data["status"] == NewsStatus.PUBLISHED
    
    # Se tem agendamento futuro, status deve ser draft
    now = datetime.now(timezone.utc)
    if update_data.get("scheduled_at") and update_data["scheduled_at"] > now:
        update_data["status"] = NewsStatus.DRAFT
        update_data["published"] = False
    
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
            old_value={k: old_news.get(k) for k in update_data.keys() if k in old_news},
            new_value=update_data,
            ip_address=get_client_ip(request)
        )
    
    return {"message": "Notícia atualizada"}

@router.post("/{news_id}/publish")
async def publish_news(request: Request, news_id: str):
    """Publish a draft news immediately (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    # Get current news
    news = await db.news.find_one({"news_id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    # Update status to published
    await db.news.update_one(
        {"news_id": news_id},
        {"$set": {
            "status": NewsStatus.PUBLISHED,
            "published": True,
            "scheduled_at": None,  # Remove agendamento
            "published_at": datetime.now(timezone.utc)
        }}
    )
    
    # Log the action
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user["name"],
        admin_email=user.get("email"),
        action="update",
        entity_type="news",
        entity_id=news_id,
        entity_name=news.get("title"),
        details=f"Notícia publicada: {news.get('title')}",
        ip_address=get_client_ip(request)
    )
    
    return {"message": "Notícia publicada com sucesso"}

@router.delete("/{news_id}")
async def delete_news(request: Request, news_id: str):
    """Delete news article (gestao+)"""
    user = await require_gestao(request)
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
