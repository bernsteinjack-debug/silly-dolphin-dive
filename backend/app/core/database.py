from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from .config import settings


class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None


db = Database()


async def connect_to_mongo():
    """Create database connection"""
    if not settings.mongodb_uri:
        print("WARNING: MONGODB_URI not set. Database features will be unavailable.")
        return
    
    db.client = AsyncIOMotorClient(settings.mongodb_uri)
    db.database = db.client.snap_your_shelf
    
    # Test the connection
    try:
        await db.client.admin.command('ping')
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        print("Database features will be unavailable.")


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")


async def ping_database() -> bool:
    """Ping database to check connectivity"""
    try:
        if not db.client:
            return False
        await db.client.admin.command('ping')
        return True
    except Exception:
        return False