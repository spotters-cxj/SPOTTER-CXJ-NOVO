from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import SiteSettings, SiteSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])

async def get_db(request: Request):
    return request.app.state.db

async def require_admin(request: Request):
    from routes.auth import get_current_user
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["gestao"]:
        raise HTTPException(status_code=403, detail="Gestao access required")
    return user

# Default settings
DEFAULT_SETTINGS = {
    "site_version": "1.0.0",
    "google_form_link": "",
    "instagram_url": "https://instagram.com/spotterscxj",
    "instagram_handle": "@spotterscxj",
    "youtube_url": "https://youtube.com/@spotterscxj",
    "youtube_name": "Spotters CXJ",
    "footer": {
        "about_text": "Comunidade de entusiastas da aviação dedicada a registrar e documentar as operações aéreas no Aeroporto CXJ em Caxias do Sul.",
        "links": []
    },
    # Payment settings
    "pix_key": "",
    "pix_name": "",
    "vip_monthly_price": "R$ 15,00",
    "vip_permanent_price": "R$ 100,00",
    "extra_photo_price": "R$ 3,50"
}

@router.get("")
async def get_settings(request: Request):
    """Get site settings (public)"""
    db = await get_db(request)
    
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    if not settings:
        return DEFAULT_SETTINGS
    
    # Remove internal type field
    settings.pop("type", None)
    return settings

@router.put("")
async def update_settings(request: Request, update: SiteSettingsUpdate):
    """Update site settings (admin only)"""
    await require_admin(request)
    db = await get_db(request)
    
    # Get existing
    existing = await db.settings.find_one({"type": "site"}, {"_id": 0})
    if not existing:
        existing = DEFAULT_SETTINGS.copy()
    
    # Update fields
    update_data = update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["type"] = "site"
    
    for key, value in update_data.items():
        if value is not None:
            existing[key] = value
    
    existing["type"] = "site"
    
    await db.settings.update_one(
        {"type": "site"},
        {"$set": existing},
        upsert=True
    )
    
    existing.pop("type", None)
    return existing
