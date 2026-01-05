from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from typing import Optional, List
from datetime import datetime, timezone
from models import Photo, PhotoCreate
import uuid
import os
import base64

router = APIRouter(prefix="/gallery", tags=["gallery"])

# Aircraft types for filtering
AIRCRAFT_TYPES = ["Airbus", "Boeing", "Embraer", "ATR", "Aviação Geral"]

async def get_db(request: Request):
    return request.app.state.db

async def require_approved_user(request: Request):
    from routes.auth import get_current_user
    user = await get_current_user(request)
    if not user.approved:
        raise HTTPException(status_code=403, detail="User not approved to upload photos")
    return user

async def require_admin(request: Request):
    from routes.auth import get_current_user
    user = await get_current_user(request)
    if user.role not in ["admin_principal", "admin_authorized"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("")
async def list_photos(request: Request, aircraft_type: Optional[str] = None, 
                      registration: Optional[str] = None, author: Optional[str] = None):
    """List photos with optional filters (public)"""
    db = await get_db(request)
    
    query = {"approved": True}
    if aircraft_type:
        query["aircraft_type"] = aircraft_type
    if registration:
        query["registration"] = {"$regex": registration, "$options": "i"}
    if author:
        query["author_name"] = {"$regex": author, "$options": "i"}
    
    photos = await db.gallery.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return photos

@router.get("/types")
async def get_aircraft_types():
    """Get available aircraft types for filtering"""
    return AIRCRAFT_TYPES

@router.get("/{photo_id}")
async def get_photo(request: Request, photo_id: str):
    """Get single photo details (public)"""
    db = await get_db(request)
    
    photo = await db.gallery.find_one({"photo_id": photo_id}, {"_id": 0})
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
            "author_id": user.user_id,
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
        "author_id": user.user_id,
        "author_name": user.name,
        "approved": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.gallery.insert_one(photo_data)
    
    return {"photo_id": photo_id, "url": photo_data["url"], "message": "Photo uploaded successfully"}

@router.delete("/{photo_id}")
async def delete_photo(request: Request, photo_id: str):
    """Delete photo (admin or photo author)"""
    from routes.auth import get_current_user
    user = await get_current_user(request)
    db = await get_db(request)
    
    photo = await db.gallery.find_one({"photo_id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Check permission: admin or author
    is_admin = user.role in ["admin_principal", "admin_authorized"]
    is_author = photo.get("author_id") == user.user_id
    
    if not is_admin and not is_author:
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    # Delete file
    try:
        file_path = f"/app/backend{photo['url'].replace('/api', '')}"
        if os.path.exists(file_path):
            os.remove(file_path)
    except:
        pass  # File might not exist
    
    await db.gallery.delete_one({"photo_id": photo_id})
    return {"message": "Photo deleted"}

@router.get("/by-registration/{registration}")
async def get_photos_by_registration(request: Request, registration: str):
    """Get all photos for a specific registration/prefix"""
    db = await get_db(request)
    
    photos = await db.gallery.find(
        {"registration": registration, "approved": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return photos
