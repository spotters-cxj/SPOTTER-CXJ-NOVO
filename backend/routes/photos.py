from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from typing import Optional
from datetime import datetime, timezone, timedelta
from models import Photo, PhotoStatus, PhotoCreate, HIERARCHY_LEVELS, get_highest_role_level
import uuid
import os
from PIL import Image
import io

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
                      aircraft_type: Optional[str] = None, 
                      author_id: Optional[str] = None,
                      limit: int = 50):
    """List approved photos (public) - can filter by author"""
    db = await get_db(request)
    
    query = {"status": status}
    if aircraft_type:
        query["aircraft_type"] = aircraft_type
    if author_id:
        query["author_id"] = author_id
    
    photos = await db.photos.find(query, {"_id": 0}).sort("approved_at", -1).limit(limit).to_list(limit)
    return photos

@router.get("/search/registration")
async def search_by_registration(request: Request, registration: str):
    """Search photos by aircraft registration"""
    db = await get_db(request)
    
    if not registration:
        raise HTTPException(status_code=400, detail="Registration parameter required")
    
    # Search for approved photos with this registration
    photos = await db.photos.find(
        {
            "status": "approved",
            "registration": {"$regex": registration, "$options": "i"}
        },
        {"_id": 0}
    ).sort("approved_at", -1).limit(50).to_list(50)
    
    return photos
        query["author_id"] = author_id
    
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
    airline: str = Form(...),
    location: str = Form(...),
    photo_date: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload a new photo - airline and location are now required"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    # Check if user is VISITANTE (block upload)
    user_tags = user.get("tags", [])
    if "visitante" in user_tags and len(user_tags) == 1:
        raise HTTPException(
            status_code=403, 
            detail="Visitantes não podem enviar fotos. Aguarde aprovação de um administrador para se tornar Spotter CXJ."
        )
    
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
    
    # Read and validate file
    file_content = await file.read()
    
    # Validate file size (10MB max)
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 10MB")
    
    # Validate image dimensions (minimum 1080p in any dimension)
    try:
        img = Image.open(io.BytesIO(file_content))
        width, height = img.size
        
        # Mínimo: pelo menos uma dimensão deve ter 1080px
        # Aceita diferentes aspect ratios: 1:1, 4:5, 16:9, 9:16, etc
        min_dimension = 1080
        if width < min_dimension and height < min_dimension:
            raise HTTPException(
                status_code=400, 
                detail=f"Resolução muito baixa. Pelo menos uma dimensão deve ter mínimo {min_dimension}px (ex: 1080x1080, 1920x1080, 1080x1920, etc)"
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail="Arquivo inválido ou corrompido")
    
    # Save file
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
    
    # Check if user has auto-approve permission (avaliador, admin, gestao, lider)
    auto_approve_tags = ["avaliador", "admin", "gestao", "lider"]
    has_auto_approve = any(tag in user_data.get("tags", []) for tag in auto_approve_tags)
    
    # Set status based on permissions
    photo_status = "approved" if has_auto_approve else "pending"
    approved_at = datetime.now(timezone.utc) if has_auto_approve else None
    
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
        "status": photo_status,
        "queue_position": queue_position if not has_auto_approve else None,
        "priority": priority,
        "final_rating": 5.0 if has_auto_approve else None,  # Auto 5 estrelas
        "rating_count": 1 if has_auto_approve else 0,
        "public_rating": 5.0 if has_auto_approve else 0.0,
        "public_rating_count": 1 if has_auto_approve else 0,
        "comments_count": 0,
        "views": 0,
        "created_at": datetime.now(timezone.utc),
        "approved_at": approved_at
    }
    
    await db.photos.insert_one(photo_data)
    
    # Update user's weekly count
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$inc": {"photos_this_week": 1}}
    )
    
    # Send notification based on auto-approve
    if has_auto_approve:
        await create_notification(
            db, user["user_id"], "photo_approved",
            f"✅ Sua foto '{title}' foi publicada automaticamente na galeria!",
            {"photo_id": photo_id}
        )
        return {"photo_id": photo_id, "status": "approved", "message": "Foto publicada automaticamente!", "auto_approved": True}
    else:
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
    
    # Check permission: author (within 24h) or gestao+
    user_level = get_highest_role_level(user.get("tags", []))
    is_author = photo["author_id"] == user["user_id"]
    is_admin = user_level >= HIERARCHY_LEVELS["gestao"]
    
    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Sem permissão para editar esta foto")
    
    # Check 24h time limit for authors (admins can edit anytime)
    if is_author and not is_admin:
        created_at = photo.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            
            time_diff = datetime.now(timezone.utc) - created_at
            if time_diff > timedelta(hours=24):
                raise HTTPException(
                    status_code=403, 
                    detail="Período de edição expirado. Você pode editar fotos apenas até 24h após o envio."
                )
    
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


@router.put("/{photo_id}")
async def update_photo(
    request: Request,
    photo_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    aircraft_model: Optional[str] = Form(None),
    aircraft_type: Optional[str] = Form(None),
    registration: Optional[str] = Form(None),
    airline: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    photo_date: Optional[str] = Form(None),
    final_rating: Optional[float] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Update photo details - Admin/Gestao/Lider only"""
    user = await get_current_user(request)
    db = await get_db(request)
    
    # Check admin permission
    user_tags = user.get("tags", [])
    if not any(tag in user_tags for tag in ["admin", "gestao", "lider"]):
        raise HTTPException(status_code=403, detail="Apenas admin, gestão ou lider podem editar fotos")
    
    # Get existing photo
    photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Build update dict
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if description is not None:
        update_data["description"] = description
    if aircraft_model is not None:
        update_data["aircraft_model"] = aircraft_model
    if aircraft_type is not None:
        update_data["aircraft_type"] = aircraft_type
    if registration is not None:
        update_data["registration"] = registration
    if airline is not None:
        update_data["airline"] = airline
    if location is not None:
        update_data["location"] = location
    if photo_date is not None:
        update_data["photo_date"] = photo_date
    if final_rating is not None:
        update_data["final_rating"] = final_rating
        update_data["public_rating"] = final_rating
    
    # Handle file replacement if provided
    if file:
        # Read and validate new file
        file_content = await file.read()
        
        # Validate file size (10MB max)
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 10MB")
        
        # Validate image
        try:
            img = Image.open(io.BytesIO(file_content))
            width, height = img.size
            min_dimension = 1080
            if width < min_dimension and height < min_dimension:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Resolução muito baixa. Pelo menos uma dimensão deve ter mínimo {min_dimension}px"
                )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=400, detail="Arquivo inválido ou corrompido")
        
        # Delete old file and save new one
        old_url = photo.get("url", "")
        if old_url.startswith("/api/uploads/"):
            old_filename = old_url.split("/")[-1]
            old_path = f"/app/backend/uploads/{old_filename}"
            try:
                if os.path.exists(old_path):
                    os.remove(old_path)
            except:
                pass
        
        # Save new file
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        new_filename = f"{photo_id}.{file_ext}"
        upload_dir = "/app/backend/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = f"{upload_dir}/{new_filename}"
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        update_data["url"] = f"/api/uploads/{new_filename}"
    
    # Update photo
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.photos.update_one({"photo_id": photo_id}, {"$set": update_data})
    
    return {"message": "Foto atualizada com sucesso", "photo_id": photo_id}
