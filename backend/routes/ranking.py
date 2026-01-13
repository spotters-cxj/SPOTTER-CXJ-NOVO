from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from models import HIERARCHY_LEVELS, get_highest_role_level

router = APIRouter(prefix="/ranking", tags=["ranking"])

async def get_db(request: Request):
    return request.app.state.db

@router.get("")
async def get_ranking(request: Request, limit: int = 20):
    """Get photo ranking by average rating"""
    db = await get_db(request)
    
    # Get approved photos with ratings
    photos = await db.photos.find(
        {"status": "approved", "public_rating": {"$gt": 0}},
        {"_id": 0}
    ).sort("public_rating", -1).limit(limit).to_list(limit)
    
    # Add position
    for i, photo in enumerate(photos):
        photo["position"] = i + 1
    
    return photos

@router.get("/top3")
async def get_top3(request: Request):
    """Get TOP 3 photos for podium"""
    db = await get_db(request)
    
    photos = await db.photos.find(
        {"status": "approved", "public_rating": {"$gt": 0}},
        {"_id": 0}
    ).sort("public_rating", -1).limit(3).to_list(3)
    
    # Get author info for each
    for photo in photos:
        author = await db.users.find_one(
            {"user_id": photo["author_id"]},
            {"_id": 0, "name": 1, "picture": 1, "tags": 1}
        )
        if author:
            photo["author"] = author
    
    return photos

@router.get("/users")
async def get_user_ranking(request: Request, limit: int = 20):
    """Get user ranking by total approved photos and average rating"""
    db = await get_db(request)
    
    # Aggregate user stats using final_rating (avaliadores) not public_rating
    pipeline = [
        {"$match": {"status": "approved"}},
        {
            "$group": {
                "_id": "$author_id",
                "author_name": {"$first": "$author_name"},
                "total_photos": {"$sum": 1},
                "total_rating": {"$sum": "$final_rating"},
                "rated_photos": {
                    "$sum": {"$cond": [{"$gt": ["$final_rating", 0]}, 1, 0]}
                }
            }
        },
        {
            "$project": {
                "user_id": "$_id",
                "author_name": 1,
                "total_photos": 1,
                "average_rating": {
                    "$cond": [
                        {"$gt": ["$rated_photos", 0]},
                        {"$divide": ["$total_rating", "$rated_photos"]},
                        0
                    ]
                }
            }
        },
        {"$sort": {"average_rating": -1, "total_photos": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "user_id",
                "as": "user_data"
            }
        },
        {
            "$addFields": {
                "picture": {"$arrayElemAt": ["$user_data.picture", 0]},
                "tags": {"$arrayElemAt": ["$user_data.tags", 0]}
            }
        },
        {"$project": {"user_data": 0}}
    ]
    
    rankings = await db.photos.aggregate(pipeline).to_list(limit)
    
    # Add position and round average rating
    for i, entry in enumerate(rankings):
        entry["position"] = i + 1
        entry["average_rating"] = round(entry.get("average_rating", 0), 2)
    
    return rankings

@router.get("/podium")
async def get_podium_users(request: Request):
    """Get TOP 3 users for podium"""
    rankings = await get_user_ranking(request, limit=3)
    
    return {
        "winners": [
            {
                "name": r.get("author_name", "Usuário"),
                "photo": r.get("picture"),
                "rating": r.get("average_rating", 0),
                "total_photos": r.get("total_photos", 0),
                "tags": r.get("tags", [])
            }
            for r in rankings
        ]
    }
