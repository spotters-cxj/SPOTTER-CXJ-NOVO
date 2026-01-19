"""
Events API Routes
- Sistema de eventos com votação de fotos e enquetes
- Permissões configuráveis por tags
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import (
    HIERARCHY_LEVELS, get_highest_role_level, can_vote_in_event,
    EventType, EventStatus, PollOption
)
from routes.logs import create_audit_log, get_client_ip
import uuid

router = APIRouter(prefix="/events", tags=["events"])

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user_from_request
    return await get_current_user_from_request(request)

async def get_current_user_optional(request: Request):
    """Tenta obter o usuário atual, retorna None se não autenticado"""
    try:
        from routes.auth import get_current_user_from_request
        return await get_current_user_from_request(request)
    except Exception:
        return None

async def require_gestao(request: Request):
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito à gestão")
    return user


# ==================== PUBLIC ENDPOINTS ====================

@router.get("")
async def list_events(request: Request, include_ended: bool = False):
    """Listar eventos ativos (público)"""
    db = await get_db(request)
    now = datetime.now(timezone.utc)
    
    # Filtro base - eventos ativos
    query = {"active": True}
    
    if not include_ended:
        # Apenas eventos que ainda não terminaram
        query["end_date"] = {"$gte": now}
    
    events = await db.events.find(
        query,
        {"_id": 0}
    ).sort("start_date", 1).to_list(100)
    
    # Adicionar status calculado
    for event in events:
        start = event.get("start_date")
        end = event.get("end_date")
        
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace('Z', '+00:00'))
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace('Z', '+00:00'))
            
        if now < start:
            event["computed_status"] = "upcoming"
        elif now > end:
            event["computed_status"] = "ended"
        else:
            event["computed_status"] = "active"
    
    return events


@router.get("/{event_id}")
async def get_event(request: Request, event_id: str):
    """Obter detalhes de um evento"""
    db = await get_db(request)
    user = await get_current_user_optional(request)
    
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Calcular status
    now = datetime.now(timezone.utc)
    start = event.get("start_date")
    end = event.get("end_date")
    
    if isinstance(start, str):
        start = datetime.fromisoformat(start.replace('Z', '+00:00'))
    if isinstance(end, str):
        end = datetime.fromisoformat(end.replace('Z', '+00:00'))
        
    if now < start:
        event["computed_status"] = "upcoming"
    elif now > end:
        event["computed_status"] = "ended"
    else:
        event["computed_status"] = "active"
    
    # Verificar se o usuário pode votar
    if user:
        user_tags = user.get("tags", [])
        event["can_vote"] = can_vote_in_event(
            user_tags, 
            event.get("allowed_tags", []),
            event.get("allow_visitors", False)
        )
        
        # Verificar se já votou
        existing_vote = await db.event_votes.find_one({
            "event_id": event_id,
            "user_id": user["user_id"]
        })
        event["has_voted"] = existing_vote is not None
        if existing_vote:
            event["user_vote"] = {
                "photo_id": existing_vote.get("photo_id"),
                "option_id": existing_vote.get("option_id")
            }
    else:
        event["can_vote"] = False
        event["has_voted"] = False
    
    # Se for votação de fotos, buscar dados das fotos
    if event.get("event_type") == EventType.PHOTO and event.get("photo_ids"):
        photos = await db.photos.find(
            {"photo_id": {"$in": event["photo_ids"]}},
            {"_id": 0, "photo_id": 1, "title": 1, "url": 1, "author_name": 1, "aircraft_model": 1}
        ).to_list(100)
        event["photos"] = photos
    
    return event


@router.get("/{event_id}/results")
async def get_event_results(request: Request, event_id: str):
    """Obter resultados do evento"""
    db = await get_db(request)
    
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    now = datetime.now(timezone.utc)
    end = event.get("end_date")
    if isinstance(end, str):
        end = datetime.fromisoformat(end.replace('Z', '+00:00'))
    
    # Verificar se pode ver resultados
    show_results = event.get("show_results_live", False) or now > end
    
    if not show_results:
        return {
            "event_id": event_id,
            "title": event.get("title"),
            "results_available": False,
            "message": "Resultados disponíveis apenas após o encerramento do evento"
        }
    
    # Contar votos
    total_votes = await db.event_votes.count_documents({"event_id": event_id})
    
    if event.get("event_type") == EventType.PHOTO:
        # Agregar votos por foto
        pipeline = [
            {"$match": {"event_id": event_id, "photo_id": {"$ne": None}}},
            {"$group": {"_id": "$photo_id", "votes": {"$sum": 1}}},
            {"$sort": {"votes": -1}}
        ]
        vote_counts = await db.event_votes.aggregate(pipeline).to_list(100)
        
        # Buscar dados das fotos
        photo_ids = [v["_id"] for v in vote_counts]
        photos = await db.photos.find(
            {"photo_id": {"$in": photo_ids}},
            {"_id": 0, "photo_id": 1, "title": 1, "url": 1, "author_name": 1}
        ).to_list(100)
        
        photos_map = {p["photo_id"]: p for p in photos}
        
        results = []
        for vc in vote_counts:
            photo_data = photos_map.get(vc["_id"], {})
            results.append({
                "photo_id": vc["_id"],
                "votes": vc["votes"],
                "title": photo_data.get("title", ""),
                "url": photo_data.get("url", ""),
                "author_name": photo_data.get("author_name", "")
            })
        
        return {
            "event_id": event_id,
            "title": event.get("title"),
            "event_type": EventType.PHOTO,
            "results_available": True,
            "total_votes": total_votes,
            "results": results
        }
    
    else:  # Enquete
        # Agregar votos por opção
        pipeline = [
            {"$match": {"event_id": event_id, "option_id": {"$ne": None}}},
            {"$group": {"_id": "$option_id", "votes": {"$sum": 1}}},
            {"$sort": {"votes": -1}}
        ]
        vote_counts = await db.event_votes.aggregate(pipeline).to_list(100)
        
        vote_map = {vc["_id"]: vc["votes"] for vc in vote_counts}
        
        results = []
        for opt in event.get("poll_options", []):
            results.append({
                "option_id": opt.get("option_id"),
                "text": opt.get("text"),
                "votes": vote_map.get(opt.get("option_id"), 0)
            })
        
        return {
            "event_id": event_id,
            "title": event.get("title"),
            "event_type": EventType.POLL,
            "results_available": True,
            "total_votes": total_votes,
            "results": results
        }


@router.post("/{event_id}/vote")
async def vote_in_event(request: Request, event_id: str):
    """Votar em um evento"""
    db = await get_db(request)
    user = await get_current_user(request)
    body = await request.json()
    
    # Buscar evento
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Verificar se evento está ativo
    if not event.get("active"):
        raise HTTPException(status_code=400, detail="Este evento não está ativo")
    
    # Verificar período de votação
    now = datetime.now(timezone.utc)
    start = event.get("start_date")
    end = event.get("end_date")
    
    if isinstance(start, str):
        start = datetime.fromisoformat(start.replace('Z', '+00:00'))
    if isinstance(end, str):
        end = datetime.fromisoformat(end.replace('Z', '+00:00'))
    
    if now < start:
        raise HTTPException(status_code=400, detail="A votação ainda não começou")
    if now > end:
        raise HTTPException(status_code=400, detail="A votação já encerrou")
    
    # Verificar permissão de voto
    user_tags = user.get("tags", [])
    allowed_tags = event.get("allowed_tags", [])
    allow_visitors = event.get("allow_visitors", False)
    
    if not can_vote_in_event(user_tags, allowed_tags, allow_visitors):
        raise HTTPException(
            status_code=403, 
            detail="Você não tem permissão para votar neste evento"
        )
    
    # Verificar se já votou
    existing_vote = await db.event_votes.find_one({
        "event_id": event_id,
        "user_id": user["user_id"]
    })
    if existing_vote:
        raise HTTPException(status_code=400, detail="Você já votou neste evento")
    
    # Validar voto
    vote_data = {
        "vote_id": f"vote_{uuid.uuid4().hex[:8]}",
        "event_id": event_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", "Usuário"),
        "created_at": now
    }
    
    if event.get("event_type") == EventType.PHOTO:
        photo_id = body.get("photo_id")
        if not photo_id:
            raise HTTPException(status_code=400, detail="ID da foto é obrigatório")
        if photo_id not in event.get("photo_ids", []):
            raise HTTPException(status_code=400, detail="Foto não participa deste evento")
        vote_data["photo_id"] = photo_id
        
    else:  # Enquete
        option_id = body.get("option_id")
        if not option_id:
            raise HTTPException(status_code=400, detail="ID da opção é obrigatório")
        valid_options = [opt.get("option_id") for opt in event.get("poll_options", [])]
        if option_id not in valid_options:
            raise HTTPException(status_code=400, detail="Opção inválida")
        vote_data["option_id"] = option_id
    
    # Registrar voto
    await db.event_votes.insert_one(vote_data)
    
    return {"message": "Voto registrado com sucesso", "vote_id": vote_data["vote_id"]}


@router.get("/{event_id}/check-permission")
async def check_vote_permission(request: Request, event_id: str):
    """Verificar permissão de voto para o usuário atual"""
    db = await get_db(request)
    user = await get_current_user_optional(request)
    
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    result = {
        "event_id": event_id,
        "is_authenticated": user is not None,
        "can_vote": False,
        "has_voted": False,
        "reason": None
    }
    
    if not user:
        result["reason"] = "Você precisa fazer login para votar"
        return result
    
    user_tags = user.get("tags", [])
    allowed_tags = event.get("allowed_tags", [])
    allow_visitors = event.get("allow_visitors", False)
    
    # Verificar período
    now = datetime.now(timezone.utc)
    start = event.get("start_date")
    end = event.get("end_date")
    
    if isinstance(start, str):
        start = datetime.fromisoformat(start.replace('Z', '+00:00'))
    if isinstance(end, str):
        end = datetime.fromisoformat(end.replace('Z', '+00:00'))
    
    if now < start:
        result["reason"] = "A votação ainda não começou"
        return result
    if now > end:
        result["reason"] = "A votação já encerrou"
        return result
    
    if not event.get("active"):
        result["reason"] = "Este evento não está ativo"
        return result
    
    # Verificar permissão
    if not can_vote_in_event(user_tags, allowed_tags, allow_visitors):
        result["reason"] = "Sua categoria de usuário não tem permissão para votar neste evento"
        return result
    
    # Verificar se já votou
    existing_vote = await db.event_votes.find_one({
        "event_id": event_id,
        "user_id": user["user_id"]
    })
    if existing_vote:
        result["has_voted"] = True
        result["reason"] = "Você já votou neste evento"
        result["user_vote"] = {
            "photo_id": existing_vote.get("photo_id"),
            "option_id": existing_vote.get("option_id")
        }
        return result
    
    result["can_vote"] = True
    return result


# ==================== ADMIN ENDPOINTS ====================

@router.post("")
async def create_event(request: Request):
    """Criar novo evento (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    body = await request.json()
    
    # Validar campos obrigatórios
    if not body.get("title"):
        raise HTTPException(status_code=400, detail="Título é obrigatório")
    if not body.get("start_date"):
        raise HTTPException(status_code=400, detail="Data de início é obrigatória")
    if not body.get("end_date"):
        raise HTTPException(status_code=400, detail="Data de fim é obrigatória")
    
    # Processar datas
    try:
        start_date = body["start_date"]
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        end_date = body["end_date"]
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Formato de data inválido: {str(e)}")
    
    event_type = body.get("event_type", EventType.PHOTO)
    
    # Processar opções de enquete
    poll_options = []
    if event_type == EventType.POLL:
        options_raw = body.get("poll_options", [])
        for opt in options_raw:
            if isinstance(opt, str):
                poll_options.append({
                    "option_id": f"opt_{uuid.uuid4().hex[:6]}",
                    "text": opt,
                    "votes_count": 0
                })
            elif isinstance(opt, dict):
                poll_options.append({
                    "option_id": opt.get("option_id", f"opt_{uuid.uuid4().hex[:6]}"),
                    "text": opt.get("text", ""),
                    "votes_count": 0
                })
    
    # Criar evento
    event = {
        "event_id": f"event_{uuid.uuid4().hex[:8]}",
        "title": body["title"],
        "description": body.get("description", ""),
        "event_type": event_type,
        "allowed_tags": body.get("allowed_tags", []),
        "allow_visitors": body.get("allow_visitors", False),
        "start_date": start_date,
        "end_date": end_date,
        "active": body.get("active", True),
        "show_results_live": body.get("show_results_live", False),
        "photo_ids": body.get("photo_ids", []),
        "poll_options": poll_options,
        "created_by_id": user["user_id"],
        "created_by_name": user.get("name", "Admin"),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.events.insert_one(event)
    
    # Audit log
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user.get("name"),
        admin_email=user.get("email"),
        action="create",
        entity_type="event",
        entity_id=event["event_id"],
        entity_name=event["title"],
        details=f"Evento criado: {event['title']} ({event_type})",
        ip_address=get_client_ip(request)
    )
    
    return {"event_id": event["event_id"], "message": "Evento criado com sucesso"}


@router.put("/{event_id}")
async def update_event(request: Request, event_id: str):
    """Atualizar evento (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    body = await request.json()
    
    # Buscar evento existente
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Preparar atualização
    update_data = {}
    
    allowed_fields = [
        "title", "description", "event_type", "allowed_tags", "allow_visitors",
        "start_date", "end_date", "active", "show_results_live", "photo_ids", "poll_options"
    ]
    
    for field in allowed_fields:
        if field in body:
            value = body[field]
            
            # Processar datas
            if field in ["start_date", "end_date"] and isinstance(value, str):
                value = datetime.fromisoformat(value.replace('Z', '+00:00'))
            
            # Processar opções de enquete
            if field == "poll_options" and isinstance(value, list):
                processed_options = []
                for opt in value:
                    if isinstance(opt, str):
                        processed_options.append({
                            "option_id": f"opt_{uuid.uuid4().hex[:6]}",
                            "text": opt,
                            "votes_count": 0
                        })
                    elif isinstance(opt, dict):
                        processed_options.append({
                            "option_id": opt.get("option_id", f"opt_{uuid.uuid4().hex[:6]}"),
                            "text": opt.get("text", ""),
                            "votes_count": opt.get("votes_count", 0)
                        })
                value = processed_options
            
            update_data[field] = value
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.events.update_one({"event_id": event_id}, {"$set": update_data})
        
        # Audit log
        await create_audit_log(
            db,
            admin_id=user["user_id"],
            admin_name=user.get("name"),
            admin_email=user.get("email"),
            action="update",
            entity_type="event",
            entity_id=event_id,
            entity_name=event.get("title"),
            details=f"Evento atualizado: {event.get('title')}",
            old_value={k: event.get(k) for k in update_data.keys() if k in event},
            new_value=update_data,
            ip_address=get_client_ip(request)
        )
    
    return {"message": "Evento atualizado com sucesso"}


@router.delete("/{event_id}")
async def delete_event(request: Request, event_id: str):
    """Excluir evento (gestao+)"""
    user = await require_gestao(request)
    db = await get_db(request)
    
    # Buscar evento
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Excluir votos do evento
    await db.event_votes.delete_many({"event_id": event_id})
    
    # Excluir evento
    await db.events.delete_one({"event_id": event_id})
    
    # Audit log
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user.get("name"),
        admin_email=user.get("email"),
        action="delete",
        entity_type="event",
        entity_id=event_id,
        entity_name=event.get("title"),
        details=f"Evento excluído: {event.get('title')}",
        ip_address=get_client_ip(request)
    )
    
    return {"message": "Evento excluído com sucesso"}


@router.get("/admin/all")
async def list_all_events_admin(request: Request):
    """Listar todos os eventos para administração (gestao+)"""
    await require_gestao(request)
    db = await get_db(request)
    
    events = await db.events.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Adicionar contagem de votos para cada evento
    for event in events:
        vote_count = await db.event_votes.count_documents({"event_id": event["event_id"]})
        event["total_votes"] = vote_count
        
        # Calcular status
        now = datetime.now(timezone.utc)
        start = event.get("start_date")
        end = event.get("end_date")
        
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace('Z', '+00:00'))
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace('Z', '+00:00'))
        
        if not event.get("active"):
            event["computed_status"] = "inactive"
        elif now < start:
            event["computed_status"] = "upcoming"
        elif now > end:
            event["computed_status"] = "ended"
        else:
            event["computed_status"] = "active"
    
    return events


@router.get("/photos/available")
async def list_available_photos(request: Request):
    """Listar fotos aprovadas disponíveis para eventos (gestao+)"""
    await require_gestao(request)
    db = await get_db(request)
    
    photos = await db.photos.find(
        {"status": "approved"},
        {"_id": 0, "photo_id": 1, "title": 1, "url": 1, "author_name": 1, "aircraft_model": 1}
    ).sort("created_at", -1).limit(200).to_list(200)
    
    return photos
