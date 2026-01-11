from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from datetime import datetime, timezone
from models import PageContent, PageContentUpdate

router = APIRouter(prefix="/pages", tags=["pages"])

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

async def require_admin_principal(request: Request):
    from routes.auth import get_current_user
    from models import HIERARCHY_LEVELS, get_highest_role_level
    user = await get_current_user(request)
    user_level = get_highest_role_level(user.get("tags", []))
    if user_level < HIERARCHY_LEVELS["lider"]:
        raise HTTPException(status_code=403, detail="Lider access required")
    return user

# Default page content
DEFAULT_PAGES = {
    "home": {
        "slug": "home",
        "title": "Bem-vindo ao Spotters CXJ",
        "subtitle": "A comunidade de entusiastas da aviação em Caxias do Sul",
        "content": "O Spotters CXJ é um grupo apaixonado por aviação que se dedica a registrar e documentar as operações aéreas no Aeroporto Hugo Cantergiani (CXJ) em Caxias do Sul, Rio Grande do Sul.\n\nNossa missão é preservar a memória da aviação regional, compartilhar conhecimento sobre aeronaves e promover o hobby do aircraft spotting na Serra Gaúcha.",
        "sections": []
    },
    "airport-history": {
        "slug": "airport-history",
        "title": "História do Aeroporto CXJ",
        "subtitle": "Aeroporto Hugo Cantergiani - O portal aéreo da Serra Gaúcha",
        "content": "O Aeroporto Hugo Cantergiani, conhecido pelo código IATA CXJ, é o principal aeroporto de Caxias do Sul e da região da Serra Gaúcha.",
        "sections": []
    },
    "spotters-history": {
        "slug": "spotters-history",
        "title": "História dos Spotters CXJ",
        "subtitle": "Nossa jornada no mundo da aviação",
        "content": "O grupo Spotters CXJ nasceu da paixão compartilhada por um pequeno grupo de amigos que frequentavam o Aeroporto Hugo Cantergiani para fotografar aeronaves.",
        "sections": []
    }
}

@router.get("/{slug}")
async def get_page(request: Request, slug: str):
    """Get page content by slug (public)"""
    db = await get_db(request)
    
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        # Return default if exists
        if slug in DEFAULT_PAGES:
            return DEFAULT_PAGES[slug]
        raise HTTPException(status_code=404, detail="Page not found")
    
    return page

@router.put("/{slug}")
async def update_page(request: Request, slug: str, update: PageContentUpdate):
    """Update page content (admin only, airport-history requires admin_principal)"""
    db = await get_db(request)
    
    # airport-history requires admin_principal
    if slug == "airport-history":
        admin = await require_admin_principal(request)
    else:
        admin = await require_admin(request)
    
    # Get existing or default
    existing = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not existing:
        if slug in DEFAULT_PAGES:
            existing = DEFAULT_PAGES[slug].copy()
        else:
            existing = {"slug": slug}
    
    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = admin["user_id"]
    
    for key, value in update_data.items():
        existing[key] = value
    
    await db.pages.update_one(
        {"slug": slug},
        {"$set": existing},
        upsert=True
    )
    
    return existing

@router.get("")
async def list_pages(request: Request):
    """List all pages (public)"""
    db = await get_db(request)
    
    pages = await db.pages.find({}, {"_id": 0}).to_list(100)
    
    # Merge with defaults
    existing_slugs = {p["slug"] for p in pages}
    for slug, default in DEFAULT_PAGES.items():
        if slug not in existing_slugs:
            pages.append(default)
    
    return pages
