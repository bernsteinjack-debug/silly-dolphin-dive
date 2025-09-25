from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId

from .user import PyObjectId


class CollectionBase(BaseModel):
    """Base collection model with common fields"""
    name: str
    shelf_image_url: Optional[str] = None


class CollectionCreate(CollectionBase):
    """Collection creation model"""
    pass


class CollectionUpdate(BaseModel):
    """Collection update model"""
    name: Optional[str] = None
    shelf_image_url: Optional[str] = None


class CollectionInDB(CollectionBase):
    """Collection model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Collection(CollectionBase):
    """Collection model for API responses"""
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}