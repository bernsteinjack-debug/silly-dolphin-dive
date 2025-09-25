from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

from .user import PyObjectId


class ProcessingStatus(str, Enum):
    """Photo processing status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PhotoBase(BaseModel):
    """Base photo model with common fields"""
    filename: str
    url: str
    processing_status: ProcessingStatus = ProcessingStatus.PENDING
    detected_titles: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class PhotoCreate(BaseModel):
    """Photo creation model (for internal use after file upload)"""
    filename: str
    url: str
    collection_id: Optional[PyObjectId] = None
    processing_status: ProcessingStatus = ProcessingStatus.PENDING
    detected_titles: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class PhotoUpdate(BaseModel):
    """Photo update model"""
    processing_status: Optional[ProcessingStatus] = None
    detected_titles: Optional[List[Dict[str, Any]]] = None
    collection_id: Optional[PyObjectId] = None


class PhotoInDB(PhotoBase):
    """Photo model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    collection_id: Optional[PyObjectId] = None
    uploaded_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Photo(PhotoBase):
    """Photo model for API responses"""
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    collection_id: Optional[PyObjectId] = None
    uploaded_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PhotoUploadResponse(BaseModel):
    """Response model for photo upload"""
    id: str
    filename: str
    url: str
    processing_status: ProcessingStatus
    uploaded_at: datetime
    message: str = "Photo uploaded successfully"