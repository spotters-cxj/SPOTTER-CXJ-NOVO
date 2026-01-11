from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone, timedelta
from models import Photo, PhotoStatus, PhotoCreate, HIERARCHY_LEVELS, get_highest_role_level
import uuid
import os

router = APIRouter(prefix="/photos", tags=["photos"])

MAX_QUEUE_SIZE = 50
PRIORITY_POSITIONS = 10
PHOTOS_PER_WEEK = 5

async def get_db(request: Request):
    return request.app.state.db

async def get_current_user(request: Request):
    from routes.auth import get_current_user as auth_get_user
    return await auth_get_user(request)

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

@router.get("")
async def list_photos(request: Request, status: Optional[str] = "approved", 
                      aircraft_type: Optional[str] = None, limit: int = 50):
    """List approved photos (public)"""
    db = await get_db(request)
    
    query = {"status": status}
    if aircraft_type:
        query["aircraft_type"] = aircraft_type
    
    photos = await db.photos.find(query, {"_id": 0}).sort("approved_at", -1).limit(limit).to_list(limit)
    return photos

@router.get("/queue")
async def get_queue_status(request: Request):
    """Get current queue status"""
    db = await get_db(request)
    
    pending_count = await db.photos.count_documents({"status": "pending"})
    
    return {
        "current": pending_count,
        "max": MAX_QUEUE_SIZE,
        "is_full": pending_count >= MAX_QUEUE_SIZE,
        "priority_slots_used": min(pending_count, PRIORITY_POSITIONS)
    }

