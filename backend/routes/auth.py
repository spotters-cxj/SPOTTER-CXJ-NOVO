from fastapi import APIRouter, HTTPException, Request, Response
from datetime import datetime, timezone, timedelta
import httpx
import uuid
from models import SessionRequest, User, SessionResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

async def get_db(request: Request):
    return request.app.state.db

@router.post("/session")
async def create_session(request: Request, response: Response, session_req: SessionRequest):
    """Exchange session_id from Emergent Auth for user data and create session"""
    db = await get_db(request)
    
    # Get user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_req.session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            auth_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data["name"],
                "picture": auth_data.get("picture")
            }}
        )
        role = existing_user.get("role", "contributor")
        approved = existing_user.get("approved", False)
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        
        # First user becomes admin_principal
        user_count = await db.users.count_documents({})
        if user_count == 0:
            role = "admin_principal"
            approved = True
        else:
            role = "contributor"
            approved = False
        
        new_user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "role": role,
            "approved": approved,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    session_data = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_data)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Get user to return
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return SessionResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        role=user.get("role", "contributor"),
        approved=user.get("approved", False)
    )

@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    db = await get_db(request)
    
    # Get session token from cookie or header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Session not found")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return SessionResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        role=user.get("role", "contributor"),
        approved=user.get("approved", False)
    )

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    db = await get_db(request)
    
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}
