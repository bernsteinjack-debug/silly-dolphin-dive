from fastapi import APIRouter, Depends
from datetime import datetime
from ..core.database import ping_database

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


@router.get("/healthz/db")
async def db_health_check():
    """Database health check endpoint"""
    db_status = await ping_database()
    
    return {
        "status": "healthy" if db_status else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if db_status else "disconnected"
    }