from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import routes
from routes import auth, photos, evaluation, members, news, notifications, ranking, admin
from routes import pages, leaders, settings, timeline, stats, gallery, memories, upload

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="Spotters CXJ API")

os.makedirs("/app/backend/uploads", exist_ok=True)

api_router = APIRouter(prefix="/api")

# Include all routes
api_router.include_router(auth.router)
api_router.include_router(photos.router)
api_router.include_router(evaluation.router)
api_router.include_router(members.router)
api_router.include_router(news.router)
api_router.include_router(notifications.router)
api_router.include_router(ranking.router)
api_router.include_router(pages.router)
api_router.include_router(leaders.router)
api_router.include_router(settings.router)
api_router.include_router(timeline.router)
api_router.include_router(stats.router)
api_router.include_router(gallery.router)
api_router.include_router(memories.router)
api_router.include_router(upload.router)

@api_router.get("/")
async def root():
    return {"message": "Spotters CXJ API", "version": "2.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(api_router)

app.mount("/api/uploads", StaticFiles(directory="/app/backend/uploads"), name="uploads")

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
    client = AsyncIOMotorClient(mongo_url)
    app.state.db = client[os.environ.get('DB_NAME', 'spotters_cxj')]
    app.state.mongo_client = client
    logger.info("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db_client():
    if hasattr(app.state, 'mongo_client'):
        app.state.mongo_client.close()
        logger.info("Disconnected from MongoDB")
