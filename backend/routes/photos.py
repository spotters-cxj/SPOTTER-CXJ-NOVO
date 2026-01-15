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
    credits: Optional[str] = Form(None),
    is_own_photo: Optional[str] = Form("true"),
    file: UploadFile = File(...)
):
    """Upload a new photo"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    # Convert is_own_photo string to boolean
    is_own = is_own_photo.lower() == "true" if is_own_photo else True
    
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

@router.get("/check-missing-files")
async def check_missing_files(request: Request):
    """Check which photos have missing files - Admin only"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    # Check admin permission
    user_tags = user.get("tags", [])
    if not any(tag in user_tags for tag in ["admin", "gestao", "lider"]):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get all photos (excluding dismissed ones)
    photos = await db.photos.find(
        {"missing_dismissed": {"$ne": True}}, 
        {"_id": 0}
    ).to_list(1000)
    
    missing_files = []
    existing_files = []
    
    for photo in photos:
        url = photo.get("url", "")
        if url.startswith("/api/uploads/"):
            filename = url.split("/")[-1]
            file_path = f"/app/backend/uploads/{filename}"
            
            if not os.path.exists(file_path):
                missing_files.append({
                    "photo_id": photo.get("photo_id"),
                    "title": photo.get("title"),
                    "author_name": photo.get("author_name"),
                    "url": url,
                    "status": photo.get("status")
                })
            else:
                existing_files.append(photo.get("photo_id"))
    
    return {
        "total_photos": len(photos),
        "missing_count": len(missing_files),
        "existing_count": len(existing_files),
        "missing_files": missing_files
    }

@router.post("/dismiss-missing/{photo_id}")
async def dismiss_missing_photo(request: Request, photo_id: str):
    """Mark a photo as dismissed from missing files list - Admin only"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    # Check admin permission
    user_tags = user.get("tags", [])
    if not any(tag in user_tags for tag in ["admin", "gestao", "lider"]):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get existing photo
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Mark as dismissed (won't appear in missing files list)
    await db.photos.update_one(
        {"photo_id": photo_id}, 
        {"$set": {"missing_dismissed": True, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Foto removida da lista de arquivos faltantes", "photo_id": photo_id}

@router.post("/reupload/{photo_id}")
async def reupload_photo_file(
    request: Request,
    photo_id: str,
    file: UploadFile = File(...)
):
    """Reupload a photo file - Admin only"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    # Check admin permission
    user_tags = user.get("tags", [])
    if not any(tag in user_tags for tag in ["admin", "gestao", "lider"]):
        raise HTTPException(status_code=403, detail="Apenas admin, gestão ou lider podem fazer reupload")
    
    # Get existing photo
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Read and validate file
    file_content = await file.read()
    
    if len(file_content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 15MB")
    
    # Validate image
    try:
        img = Image.open(io.BytesIO(file_content))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Arquivo de imagem inválido")
    
    # Save file
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if file_ext not in ["jpg", "jpeg", "png", "webp"]:
        file_ext = "jpg"
    
    new_filename = f"{photo_id}.{file_ext}"
    upload_dir = "/app/backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{new_filename}"
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Update photo URL and remove dismissed flag
    new_url = f"/api/uploads/{new_filename}"
    await db.photos.update_one(
        {"photo_id": photo_id}, 
        {"$set": {"url": new_url, "missing_dismissed": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Arquivo reenviado com sucesso", "photo_id": photo_id, "url": new_url}