@router.get("/my")
async def get_my_photos(request: Request):
    """Get current user's photos"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    photos = await db.photos.find(
        {"author_id": user["user_id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return photos

@router.post("")
async def upload_photo(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    aircraft_model: str = Form(...),
    aircraft_type: str = Form(...),
    registration: Optional[str] = Form(None),
    airline: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    photo_date: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload a new photo"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    if not user.get("approved", False):
        raise HTTPException(status_code=403, detail="Usuário não aprovado para upload")
    
    # Check queue
    pending_count = await db.photos.count_documents({"status": "pending"})
    if pending_count >= MAX_QUEUE_SIZE:
        await create_notification(
            db, user["user_id"], "queue_full",
            "⏳ A fila de aprovação está cheia no momento. Tente novamente mais tarde."
        )
        raise HTTPException(status_code=429, detail="Fila de aprovação cheia. Tente mais tarde.")
    
    # Check weekly limit
    user_data = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    is_colaborador = "colaborador" in user_data.get("tags", [])
    is_unlimited = user_data.get("subscription_type") == "unlimited"
    
    # Reset weekly counter if needed
    week_start = user_data.get("week_start")
    now = datetime.now(timezone.utc)
    if not week_start or (now - week_start.replace(tzinfo=timezone.utc if week_start.tzinfo is None else week_start.tzinfo)).days >= 7:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"week_start": now, "photos_this_week": 0}}
        )
        user_data["photos_this_week"] = 0
    
    photos_this_week = user_data.get("photos_this_week", 0)
    
    if not is_unlimited and not is_colaborador:
        if photos_this_week >= PHOTOS_PER_WEEK:
            raise HTTPException(
                status_code=403, 
                detail=f"Limite semanal de {PHOTOS_PER_WEEK} fotos atingido. Faça upgrade para enviar mais."
            )
    
    # Save file
    file_content = await file.read()
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    photo_id = f"photo_{uuid.uuid4().hex[:12]}"
    
    upload_dir = "/app/backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{photo_id}.{file_ext}"
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Calculate queue position
    if is_colaborador and pending_count < PRIORITY_POSITIONS:
        queue_position = pending_count + 1
        priority = True
    else:
        queue_position = pending_count + 1
        priority = False
    
    # Create photo record
    photo_data = {
        "photo_id": photo_id,
        "url": f"/api/uploads/{photo_id}.{file_ext}",
        "title": title,
        "description": description,
        "aircraft_model": aircraft_model,
        "aircraft_type": aircraft_type,
        "registration": registration,
        "airline": airline,
        "location": location,
        "photo_date": photo_date,
        "author_id": user["user_id"],
        "author_name": user["name"],
        "status": "pending",
        "queue_position": queue_position,
        "priority": priority,
        "final_rating": None,
        "rating_count": 0,
        "public_rating": 0.0,
        "public_rating_count": 0,
        "comments_count": 0,
        "views": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.photos.insert_one(photo_data)
    
    # Update user's weekly count
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"photos_this_week": 1}}
    )
    
    # Send notification
    await create_notification(
        db, user["user_id"], "photo_sent",
        f"Sua foto '{title}' foi enviada com sucesso e está aguardando avaliação. Posição na fila: {queue_position}",
        {"photo_id": photo_id}
    )
    
    return {"photo_id": photo_id, "queue_position": queue_position, "message": "Foto enviada para avaliação"}

@router.get("/{photo_id}")
async def get_photo(request: Request, photo_id: str):
    """Get single photo details"""
    db = await get_db(request)
    
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Increment views
    await db.photos.update_one({"photo_id": photo_id}, {"$inc": {"views": 1}})
    
    # Get comments
    comments = await db.comments.find({"photo_id": photo_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    photo["comments"] = comments
    
    return photo

@router.post("/{photo_id}/rate")
async def rate_photo(request: Request, photo_id: str):
    """Public rating (1-5 stars)"""
    user = await get_current_user(request)
    db = await get_db(request)
    body = await request.json()
    rating = body.get("rating")
    
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating deve ser entre 1 e 5")
    
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo or photo["status"] != "approved":
        raise HTTPException(status_code=404, detail="Foto não encontrada ou não aprovada")
    
    # Check if already rated
    existing = await db.public_ratings.find_one({
        "photo_id": photo_id,
        "user_id": user["user_id"]
    })
    
    if existing:
        # Update existing rating
        await db.public_ratings.update_one(
            {"rating_id": existing["rating_id"]},
            {"$set": {"rating": rating}}
        )
    else:
        # New rating
        await db.public_ratings.insert_one({
            "rating_id": f"rating_{uuid.uuid4().hex[:8]}",
            "photo_id": photo_id,
            "user_id": user["user_id"],
            "rating": rating,
            "created_at": datetime.now(timezone.utc)
        })
    
    # Recalculate average
    ratings = await db.public_ratings.find({"photo_id": photo_id}).to_list(1000)
    avg = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0
    
    await db.photos.update_one(
        {"photo_id": photo_id},
        {"$set": {"public_rating": round(avg, 2), "public_rating_count": len(ratings)}}
    )
    
    return {"message": "Avaliação registrada", "new_average": round(avg, 2)}

@router.post("/{photo_id}/comment")
async def add_comment(request: Request, photo_id: str):
    """Add comment to photo"""
    user = await get_current_user(request)
    db = await get_db(request)
    body = await request.json()
    content = body.get("content")
    
    if not content or len(content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Comentário não pode ser vazio")
    
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo or photo["status"] != "approved":
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    comment = {
        "comment_id": f"comment_{uuid.uuid4().hex[:8]}",
        "photo_id": photo_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_picture": user.get("picture"),
        "content": content.strip(),
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.comments.insert_one(comment)
    await db.photos.update_one({"photo_id": photo_id}, {"$inc": {"comments_count": 1}})
    
    return {"comment_id": comment["comment_id"], "message": "Comentário adicionado"}

@router.put("/{photo_id}/edit")
async def edit_photo(request: Request, photo_id: str):
    """
    Edit photo information after upload.
    Campos obrigatórios: airline, title, aircraft_model, aircraft_type, registration, location, photo_date
    Campo opcional: description
    """
    user = await get_current_user(request)
    db = await get_db(request)
    body = await request.json()
    
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Check permission: author or gestao+
    user_level = get_highest_role_level(user.get("tags", []))
    is_author = photo["author_id"] == user["user_id"]
    is_admin = user_level >= HIERARCHY_LEVELS["gestao"]
    
    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para editar esta foto")
    
    # Required fields validation
    required_fields = ["airline", "title", "aircraft_model", "aircraft_type", "registration", "location", "photo_date"]
    for field in required_fields:
        if field in body and (body[field] is None or str(body[field]).strip() == ""):
            raise HTTPException(status_code=400, detail=f"Campo obrigatório '{field}' não pode estar vazio")
    
    # Build update dict with only provided fields
    update_data = {}
    editable_fields = ["airline", "title", "aircraft_model", "aircraft_type", "registration", "location", "photo_date", "description"]
    
    old_values = {}
    for field in editable_fields:
        if field in body:
            old_values[field] = photo.get(field)
            update_data[field] = body[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    # Add edit timestamp and editor info
    update_data["last_edited_at"] = datetime.now(timezone.utc)
    update_data["last_edited_by"] = user["user_id"]
    update_data["last_edited_by_name"] = user["name"]
    
    # Save edit history
    edit_history_entry = {
        "edited_at": datetime.now(timezone.utc),
        "edited_by": user["user_id"],
        "edited_by_name": user["name"],
        "changes": {k: {"old": old_values.get(k), "new": v} for k, v in update_data.items() if k in editable_fields}
    }
    
    await db.photos.update_one(
        {"photo_id": photo_id},
        {
            "$set": update_data,
            "$push": {"edit_history": edit_history_entry}
        }
    )
    
    # Create audit log
    from routes.logs import create_audit_log
    forwarded = request.headers.get("X-Forwarded-For")
    ip_address = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user["name"],
        action="update",
        entity_type="photo",
        entity_id=photo_id,
        entity_name=photo.get("title"),
        details=f"Foto editada: {', '.join(update_data.keys())}",
        old_value=old_values,
        new_value={k: v for k, v in update_data.items() if k in editable_fields},
        ip_address=ip_address,
        admin_email=user.get("email")
    )
    
    return {"message": "Foto atualizada com sucesso", "updated_fields": list(update_data.keys())}

@router.get("/{photo_id}/edit-history")
async def get_photo_edit_history(request: Request, photo_id: str):
    """Get edit history for a photo (author or gestao+)"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Check permission
    user_level = get_highest_role_level(user.get("tags", []))
    is_author = photo["author_id"] == user["user_id"]
    is_admin = user_level >= HIERARCHY_LEVELS["gestao"]
    
    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para ver histórico")
    
    return {
        "photo_id": photo_id,
        "edit_history": photo.get("edit_history", []),
        "last_edited_at": photo.get("last_edited_at"),
        "last_edited_by_name": photo.get("last_edited_by_name")
    }

@router.delete("/{photo_id}")
async def delete_photo(request: Request, photo_id: str):
    """Delete photo (author or admin)"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    user_level = get_highest_role_level(user.get("tags", []))
    is_author = photo["author_id"] == user["user_id"]
    is_admin = user_level >= HIERARCHY_LEVELS["gestao"]
    
    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para excluir")
    
    # Delete file
    try:
        file_path = f"/app/backend{photo['url'].replace('/api', '')}"
        if os.path.exists(file_path):
            os.remove(file_path)
    except:
        pass
    
    await db.photos.delete_one({"photo_id": photo_id})
    await db.comments.delete_many({"photo_id": photo_id})
    await db.public_ratings.delete_many({"photo_id": photo_id})
    await db.evaluations.delete_many({"photo_id": photo_id})
    
    return {"message": "Foto excluída"}
