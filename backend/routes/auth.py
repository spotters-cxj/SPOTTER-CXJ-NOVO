from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
import httpx
import uuid
from models import User, Notification, NotificationType
import logging

logger = logging.getLogger(__name__)

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

def normalize_url(url: str) -> str:
    """Normalize URL - remove www, ensure consistency"""
    if url:
        url = url.replace('www.', '')
    return url

@router.post("/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for user data and create session"""
    db = await get_db(request)
    
    try:
        body = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse request body: {e}")
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    logger.info(f"Processing session: {session_id[:8]}...")
    
    # Exchange session_id with Emergent Auth
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code == 403:
                logger.error("Domain not authorized for authentication")
                raise HTTPException(
                    status_code=403, 
                    detail="Domínio não autorizado para autenticação. Verifique as configurações do Emergent Auth."
                )
            
            if auth_response.status_code != 200:
                logger.error(f"Auth service returned {auth_response.status_code}: {auth_response.text}")
                raise HTTPException(
                    status_code=401, 
                    detail=f"Sessão inválida ou expirada. Código: {auth_response.status_code}"
                )
            
            auth_data = auth_response.json()
            logger.info(f"Auth data received for: {auth_data.get('email')}")
            
        except httpx.TimeoutException:
            logger.error("Auth service timeout")
            raise HTTPException(
                status_code=504, 
                detail="Tempo limite excedido ao conectar com o serviço de autenticação"
            )
        except httpx.RequestError as e:
            logger.error(f"Auth service connection error: {e}")
            raise HTTPException(
                status_code=503, 
                detail="Não foi possível conectar ao serviço de autenticação"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected auth error: {e}")
            raise HTTPException(status_code=401, detail=f"Erro de autenticação: {str(e)}")
    
    # Check if user exists
    email = auth_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email não fornecido pelo serviço de autenticação")
    
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data.get("name", existing_user.get("name")),
                "picture": auth_data.get("picture"),
                "last_login": datetime.now(timezone.utc)
            }}
        )
        tags = existing_user.get("tags", ["visitante"])
        approved = existing_user.get("approved", False)
        logger.info(f"Existing user logged in: {user_id}")
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_count = await db.users.count_documents({})
        
        # First user gets admin privileges
        if user_count == 0:
            tags = ["lider", "admin"]
            approved = True
            logger.info(f"First user created as admin: {user_id}")
        else:
            # Novos usuários começam como visitantes
            tags = ["visitante"]
            approved = False
            logger.info(f"New user created as visitante: {user_id}")
        
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": auth_data.get("name", email.split("@")[0]),
            "picture": auth_data.get("picture"),
            "tags": tags,
            "approved": approved,
            "is_vip": False,
            "photos_this_week": 0,
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        
        # Welcome notification
        await create_notification(
            db, user_id, "tag_assigned",
            f"🎉 Bem-vindo ao Spotters CXJ! Você é um VISITANTE. Aguarde aprovação de um administrador para obter uma tag e poder interagir no site."
        )
    
    # Create session token
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
        "user_agent": request.headers.get("user-agent", "unknown")
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token", 
        value=session_token, 
        httponly=True,
        secure=True, 
        samesite="none", 
        max_age=7*24*60*60, 
        path="/"
    )
    
    # Also expose token in header for frontend to store
    response.headers["X-Session-Token"] = session_token
    
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
    
    try:
        body = await request.json()
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    email = body.get("email")
    password = body.get("password")
    name = body.get("name")
    
    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Email, senha e nome são obrigatórios")
    
    # Validate email format
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Email inválido")
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_count = await db.users.count_documents({})
    
    if user_count == 0:
        tags = ["lider", "admin"]
        approved = True
    else:
        # Novos usuários começam como visitantes
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
        f"🎉 Bem-vindo ao Spotters CXJ! Você é um VISITANTE. Aguarde aprovação de um administrador para obter uma tag e poder interagir no site."
    )
    
    logger.info(f"New user registered as visitante: {user_id}")
    return {"message": "Usuário cadastrado com sucesso", "user_id": user_id}

@router.post("/login")
async def login_email(request: Request, response: Response):
    """Login with email/password"""
    db = await get_db(request)
    
    try:
        body = await request.json()
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email e senha são obrigatórios")
    
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
    
    response.headers["X-Session-Token"] = session_token
    
    logger.info(f"User logged in: {user['user_id']}")
    
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
async def get_current_user(request: Request, response: Response):
    """Get current authenticated user"""
    db = await get_db(request)
    
    # Try to get token from cookie first, then from Authorization header
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sessão não encontrada")
    
    # Check session expiration
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        # Clean up expired session
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Sessão expirada")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    # Get unread notifications count
    unread_count = await db.notifications.count_documents({
        "user_id": user["user_id"],
        "read": False
    })
    
    # Expose token in response header for frontend to store
    response.headers["X-Session-Token"] = session_token
    
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
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
        logger.info(f"Session logged out: {session_token[:20]}...")
    
    response.delete_cookie(key="session_token", path="/")
    response.delete_cookie(key="session_token", path="/", domain=None)
    
    return {"message": "Logout realizado com sucesso"}

# Helper function to get current user for other routes
async def get_current_user_from_request(request: Request):
    """Get current authenticated user - for use in other routes"""
    db = request.app.state.db
    
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sessão não encontrada")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessão expirada")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return user
