from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/stats", tags=["stats"])

async def get_db(request: Request):
    return request.app.state.db

async def require_admin(request: Request):
    from routes.auth import get_current_user
    user = await get_current_user(request)
    if user.role not in ["admin_principal", "admin_authorized"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Stats Model
class SiteStats(BaseModel):
    members: str = "50+"
    photos: str = "5.000+"
    events: str = "30+"
    years: str = "8+"

class SiteStatsUpdate(BaseModel):
    members: Optional[str] = None
    photos: Optional[str] = None
    events: Optional[str] = None
    years: Optional[str] = None

# Default stats
DEFAULT_STATS = {
    "members": "50+",
    "photos": "5.000+",
    "events": "30+",
    "years": "8+"
}

@router.get("")
async def get_stats(request: Request):
    """Get site statistics (public)"""
    db = await get_db(request)
    
    stats = await db.site_stats.find_one({"type": "main"}, {"_id": 0})
    if not stats:
        return DEFAULT_STATS
    
    stats.pop("type", None)
    return stats

@router.put("")
async def update_stats(request: Request, update: SiteStatsUpdate):
    """Update site statistics (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    # Get existing or default
    existing = await db.site_stats.find_one({"type": "main"}, {"_id": 0})
    if not existing:
        existing = DEFAULT_STATS.copy()
    
    # Update fields
    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            existing[key] = value
    
    existing["type"] = "main"
    existing["updated_at"] = datetime.now(timezone.utc)
    
    await db.site_stats.update_one(
        {"type": "main"},
        {"$set": existing},
        upsert=True
    )
    
    existing.pop("type", None)
    return existing
