from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, handler=None):
        return {"type": "string"}


class UserBase(BaseModel):
    """Base user model with common fields"""
    email: EmailStr
    name: str
    is_active: bool = True
    settings: Dict[str, Any] = Field(default_factory=dict)


class UserCreate(UserBase):
    """User creation model"""
    password: str


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None


class UserInDB(UserBase):
    """User model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class User(UserBase):
    """User model for API responses (without password hash)"""
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token response model"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[str] = None
    email: Optional[str] = None