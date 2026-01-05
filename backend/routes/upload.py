from fastapi import APIRouter, HTTPException, Request, UploadFile, File
import os
import uuid

router = APIRouter(prefix="/upload", tags=["upload"])

async def require_approved_user(request: Request):
    from routes.auth import get_current_user
    user = await get_current_user(request)
    if not user.approved:
        raise HTTPException(status_code=403, detail="User not approved for uploads")
    return user

@router.post("")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Upload a file (approved users only)"""
    await require_approved_user(request)
    
    # Read file
    content = await file.read()
    
    # Validate file size (10MB max)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")
    
    # Get extension
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    allowed_ext = ["jpg", "jpeg", "png", "gif", "webp"]
    if file_ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_ext}")
    
    # Generate unique filename
    file_id = uuid.uuid4().hex[:16]
    filename = f"{file_id}.{file_ext}"
    
    # Save file
    upload_dir = "/app/backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{filename}"
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    return {"url": f"/api/uploads/{filename}"}
