from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from ..core.database import db
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.auth import security, blacklist_token
from ..models.user import User, UserCreate, UserLogin, Token, UserInDB

router = APIRouter()


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate) -> dict:
    """Register a new user"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Check if user already exists
    existing_user = await db.database.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = get_password_hash(user_data.password)
    
    # Create user document
    now = datetime.utcnow()
    user_doc = {
        "email": user_data.email,
        "password_hash": password_hash,
        "name": user_data.name,
        "created_at": now,
        "updated_at": now,
        "is_active": user_data.is_active,
        "settings": user_data.settings
    }
    
    try:
        # Insert user into database
        result = await db.database.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id, "email": user_data.email})
        
        return {
            "message": "User created successfully",
            "user": {
                "id": user_id,
                "email": user_data.email,
                "name": user_data.name,
                "is_active": user_data.is_active,
                "settings": user_data.settings,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.post("/login", response_model=dict)
async def login(user_credentials: UserLogin) -> dict:
    """Authenticate user and return access token"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Find user by email
    user_doc = await db.database.users.find_one({"email": user_credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    user_id = str(user_doc["_id"])
    access_token = create_access_token(data={"sub": user_id, "email": user_doc["email"]})
    
    return {
        "message": "Login successful",
        "user": {
            "id": user_id,
            "email": user_doc["email"],
            "name": user_doc["name"],
            "is_active": user_doc["is_active"],
            "settings": user_doc.get("settings", {}),
            "created_at": user_doc["created_at"].isoformat(),
            "updated_at": user_doc["updated_at"].isoformat()
        },
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Logout user by blacklisting token"""
    token = credentials.credentials
    blacklist_token(token)
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=dict)
async def get_current_user_info() -> dict:
    """Get current user information"""
    return {
        "message": "Authentication is disabled."
    }