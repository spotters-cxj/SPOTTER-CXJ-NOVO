from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import routes
from routes import auth, photos, evaluation, members, news, notifications, ranking, admin, logs
from routes import pages, leaders, settings, timeline, stats, gallery, memories, upload, backup, aircraft

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="Spotters CXJ API")

os.makedirs("/app/backend/uploads", exist_ok=True)

# Custom middleware for cache control
class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        path = request.url.path
        
        # No cache for HTML files and API responses
        if path.endswith('.html') or path == '/' or not '.' in path.split('/')[-1]:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        # Long cache for hashed static files (JS, CSS with hash in filename)
        elif any(ext in path for ext in ['.js', '.css']) and any(c.isdigit() for c in path):
            # Files with content hash can be cached for 1 year
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        
        # Short cache for images and other static files
        elif any(path.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico']):
            response.headers["Cache-Control"] = "public, max-age=86400"  # 1 day
        
        # No cache for API routes
        elif path.startswith('/api/'):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
        
        return response

# Add cache control middleware
app.add_middleware(CacheControlMiddleware)

api_router = APIRouter(prefix="/api")

# Include all routes
api_router.include_router(auth.router)
api_router.include_router(photos.router)
api_router.include_router(evaluation.router)
api_router.include_router(members.router)
api_router.include_router(news.router)
api_router.include_router(notifications.router)
api_router.include_router(ranking.router)
api_router.include_router(admin.router)
api_router.include_router(pages.router)
api_router.include_router(leaders.router)
api_router.include_router(settings.router)
api_router.include_router(timeline.router)
api_router.include_router(stats.router)
api_router.include_router(gallery.router)
api_router.include_router(memories.router)
api_router.include_router(upload.router)
api_router.include_router(logs.router)
api_router.include_router(backup.router)
api_router.include_router(aircraft.router)

@api_router.get("/")
async def root():
    return {"message": "Spotters CXJ API", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(api_router)

# Custom static files class with cache control
class CachedStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> Response:
        response = await super().get_response(path, scope)
        
        # Add appropriate cache headers based on file type
        if path.endswith(('.js', '.css')):
            # Check if file has content hash (contains numbers in filename)
            if any(c.isdigit() for c in path):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            else:
                response.headers["Cache-Control"] = "public, max-age=3600"  # 1 hour
        elif path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg')):
            response.headers["Cache-Control"] = "public, max-age=86400"  # 1 day
        else:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        
        return response

app.mount("/api/uploads", CachedStaticFiles(directory="/app/backend/uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    app.state.db = client[db_name]
    app.state.mongo_client = client
    logger.info("Connected to MongoDB")
    
    # Start backup scheduler
    try:
        from scheduler import start_backup_scheduler
        start_backup_scheduler()
        logger.info("Backup scheduler started (every 12 hours)")
    except Exception as e:
        logger.warning(f"Could not start backup scheduler: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    if hasattr(app.state, 'mongo_client'):
        app.state.mongo_client.close()
        logger.info("Disconnected from MongoDB")
