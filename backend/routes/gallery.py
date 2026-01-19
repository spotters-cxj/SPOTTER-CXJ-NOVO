from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from typing import Optional, List
from datetime import datetime, timezone
from models import Photo, PhotoCreate, HIERARCHY_LEVELS, get_highest_role_level
from routes.logs import create_audit_log, get_client_ip
import uuid
import os
import base64

router = APIRouter(prefix="/gallery", tags=["gallery"])

# Aircraft types for filtering
AIRCRAFT_TYPES = ["Airbus", "Boeing", "Embraer", "ATR", "Aviação Geral"]

async def get_db(request: Request):
    return request.app.state.db

async def require_approved_user(request: Request):
    from routes.auth import get_current_user_from_request
    user = await get_current_user_from_request(request)
    if not user.get("approved"):
        raise HTTPException(status_code=403, detail="User not approved to upload photos")
    return user

async def require_admin(request: Request):
    from routes.auth import get_current_user_from_request
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user_from_request(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_gestao(request: Request):
    """Require gestao level or higher (admin, lider, gestao)"""
    from routes.auth import get_current_user_from_request
    user = await get_current_user_from_request(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a gestão, admin ou líder")
    return user

@router.get("")
async def list_photos(request: Request, aircraft_type: Optional[str] = None, 
                      registration: Optional[str] = None, author: Optional[str] = None,
                      author_id: Optional[str] = None):
    """List photos with optional filters (public) - from both gallery and approved photos"""
    db = await get_db(request)
    
    # Query for gallery collection (legacy)
    gallery_query = {"approved": True}
    
    # Query for photos collection (new system - approved photos)
    photos_query = {"status": "approved"}
    
    if aircraft_type:
        gallery_query["aircraft_type"] = aircraft_type
        photos_query["aircraft_type"] = aircraft_type
    if registration:
        gallery_query["registration"] = {"$regex": registration, "$options": "i"}
        photos_query["registration"] = {"$regex": registration, "$options": "i"}
    if author:
        gallery_query["author_name"] = {"$regex": author, "$options": "i"}
        photos_query["author_name"] = {"$regex": author, "$options": "i"}
    if author_id:
        gallery_query["author_id"] = author_id
        photos_query["author_id"] = author_id
    
    # Get photos from both collections
    gallery_photos = await db.gallery.find(gallery_query, {"_id": 0}).sort("created_at", -1).to_list(500)
    approved_photos = await db.photos.find(photos_query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Merge and deduplicate by photo_id
    all_photos = {}
    for photo in gallery_photos:
        all_photos[photo.get("photo_id", str(uuid.uuid4()))] = photo
    for photo in approved_photos:
        if photo.get("photo_id") not in all_photos:
            all_photos[photo["photo_id"]] = photo
    
    # Sort by created_at descending
    sorted_photos = sorted(all_photos.values(), key=lambda x: x.get("created_at", datetime.min), reverse=True)
    
    return sorted_photos

@router.get("/types")
async def get_aircraft_types():
    """Get available aircraft types for filtering"""
    return AIRCRAFT_TYPES

@router.get("/{photo_id}")
async def get_photo(request: Request, photo_id: str):
    """Get single photo details (public)"""
    db = await get_db(request)
    
    # Try gallery first
    photo = await db.gallery.find_one({"photo_id": photo_id}, {"_id": 0})
    
    # If not found, try photos collection
    if not photo:
        photo = await db.photos.find_one({"photo_id": photo_id, "status": "approved"}, {"_id": 0})
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return photo

@router.post("")
async def upload_photo(
    request: Request,
    description: str = Form(...),
    aircraft_model: str = Form(...),
    aircraft_type: str = Form(...),
    registration: Optional[str] = Form(None),
    airline: Optional[str] = Form(None),
    date: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload new photo (approved users only)"""
    user = await require_approved_user(request)
    db = await get_db(request)
    
    # Validate aircraft type
    if aircraft_type not in AIRCRAFT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid aircraft type. Must be one of: {AIRCRAFT_TYPES}")
    
    # Check limit: 5 photos per author per registration
    if registration:
        count = await db.gallery.count_documents({
            "author_id": user.get("user_id"),
            "registration": registration
        })
        if count >= 5:
            raise HTTPException(
                status_code=400, 
                detail=f"Limite de 5 fotos por autor por prefixo atingido para {registration}"
            )
    
    # Read and save file
    file_content = await file.read()
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    photo_id = f"photo_{uuid.uuid4().hex[:12]}"
    
    # Save to uploads folder
    upload_dir = "/app/backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{photo_id}.{file_ext}"
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create photo record
    photo_data = {
        "photo_id": photo_id,
        "url": f"/api/uploads/{photo_id}.{file_ext}",
        "description": description,
        "aircraft_model": aircraft_model,
        "aircraft_type": aircraft_type,
        "registration": registration,
        "airline": airline,
        "date": date,
        "author_id": user.get("user_id"),
        "author_name": user.get("name"),
        "approved": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.gallery.insert_one(photo_data)
    
    return {"photo_id": photo_id, "url": photo_data["url"], "message": "Photo uploaded successfully"}

@router.delete("/{photo_id}")
async def delete_photo(request: Request, photo_id: str):
    """Delete photo (admin or photo author)"""
    from routes.auth import get_current_user_from_request
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user_from_request(request)
    db = await get_db(request)
    
    # Try to find in gallery first
    photo = await db.gallery.find_one({"photo_id": photo_id}, {"_id": 0})
    collection = "gallery"
    
    # If not found, try photos
    if not photo:
        photo = await db.photos.find_one({"photo_id": photo_id}, {"_id": 0})
        collection = "photos"
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Check permission: admin or author
    user_level = get_highest_role_level(user.get("tags", []))
    is_admin = user_level >= HIERARCHY_LEVELS["admin"]
    is_author = photo.get("author_id") == user.get("user_id")
    
    if not is_admin and not is_author:
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    # Delete file
    try:
        file_path = f"/app/backend{photo['url'].replace('/api', '')}"
        if os.path.exists(file_path):
            os.remove(file_path)
    except:
        pass  # File might not exist
    
    if collection == "gallery":
        await db.gallery.delete_one({"photo_id": photo_id})
    else:
        await db.photos.delete_one({"photo_id": photo_id})
    
    return {"message": "Photo deleted"}

@router.get("/by-registration/{registration}")
async def get_photos_by_registration(request: Request, registration: str):
    """Get all photos for a specific registration/prefix"""
    db = await get_db(request)
    
    # Get from both collections
    gallery_photos = await db.gallery.find(
        {"registration": registration, "approved": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    approved_photos = await db.photos.find(
        {"registration": registration, "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Merge
    all_photos = {p["photo_id"]: p for p in gallery_photos}
    for p in approved_photos:
        if p["photo_id"] not in all_photos:
            all_photos[p["photo_id"]] = p
    
    return list(all_photos.values())

@router.post("/{photo_id}/resubmit")
async def resubmit_photo_to_evaluation(request: Request, photo_id: str):
    """
    Reenviar foto para fila de avaliação.
    - Apenas admin, lider ou gestor podem usar.
    - Remove a foto da galeria pública.
    - Devolve a foto para a fila de avaliação.
    - Mantém autor, data e metadados originais.
    """
    user = await require_gestao(request)
    db = await get_db(request)
    
    # Try to find in gallery collection first
    photo = await db.gallery.find_one({"photo_id": photo_id}, {"_id": 0})
    source_collection = "gallery"
    
    # If not found, try photos collection (approved status)
    if not photo:
        photo = await db.photos.find_one({"photo_id": photo_id, "status": "approved"}, {"_id": 0})
        source_collection = "photos"
    
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada ou já está em avaliação")
    
    # Get pending count for queue position
    pending_count = await db.photos.count_documents({"status": "pending"})
    
    # Prepare the photo data for resubmission
    now = datetime.now(timezone.utc)
    resubmit_data = {
        "photo_id": photo.get("photo_id", f"photo_{uuid.uuid4().hex[:12]}"),
        "url": photo.get("url"),
        "title": photo.get("title", photo.get("description", "Sem título")),
        "description": photo.get("description"),
        "aircraft_model": photo.get("aircraft_model"),
        "aircraft_type": photo.get("aircraft_type"),
        "registration": photo.get("registration"),
        "airline": photo.get("airline"),
        "location": photo.get("location"),
        "photo_date": photo.get("photo_date", photo.get("date")),
        "author_id": photo.get("author_id"),
        "author_name": photo.get("author_name"),
        "status": "pending",  # Back to pending
        "queue_position": pending_count + 1,
        "priority": False,
        "final_rating": None,
        "rating_count": 0,
        "public_rating": 0.0,
        "public_rating_count": 0,
        "comments_count": 0,
        "views": photo.get("views", 0),
        "created_at": photo.get("created_at", now),  # Keep original creation date
        "resubmitted_at": now,
        "resubmitted_by_id": user["user_id"],
        "resubmitted_by_name": user["name"],
        "original_status": "approved" if source_collection == "photos" else "gallery",
        "approved_at": None,
        "rejected_at": None
    }
    
    # If photo was in gallery collection, we need to move it to photos collection
    if source_collection == "gallery":
        # Remove from gallery
        await db.gallery.delete_one({"photo_id": photo_id})
        # Insert into photos collection
        await db.photos.insert_one(resubmit_data)
    else:
        # Update existing record in photos collection
        await db.photos.update_one(
            {"photo_id": photo_id},
            {"$set": {
                "status": "pending",
                "queue_position": pending_count + 1,
                "priority": False,
                "final_rating": None,
                "rating_count": 0,
                "resubmitted_at": now,
                "resubmitted_by_id": user["user_id"],
                "resubmitted_by_name": user["name"],
                "original_status": "approved",
                "approved_at": None,
                "rejected_at": None
            }}
        )
    
    # Delete existing evaluations for this photo
    await db.evaluations.delete_many({"photo_id": photo_id})
    
    # Create notification for the author
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:8]}",
        "user_id": photo.get("author_id"),
        "type": "photo_resubmitted",
        "message": f"📋 Sua foto '{resubmit_data.get('title')}' foi reenviada para avaliação por {user['name']}.",
        "data": {"photo_id": photo_id, "resubmitted_by": user["name"]},
        "read": False,
        "created_at": now
    }
    await db.notifications.insert_one(notification)
    
    # Create audit log
    await create_audit_log(
        db,
        admin_id=user["user_id"],
        admin_name=user["name"],
        admin_email=user.get("email"),
        action="resubmit",
        entity_type="photo",
        entity_id=photo_id,
        entity_name=resubmit_data.get("title"),
        details=f"Foto reenviada para avaliação. Autor original: {photo.get('author_name')}",
        old_value={"status": "approved", "source": source_collection},
        new_value={"status": "pending", "queue_position": pending_count + 1},
        ip_address=get_client_ip(request)
    )
    
    return {
        "message": "Foto reenviada para avaliação com sucesso",
        "photo_id": photo_id,
        "queue_position": pending_count + 1
    }

@router.get("/admin/all")
async def list_all_photos_admin(request: Request, status: Optional[str] = None, limit: int = 100):
    """
    List all photos for admin panel with status information.
    Includes: publicada, em avaliação, reenviada.
    """
    _ = await require_gestao(request)  # Verify permission
    db = await get_db(request)
    
    # Build query
    query = {}
    if status:
        if status == "publicada":
            query["status"] = "approved"
        elif status == "em_avaliacao":
            query["status"] = "pending"
        elif status == "reenviada":
            query["resubmitted_at"] = {"$exists": True}
            query["status"] = "pending"
        elif status == "rejeitada":
            query["status"] = "rejected"
    
    # Get photos from photos collection
    photos_list = await db.photos.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Also get from gallery if no status filter or if looking for published
    if not status or status == "publicada":
        gallery_list = await db.gallery.find({"approved": True}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Mark gallery photos as published
        for photo in gallery_list:
            photo["display_status"] = "publicada"
            photo["source"] = "gallery"
        
        # Merge (avoiding duplicates)
        existing_ids = {p["photo_id"] for p in photos_list}
        for photo in gallery_list:
            if photo.get("photo_id") not in existing_ids:
                photos_list.append(photo)
    
    # Add display_status for photos collection items
    for photo in photos_list:
        if "display_status" not in photo:
            if photo.get("status") == "approved":
                photo["display_status"] = "publicada"
            elif photo.get("status") == "pending":
                if photo.get("resubmitted_at"):
                    photo["display_status"] = "reenviada"
                else:
                    photo["display_status"] = "em_avaliacao"
            elif photo.get("status") == "rejected":
                photo["display_status"] = "rejeitada"
            else:
                photo["display_status"] = photo.get("status", "unknown")
            photo["source"] = "photos"
    
    # Sort by created_at
    photos_list.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
    
    return photos_list[:limit]
