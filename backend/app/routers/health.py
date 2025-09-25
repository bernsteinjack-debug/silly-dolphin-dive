from fastapi import APIRouter, Depends
from datetime import datetime
from ..core.database import ping_database
from ..core.auth import get_current_user
from ..models.user import User

router = APIRouter()


@router.get("/healthz")
async def health_check():
    """Health check endpoint with database connectivity verification"""
    db_status = await ping_database()
    
    return {
        "status": "healthy" if db_status else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db_status else "disconnected",
        "service": "Snap Your Shelf API"
    }


@router.get("/healthz/protected")
async def protected_health_check(current_user: User = Depends(get_current_user)):
    """Protected health check endpoint - requires authentication"""
    db_status = await ping_database()
    
    return {
        "status": "healthy" if db_status else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db_status else "disconnected",
        "service": "Snap Your Shelf API",
        "authenticated_user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "name": current_user.name
        }
    }