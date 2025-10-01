from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId


class MovieMetadata(BaseModel):
    """Model for canonical movie metadata from external APIs"""
    id: Optional[str] = Field(None, alias="_id")
    tmdb_id: Optional[str] = None
    imdb_id: Optional[str] = None
    title: str
    normalized_title: str
    release_year: Optional[int] = None
    genres: List[str] = []
    director: Optional[str] = None
    cast: List[str] = []
    plot: Optional[str] = None
    poster_url: Optional[str] = None
    ratings: Dict[str, float] = {}
    runtime: Optional[int] = None
    rating: Optional[str] = None  # MPAA rating
    studio: Optional[str] = None
    format: Optional[str] = None
    language: Optional[str] = None
    awards: Optional[str] = None
    box_office: Optional[str] = None
    country: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class MovieMetadataCreate(BaseModel):
    """Model for creating new movie metadata"""
    tmdb_id: Optional[str] = None
    imdb_id: Optional[str] = None
    title: str
    normalized_title: str
    release_year: Optional[int] = None
    genres: List[str] = []
    director: Optional[str] = None
    cast: List[str] = []
    plot: Optional[str] = None
    poster_url: Optional[str] = None
    ratings: Dict[str, float] = {}
    runtime: Optional[int] = None
    rating: Optional[str] = None
    studio: Optional[str] = None
    format: Optional[str] = None
    language: Optional[str] = None
    awards: Optional[str] = None
    box_office: Optional[str] = None
    country: Optional[str] = None


class MovieMetadataInDB(MovieMetadata):
    """Model for movie metadata as stored in database"""
    id: str = Field(..., alias="_id")


class MatchCandidate(BaseModel):
    """Model for a movie match candidate"""
    movie: MovieMetadata
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    match_type: str  # "EXACT", "FUZZY", "PARTIAL"


class MatchCache(BaseModel):
    """Model for caching match results"""
    id: Optional[str] = Field(None, alias="_id")
    query: str
    normalized_query: str
    matches: List[MatchCandidate] = []
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class MatchCacheInDB(MatchCache):
    """Model for match cache as stored in database"""
    id: str = Field(..., alias="_id")


class MovieMatchRequest(BaseModel):
    """Model for movie match requests"""
    title: str
    year: Optional[int] = None


class MovieMatchResponse(BaseModel):
    """Model for movie match responses"""
    data: List[MatchCandidate]
    cached: bool = False
    query_time_ms: Optional[float] = None


class ExternalMovieData(BaseModel):
    """Model for movie data from external APIs"""
    source: str  # "tmdb" or "omdb"
    tmdb_id: Optional[str] = None
    imdb_id: Optional[str] = None
    title: str
    release_year: Optional[int] = None
    genres: List[str] = []
    director: Optional[str] = None
    cast: List[str] = []
    plot: Optional[str] = None
    poster_url: Optional[str] = None
    ratings: Dict[str, float] = {}
    runtime: Optional[int] = None
    rating: Optional[str] = None
    studio: Optional[str] = None
    awards: Optional[str] = None
    box_office: Optional[str] = None
    country: Optional[str] = None