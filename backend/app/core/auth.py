from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from .security import decode_access_token
from .database import db
from ..models.user import User, UserInDB

# HTTP Bearer token scheme
security = HTTPBearer()

# Token blacklist (in production, use Redis or database)
token_blacklist = set()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    
    # Check if token is blacklisted
    if token in token_blacklist:
        raise credentials_exception
    
    # Decode token
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        user_doc = await db.database.users.find_one({"_id": ObjectId(user_id)})
        if user_doc is None:
            raise credentials_exception
        
        # Convert to User model (excluding password_hash)
        user = User(
            _id=user_doc["_id"],
            email=user_doc["email"],
            name=user_doc["name"],
            is_active=user_doc["is_active"],
            settings=user_doc.get("settings", {}),
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"]
        )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise credentials_exception


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user (additional check)"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def blacklist_token(token: str) -> None:
    """Add token to blacklist"""
    token_blacklist.add(token)


def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted"""
    return token in token_blacklist