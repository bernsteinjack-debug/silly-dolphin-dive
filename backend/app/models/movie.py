from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from bson import ObjectId

from .user import PyObjectId


class MovieBase(BaseModel):
    """Base movie model with common fields"""
    title: str
    release_year: Optional[int] = None
    genre: Optional[str] = None
    director: Optional[str] = None
    runtime: Optional[int] = None  # minutes
    rating: Optional[str] = None
    imdb_rating: Optional[float] = None
    studio: Optional[str] = None
    format: Optional[str] = None
    language: Optional[str] = None
    cast: Optional[List[str]] = None
    plot: Optional[str] = None
    awards: Optional[str] = None
    box_office: Optional[str] = None
    country: Optional[str] = None
    poster_url: Optional[str] = None
    personal_rating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 rating
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    spine_position: Optional[Dict[str, float]] = None  # {x: float, y: float}


class MovieCreate(MovieBase):
    """Movie creation model"""
    pass


class MovieUpdate(BaseModel):
    """Movie update model - all fields optional"""
    title: Optional[str] = None
    release_year: Optional[int] = None
    genre: Optional[str] = None
    director: Optional[str] = None
    runtime: Optional[int] = None
    rating: Optional[str] = None
    imdb_rating: Optional[float] = None
    studio: Optional[str] = None
    format: Optional[str] = None
    language: Optional[str] = None
    cast: Optional[List[str]] = None
    plot: Optional[str] = None
    awards: Optional[str] = None
    box_office: Optional[str] = None
    country: Optional[str] = None
    poster_url: Optional[str] = None
    personal_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    spine_position: Optional[Dict[str, float]] = None


class MovieInDB(MovieBase):
    """Movie model as stored in database"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    collection_id: PyObjectId
    added_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Movie(MovieBase):
    """Movie model for API responses"""
    id: PyObjectId = Field(alias="_id")
    collection_id: PyObjectId
    added_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class MovieSearchParams(BaseModel):
    """Search and filter parameters for movies"""
    q: Optional[str] = None  # General search query
    title: Optional[str] = None
    genre: Optional[str] = None
    director: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    rating: Optional[str] = None
    personal_rating: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None
    limit: Optional[int] = Field(50, ge=1, le=100)
    skip: Optional[int] = Field(0, ge=0)
    sort_by: Optional[str] = Field("added_at", pattern="^(title|release_year|added_at|personal_rating|imdb_rating)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete operations"""
    movie_ids: List[str]