from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level, can_access_level
import uuid

router = APIRouter(prefix="/evaluation", tags=["evaluation"])

MIN_EVALUATORS_PERCENT = 0.5  # 50%
MIN_APPROVAL_SCORE = 3.0

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user as auth_get_user
    return await auth_get_user(request)

async def require_evaluator(request: Request):
    """Require avaliador level or higher"""
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["avaliador"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a avaliadores")
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

@router.get("/queue")
async def get_evaluation_queue(request: Request):
    """Get photos pending evaluation (avaliador+)"""
    user = await require_evaluator(request)
    db = await get_db(request)
    
    # Get pending photos not authored by current user
    photos = await db.photos.find(
        {
            "status": "pending",
            "author_id": {"$ne": user["user_id"]}
        },
        {"_id": 0}
    ).sort([("priority", -1), ("queue_position", 1)]).to_list(50)
    
    # Filter out already evaluated by this user using projection for efficiency
    user_evals = await db.evaluations.find(
        {"evaluator_id": user["user_id"]},
        {"photo_id": 1, "_id": 0}
    ).to_list(1000)
    evaluated_ids = {ev["photo_id"] for ev in user_evals}
    
    photos = [p for p in photos if p["photo_id"] not in evaluated_ids]
    
    return photos

@router.get("/{photo_id}")
async def get_photo_for_evaluation(request: Request, photo_id: str):
    """Get photo details for evaluation"""
    user = await require_evaluator(request)
    db = await get_db(request)
    
    photo = await db.photos.find_one({"photo_id": photo_id, "status": "pending"}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada ou já avaliada")
    
    # Cannot evaluate own photo
    if photo["author_id"] == user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não pode avaliar sua própria foto")
    
    # Check if already evaluated
    existing = await db.evaluations.find_one({
        "photo_id": photo_id,
        "evaluator_id": user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Você já avaliou esta foto")
    
    # Get current evaluations count
    eval_count = await db.evaluations.count_documents({"photo_id": photo_id})
    photo["evaluations_count"] = eval_count
    
    return photo

@router.post("/{photo_id}")
async def submit_evaluation(request: Request, photo_id: str):
    """Submit evaluation for a photo"""
    user = await require_evaluator(request)
    db = await get_db(request)
    body = await request.json()
    
    criteria = body.get("criteria", {})
    comment = body.get("comment")
    
    # Validate criteria
    required_fields = ["technical_quality", "composition", "moment_angle", "editing", "spotter_criteria"]
    for field in required_fields:
        if field not in criteria or not (0 <= criteria[field] <= 5):
            raise HTTPException(status_code=400, detail=f"Critério {field} inválido")
    
    photo = await db.photos.find_one({"photo_id": photo_id, "status": "pending"}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada ou já processada")
    
    # Cannot evaluate own photo
    if photo["author_id"] == user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não pode avaliar sua própria foto")
    
    # Check if already evaluated
    existing = await db.evaluations.find_one({
        "photo_id": photo_id,
        "evaluator_id": user["user_id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Você já avaliou esta foto")
    
    # Calculate final score (average of criteria)
    final_score = sum(criteria.values()) / len(criteria)
    
    # Save evaluation
    evaluation = {
        "evaluation_id": f"eval_{uuid.uuid4().hex[:12]}",
        "photo_id": photo_id,
        "evaluator_id": user["user_id"],
        "evaluator_name": user["name"],
        "criteria": criteria,
        "final_score": round(final_score, 2),
        "comment": comment,
        "created_at": datetime.now(timezone.utc)
    }
    await db.evaluations.insert_one(evaluation)
    
    # Update photo rating count
    await db.photos.update_one(
        {"photo_id": photo_id},
        {"$inc": {"rating_count": 1}}
    )
    
    # Check if should process approval
    await check_photo_approval(db, photo_id)
    
    return {"message": "Avaliação registrada", "score": round(final_score, 2)}

async def check_photo_approval(db, photo_id: str):
    """Check if photo should be approved or rejected based on evaluations"""
    # Get all evaluators count
    total_evaluators = await db.users.count_documents({
        "tags": {"$in": ["avaliador", "produtor", "gestao", "admin", "lider"]}
    })
    
    if total_evaluators == 0:
        return
    
    # Get evaluations for this photo
    evaluations = await db.evaluations.find({"photo_id": photo_id}).to_list(1000)
    
    # Need at least 50% of evaluators
    min_evaluations = max(1, int(total_evaluators * MIN_EVALUATORS_PERCENT))
    
    if len(evaluations) < min_evaluations:
        return  # Not enough evaluations yet
    
    # Check approval: >50% gave >3
    scores_above_3 = sum(1 for e in evaluations if e["final_score"] > MIN_APPROVAL_SCORE)
    approval_rate = scores_above_3 / len(evaluations)
    
    # Calculate final rating
    final_rating = sum(e["final_score"] for e in evaluations) / len(evaluations)
    
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    
    if approval_rate > 0.5:
        # APPROVED
        await db.photos.update_one(
            {"photo_id": photo_id},
            {
                "$set": {
                    "status": "approved",
                    "final_rating": round(final_rating, 2),
                    "approved_at": datetime.now(timezone.utc)
                }
            }
        )
        await create_notification(
            db, photo["author_id"], "photo_approved",
            f"🎉 Sua foto '{photo['title']}' foi APROVADA!\nNota final: ⭐ {final_rating:.1f}\nEla já está publicada no site.",
            {"photo_id": photo_id, "rating": round(final_rating, 2)}
        )
    else:
        # REJECTED
        await db.photos.update_one(
            {"photo_id": photo_id},
            {
                "$set": {
                    "status": "rejected",
                    "final_rating": round(final_rating, 2),
                    "rejected_at": datetime.now(timezone.utc)
                }
            }
        )
        await create_notification(
            db, photo["author_id"], "photo_rejected",
            f"❌ Sua foto '{photo['title']}' não foi aprovada desta vez.\nNota final: ⭐ {final_rating:.1f}\nVocê pode reenviar após ajustes.",
            {"photo_id": photo_id, "rating": round(final_rating, 2)}
        )

@router.get("/history/{photo_id}")
async def get_evaluation_history(request: Request, photo_id: str):
    """Get evaluation history for a photo (gestao+)"""
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito à gestão")
    
    db = await get_db(request)
    evaluations = await db.evaluations.find({"photo_id": photo_id}, {"_id": 0}).to_list(100)
    
    return evaluations

@router.get("/evaluator/{evaluator_id}/history")
async def get_evaluator_history(request: Request, evaluator_id: str):
    """Get all evaluations by an evaluator (own history or gestao+ for antifraude)"""
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    
    # Allow own history or gestao+ can view any evaluator
    if user["user_id"] != evaluator_id and user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito")
    
    db = await get_db(request)
    evaluations = await db.evaluations.find(
        {"evaluator_id": evaluator_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Enrich evaluations with photo data
    enriched_evaluations = []
    for evaluation in evaluations:
        photo = await db.photos.find_one({"photo_id": evaluation["photo_id"]}, {"_id": 0})
        enriched_evaluation = {
            "evaluation_id": evaluation["evaluation_id"],
            "photo_id": evaluation["photo_id"],
            "photo_title": photo.get("title") if photo else "Foto removida",
            "photo_author": photo.get("author_name") if photo else "Desconhecido",
            "photo_url": photo.get("url") if photo else None,
            "result": photo.get("status") if photo else "unknown",
            "score": evaluation["final_score"],
            "comment": evaluation.get("comment"),
            "evaluated_at": evaluation["created_at"]
        }
        enriched_evaluations.append(enriched_evaluation)
    
    # Calculate statistics
    if evaluations:
        avg_score = sum(e["final_score"] for e in evaluations) / len(evaluations)
        score_distribution = {}
        for e in evaluations:
            score = int(e["final_score"])
            score_distribution[score] = score_distribution.get(score, 0) + 1
    else:
        avg_score = 0
        score_distribution = {}
    
    return enriched_evaluations


@router.get("/evaluator/{evaluator_id}/history")
async def get_evaluator_history(request: Request, evaluator_id: str):
    """Get evaluation history for a specific evaluator (public)"""
    db = await get_db(request)
    
    # Get all evaluations by this evaluator
    evaluations = await db.photo_evaluations.find(
        {"evaluator_id": evaluator_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    
    # Enrich with photo info
    result = []
    for evaluation in evaluations:
        photo = await db.photos.find_one(
            {"photo_id": evaluation.get("photo_id")},
            {"_id": 0, "title": 1, "url": 1, "author_name": 1, "status": 1}
        )
        
        result.append({
            "evaluation_id": evaluation.get("evaluation_id"),
            "photo_id": evaluation.get("photo_id"),
            "photo_title": photo.get("title") if photo else "Foto removida",
            "photo_url": photo.get("url") if photo else None,
            "photo_author": photo.get("author_name") if photo else "Desconhecido",
            "score": evaluation.get("final_score", 0),
            "comment": evaluation.get("comment"),
            "result": photo.get("status") if photo else "unknown",
            "evaluated_at": evaluation.get("created_at")
        })
    
    return result
