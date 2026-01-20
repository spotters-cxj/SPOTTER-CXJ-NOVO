"""
Spotters CXJ Backend API
FastAPI server with MongoDB database
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routes
from routes import (
    auth, admin, gallery, leaders, memories, settings, pages,
    photos, evaluation, ranking, news, notifications, members,
    logs, stats, events, aircraft, timeline, backup, upload
)

# Import scheduler
from scheduler import start_backup_scheduler

# MongoDB URL from environment
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "spotters_cxj")

# CORS Origins - PRODUÇÃO E DESENVOLVIMENTO
CORS_ORIGINS = [
    "https://spotterscxj.com.br",
    "https://www.spotterscxj.com.br",
    "http://spotterscxj.com.br",
    "http://www.spotterscxj.com.br",
    # Domínios de preview/deploy do Emergent
    "https://deploy-app-22.emergent.host",
    "https://deploy-app-22.preview.emergentagent.com",
    "https://spotterstrouble.preview.emergentagent.com",
    # Desenvolvimento local
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI app"""
    # Startup
    logger.info("Starting Spotters CXJ API...")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URL)
        app.state.db = client[DB_NAME]
        app.state.mongo_client = client
        
        # Test connection
        await client.admin.command("ping")
        logger.info(f"Connected to MongoDB: {DB_NAME}")
        
        # Start scheduler
        start_backup_scheduler(app.state.db)
        logger.info("Background scheduler started")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if hasattr(app.state, 'mongo_client'):
        app.state.mongo_client.close()
        logger.info("MongoDB connection closed")

# Create FastAPI app
app = FastAPI(
    title="Spotters CXJ API",
    description="API para o site Spotters CXJ - Comunidade de Spotters de Aviação",
    version="2.0.0",
    lifespan=lifespan
)

# ========== CORS MIDDLEWARE ==========
# IMPORTANTE: Configuração robusta para produção
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight por 1 hora
)

# ========== CUSTOM CORS HANDLER FOR PREFLIGHT ==========
@app.middleware("http")
async def cors_handler(request: Request, call_next):
    """Handle CORS headers for all requests including preflight"""
    origin = request.headers.get("origin", "")
    
    # Handle preflight OPTIONS requests
    if request.method == "OPTIONS":
        response = JSONResponse(content={}, status_code=200)
    else:
        response = await call_next(request)
    
    # Add CORS headers to all responses
    if origin:
        # Check if origin is allowed
        is_allowed = any(
            allowed_origin in origin or origin in allowed_origin
            for allowed_origin in CORS_ORIGINS
        ) or origin.endswith(".emergent.host") or origin.endswith(".emergentagent.com")
        
        if is_allowed or origin in CORS_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, X-Session-ID, Accept, Origin"
            response.headers["Access-Control-Expose-Headers"] = "*"
    
    # Add cache headers for API responses (no cache by default)
    if "/api/" in str(request.url):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    
    return response

# ========== MOUNT STATIC FILES ==========
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ========== INCLUDE ALL ROUTERS ==========
# All routers have prefix="/api" already via their individual prefixes
# We include them at the /api base path

app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(gallery.router, prefix="/api")
app.include_router(leaders.router, prefix="/api")
app.include_router(memories.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(pages.router, prefix="/api")
app.include_router(photos.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(ranking.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(aircraft.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
app.include_router(upload.router, prefix="/api")

# ========== SERVE UPLOADED FILES ==========
@app.get("/api/uploads/{filename:path}")
async def serve_upload(filename: str):
    """Serve uploaded files"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse({"detail": "File not found"}, status_code=404)

# ========== ROOT API ENDPOINTS ==========
@app.get("/api")
@app.get("/api/")
async def api_root():
    """API root - returns API information"""
    return {
        "message": "Spotters CXJ API",
        "version": "2.0.0",
        "status": "online",
        "endpoints": {
            "auth": "/api/auth",
            "gallery": "/api/gallery",
            "ranking": "/api/ranking",
            "events": "/api/events",
            "news": "/api/news",
            "members": "/api/members",
            "settings": "/api/settings",
            "stats": "/api/stats",
            "notifications": "/api/notifications",
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "spotters-cxj-api",
        "version": "2.0.0"
    }

# ========== ERROR HANDLERS ==========
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors"""
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint não encontrado"}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 errors"""
    logger.error(f"Internal error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
