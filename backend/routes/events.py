"""
Events API Routes
Sistema de eventos com votação de fotos e enquetes
Permissões configuráveis por tags
"""

from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import (
    HIERARCHY_LEVELS,
    get_highest_role_level,
    can_vote_in_event,
    EventType,
    EventStatus,
)
from routes.logs import create_audit_log, get_client_ip
import uuid

router = APIRouter(prefix="/events", tags=["events"])


# ==================== HELPERS ====================

async def get_db(request: Request):
    return request.app.state.db


async def get_current_user(request: Request):
    from routes.auth import get_current_user_from_request
    return await get_current_user_from_request(request)


async def get_current_user_optional(request: Request):
    try:
        from routes.auth import get_current_user_from_request
        return await get_current_user_from_request(request)
    except Exception:
        return None


async def require_gestao(request: Request):
    user = await get_current_user(request)
    level = get_highest_role_level(user.get("tags", []))
    if level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito à gestão")
    return user


def parse_datetime_safe(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None
    return None


# ==================== PUBLIC ====================

@router.get("")
async def list_events(request: Request, include_ended: bool = False):
    """
    Lista eventos públicos
    Nunca quebra mesmo com dados inválidos
    """
    db = await get_db(request)
    now = datetime.now(timezone.utc)

    query = {"active": True}
    if not include_ended:
        query["end_date"] = {"$gte": now}

    events = await db.events.find(query, {"_id": 0}).sort("start_date", 1).to_list(100)

    safe_events = []

    for event in events:
        try:
            start = parse_datetime_safe(event.get("start_date"))
            end = parse_datetime_safe(event.get("end_date"))

            # ignora evento inválido
            if not start or not end:
                continue

            if now < start:
                event["computed_status"] = "upcoming"
            elif now > end:
                event["computed_status"] = "ended"
            else:
                event["computed_status"] = "active"

            safe_events.append(event)

        except Exception as e:
            print("EVENT ERROR:", event.get("event_id"), e)
            continue

    return safe_events


@router.get("/{event_id}")
async def get_event(request: Request, event_id: str):
    db = await get_db(request)
    user = await get_current_user_optional(request)

    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    now = datetime.now(timezone.utc)
    start = parse_datetime_safe(event.get("start_date"))
    end = parse_datetime_safe(event.get("end_date"))

    if not start or not end:
        raise HTTPException(status_code=500, detail="Evento com data inválida")

    if now < start:
        event["computed_status"] = "upcoming"
    elif now > end:
        event["computed_status"] = "ended"
    else:
        event["computed_status"] = "active"

    if user:
        tags = user.get("tags", [])
        event["can_vote"] = can_vote_in_event(
            tags,
            event.get("allowed_tags", []),
            event.get("allow_visitors", False)
        )

        vote = await db.event_votes.find_one({
            "event_id": event_id,
            "user_id": user["user_id"]
        })
        event["has_voted"] = vote is not None
    else:
        event["can_vote"] = False
        event["has_voted"] = False

    if event.get("event_type") == EventType.PHOTO and event.get("photo_ids"):
        photos = await db.photos.find(
            {"photo_id": {"$in": event["photo_ids"]}},
            {"_id": 0, "photo_id": 1, "title": 1, "url": 1, "author_name": 1}
        ).to_list(100)
        event["photos"] = photos

    return event


@router.get("/{event_id}/check-permission")
async def check_vote_permission(request: Request, event_id: str):
    db = await get_db(request)
    user = await get_current_user_optional(request)

    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    result = {
        "event_id": event_id,
        "is_authenticated": bool(user),
        "can_vote": False,
        "has_voted": False,
        "reason": None
    }

    if not user:
        result["reason"] = "Faça login para votar"
        return result

    start = parse_datetime_safe(event.get("start_date"))
    end = parse_datetime_safe(event.get("end_date"))
    now = datetime.now(timezone.utc)

    if not start or not end:
        result["reason"] = "Evento inválido"
        return result

    if now < start:
        result["reason"] = "Votação ainda não começou"
        return result

    if now > end:
        result["reason"] = "Votação encerrada"
        return result

    if not event.get("active"):
        result["reason"] = "Evento inativo"
        return result

    if not can_vote_in_event(
        user.get("tags", []),
        event.get("allowed_tags", []),
        event.get("allow_visitors", False)
    ):
        result["reason"] = "Sem permissão para votar"
        return result

    existing = await db.event_votes.find_one({
        "event_id": event_id,
        "user_id": user["user_id"]
    })

    if existing:
        result["has_voted"] = True
        result["reason"] = "Você já votou"
        return result

    result["can_vote"] = True
    return result


@router.post("/{event_id}/vote")
async def vote_in_event(request: Request, event_id: str):
    db = await get_db(request)
    user = await get_current_user(request)
    body = await request.json()

    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    start = parse_datetime_safe(event.get("start_date"))
    end = parse_datetime_safe(event.get("end_date"))
    now = datetime.now(timezone.utc)

    if not start or not end:
        raise HTTPException(status_code=400, detail="Evento inválido")

    if now < start or now > end:
        raise HTTPException(status_code=400, detail="Votação fora do período")

    if not can_vote_in_event(
        user.get("tags", []),
        event.get("allowed_tags", []),
        event.get("allow_visitors", False)
    ):
        raise HTTPException(status_code=403, detail="Sem permissão para votar")

    if await db.event_votes.find_one({"event_id": event_id, "user_id": user["user_id"]}):
        raise HTTPException(status_code=400, detail="Você já votou")

    vote = {
        "vote_id": f"vote_{uuid.uuid4().hex[:8]}",
        "event_id": event_id,
        "user_id": user["user_id"],
        "created_at": now
    }

    if event.get("event_type") == EventType.PHOTO:
        vote["photo_id"] = body.get("photo_id")
    else:
        vote["option_id"] = body.get("option_id")

    await db.event_votes.insert_one(vote)
    return {"message": "Voto registrado com sucesso"}
