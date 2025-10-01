from fastapi import APIRouter

# Import routers
from .auth import router as auth_router
from .collections import router as collections_router
from .movies import router as movies_router
from .photos import router as photos_router
from .ai_vision import router as ai_vision_router
from .sharing import router as sharing_router
from .movie_matching import router as movie_matching_router
# from .users import router as users_router

router = APIRouter()

# Include routers as they're implemented
router.include_router(auth_router, prefix="/auth", tags=["authentication"])
router.include_router(collections_router, prefix="/collections", tags=["collections"])
router.include_router(movies_router, prefix="/movies", tags=["movies"])
router.include_router(photos_router, prefix="/photos", tags=["photos"])
router.include_router(ai_vision_router, prefix="/ai-vision", tags=["ai-vision"])
router.include_router(sharing_router, prefix="/sharing", tags=["sharing"])
router.include_router(movie_matching_router, prefix="/movie-matching", tags=["movie-matching"])
# router.include_router(users_router, prefix="/users", tags=["users"])

# Placeholder endpoint for Sprint 0
@router.get("/")
async def api_root():
    """API v1 root endpoint"""
    return {
        "message": "Snap Your Shelf API v1",
        "version": "1.0.0",
        "status": "active"
    }