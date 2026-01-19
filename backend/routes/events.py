"""
Events API Routes
Sistema de eventos com votação de fotos e enquetes
VERSÃO ESTÁVEL – corrigido erro 520 (datetime naive vs aware)
"""

from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
import uuid
import logging

from models import (
    HIERARCHY_LEVELS,
    get_highest_role_level,
    can_vote_in_event,
    EventType
)
from routes.logs import create_audit_log, get_client_ip

router = APIRouter(prefix="/events", tags=["events"])
logger = logging.getLogger("events")


# ==================== HELPERS ====================

def normalize_datetime(value):
    """
    Garante datetime UTC com timezone
    Aceita string ISO, datetime naive ou aware
    """
    if value is None:
        return None

    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


async def get_db(request: Request):
    return request.app.state.db


async def get_current_user(request: Request):
    from routes.auth import get_current_user_from_request
    return await get_current_user_from_request(request)


async def get_current_user_optional(request: Request):
    try:
        return await get_current_user(request)
    except Exception:
        return None


async def require_gestao(request: Request):
    user = await get_current_user(request)
    level = get_highest_role_level(user.get("tags", []))
    if level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito à gestão")
    return user


# ==================== PUBLIC ====================

@router.get("")
async def list_events(request: Request, include_ended: bool = False):
    """
    LISTA EVENTOS (endpoint que estava quebrando)
    """
    try:
        db = await get_db(request)
        now = datetime.now(timezone.utc)

        query = {"active": True}
        if not include_ended:
            query["end_date"] = {"$gte": now}

        events = await db.events.find(query, {"_id": 0}).sort("start_date", 1).to_list(100)

        for event in events:
            start = normalize_datetime(event.get("start_date"))
            end = normalize_datetime(event.get("end_date"))

            if start and now < start:
                event["computed_status"] = "upcoming"
            elif end and now > end:
                event["computed_status"] = "ended"
            else:
                event["computed_status"] = "active"

        return events

    except Exception as e:
        logger.exception("ERRO LIST_EVENTS")
        raise HTTPException(status_code=500, detail="Erro ao listar eventos")


@router.get("/{event_id}")
async def get_event(request: Request, event_id: str):
    db = await get_db(request)
    user = await get_current_user_optional(request)

    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    now = datetime.now(timezone.utc)
    start = normalize_datetime(event.get("start_date"))
    end = normalize_datetime(event.get("end_date"))

    if start and now < start:
        event["computed_status"] = "upcoming"
    elif end and now > end:
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
        if vote:
            event["user_vote"] = {
                "photo_id": vote.get("photo_id"),
                "option_id": vote.get("option_id")
            }
    else:
        event["can_vote"] = False
        event["has_voted"] = False

    if event.get("event_type") == EventType.PHOTO:
        photos = await db.photos.find(
            {"photo_id": {"$in": event.get("photo_ids", [])}},
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
        "is_authenticated": user is not None,
        "can_vote": False,
        "has_voted": False,
        "reason": None
    }

    if not user:
        result["reason"] = "Login necessário"
        return result

    now = datetime.now(timezone.utc)
    start = normalize_datetime(event.get("start_date"))
    end = normalize_datetime(event.get("end_date"))

    if start and now < start:
        result["reason"] = "Votação ainda não começou"
        return result
    if end and now > end:
        result["reason"] = "Votação encerrada"
        return result

    if not can_vote_in_event(
        user.get("tags", []),
        event.get("allowed_tags", []),
        event.get("allow_visitors", False)
    ):
        result["reason"] = "Sem permissão"
        return result

    vote = await db.event_votes.find_one({
        "event_id": event_id,
        "user_id": user["user_id"]
    })

    if vote:
        result["has_voted"] = True
        result["reason"] = "Já votou"
        return result

    result["can_vote"] = True
    return result
