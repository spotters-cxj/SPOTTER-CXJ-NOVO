from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
import httpx
import uuid
from models import User, Notification, NotificationType

router = APIRouter(prefix="/auth", tags=["auth"])

async def get_db(request: Request):
    return request.app.state.db

async def create_notification(db, user_id: str, notif_type: str, message: str, data: dict = None):
    """Helper to create notifications"""
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
    return notification

@router.post("/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for user data and create session"""
    db = await get_db(request)
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            auth_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
    
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": auth_data["name"], "picture": auth_data.get("picture")}}
        )
        tags = existing_user.get("tags", ["visitante"])
        approved = existing_user.get("approved", False)
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_count = await db.users.count_documents({})
        
        # Primeiro usuário é líder e admin
        if user_count == 0:
            tags = ["lider", "admin"]
            approved = True
        else:
            # Novos usuários começam como VISITANTE
            tags = ["visitante"]
            approved = False
        
        new_user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "tags": tags,
            "approved": approved,
            "is_vip": False,
            "photos_this_week": 0,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        
        # Welcome notification
        await create_notification(
            db, user_id, "tag_assigned",
            f"👋 Bem-vindo ao Spotters CXJ! Você está como VISITANTE. Aguarde aprovação de um administrador para se tornar Spotter CXJ."
        )
    
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", max_age=7*24*60*60, path="/"
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "tags": user.get("tags", ["visitante"]),
        "approved": user.get("approved", False),
        "is_vip": user.get("is_vip", False)
    }

@router.post("/register")
async def register_email(request: Request):
    """Register with email/password"""
    db = await get_db(request)
    body = await request.json()
    
    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    
    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="email, password and name required")
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_count = await db.users.count_documents({})
    
    # Primeiro usuário é líder e admin
    if user_count == 0:
        tags = ["lider", "admin"]
        approved = True
    else:
        # Novos usuários começam como VISITANTE
        tags = ["visitante"]
        approved = False
    
    new_user = {
        "user_id": user_id,
        "email": email,
        "password_hash": password_hash,
        "name": name,
        "tags": tags,
        "approved": approved,
        "is_vip": False,
        "photos_this_week": 0,
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(new_user)
    
    await create_notification(
        db, user_id, "tag_assigned",
        f"👋 Bem-vindo ao Spotters CXJ! Você está como VISITANTE. Aguarde aprovação de um administrador para se tornar Spotter CXJ."
    )
    
    return {"message": "Usuário cadastrado com sucesso", "user_id": user_id}

@router.post("/login")
async def login_email(request: Request, response: Response):
    """Login with email/password"""
    db = await get_db(request)
    body = await request.json()
    
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")
    
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    user = await db.users.find_one({"email": email, "password_hash": password_hash}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", max_age=7*24*60*60, path="/"
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "tags": user.get("tags", ["visitante"]),
        "approved": user.get("approved", False),
        "is_vip": user.get("is_vip", False)
    }

@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    db = await get_db(request)
    
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Session not found")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Get unread notifications count
    unread_count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "read": False
    })
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "tags": user.get("tags", ["visitante"]),
        "approved": user.get("approved", False),
        "is_vip": user.get("is_vip", False),
        "instagram": user.get("instagram"),
        "jetphotos": user.get("jetphotos"),
        "bio": user.get("bio"),
        "photos_this_week": user.get("photos_this_week", 0),
        "subscription_type": user.get("subscription_type"),
        "unread_notifications": unread_count
    }

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    db = await get_db(request)
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@router.put("/me/profile")
async def update_profile(request: Request):
    """Update user profile (instagram, jetphotos, bio)"""
    user = await get_current_user(request)
    db = await get_db(request)
    body = await request.json()
    
    # Campos permitidos para atualização
    allowed_fields = ["instagram", "jetphotos", "bio", "name"]
    update_data = {}
    
    for field in allowed_fields:
        if field in body:
            update_data[field] = body[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    # Atualizar no banco
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    # Retornar usuário atualizado
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    return {
        "message": "Perfil atualizado com sucesso",
        "user": {
            "user_id": updated_user["user_id"],
            "email": updated_user["email"],
            "name": updated_user["name"],
            "picture": updated_user.get("picture"),
            "instagram": updated_user.get("instagram"),
            "jetphotos": updated_user.get("jetphotos"),
            "bio": updated_user.get("bio"),
            "tags": updated_user.get("tags", ["membro"])
        }
    }

@router.post("/me/profile-picture")
async def upload_profile_picture(request: Request):
    """Upload profile picture"""
    from fastapi import UploadFile, File
    from fastapi.params import Form
    
    user = await get_current_user(request)
    db = await get_db(request)
    
    # Parse multipart form data
    form = await request.form()
    file = form.get("file")
    
    if not file or not hasattr(file, 'read'):
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
    
    # Validar tipo de arquivo
    content_type = getattr(file, 'content_type', '')
    if not content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
    
    # Ler conteúdo
    content = await file.read()
    
    # Validar tamanho (5MB max para foto de perfil)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 5MB")
    
    # Salvar arquivo
    file_ext = file.filename.split(".")[-1] if hasattr(file, 'filename') and "." in file.filename else "jpg"
    filename = f"{user['user_id']}_profile.{file_ext}"
    
    upload_dir = "/app/backend/uploads/profiles"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{filename}"
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Atualizar URL da foto no banco
    picture_url = f"/api/uploads/profiles/{filename}"
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"picture": picture_url}}
    )
    
    return {
        "message": "Foto de perfil atualizada com sucesso",
        "picture_url": picture_url
    }
