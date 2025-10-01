from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
import logging

from ..models.movie_metadata import (
    MovieMatchRequest, MovieMatchResponse, MatchCandidate
)
from ..services.movie_matching_service import MovieMatchingService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize the movie matching service
matching_service = MovieMatchingService()


@router.post("/match", response_model=MovieMatchResponse)
async def match_movie_title(request: MovieMatchRequest) -> MovieMatchResponse:
    """
    Match a movie title against the database and external APIs.
    
    This endpoint performs fuzzy matching to find the best movie matches
    for a given title, optionally filtered by year.
    """
    try:
        if not request.title or not request.title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Movie title is required"
            )
        
        # Perform the matching
        result = await matching_service.match_movie_title(request)
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No matches found for '{request.title}'"
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in movie matching endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during movie matching"
        )


@router.get("/suggestions", response_model=List[str])
async def get_movie_suggestions(
    q: str = Query(..., min_length=1, description="Search query for movie suggestions"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of suggestions to return")
) -> List[str]:
    """
    Get movie title suggestions for autocomplete functionality.
    
    Returns a list of movie titles that match or are similar to the query.
    """
    try:
        suggestions = await matching_service.get_movie_suggestions(q, limit)
        return suggestions
        
    except Exception as e:
        logger.error(f"Error getting movie suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error getting suggestions"
        )


@router.delete("/cache", status_code=status.HTTP_204_NO_CONTENT)
async def clear_match_cache():
    """
    Clear expired cache entries.
    
    This endpoint can be called periodically to clean up old cache entries.
    """
    try:
        await matching_service.clear_expired_cache()
        
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error clearing cache"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the movie matching service"""
    return {
        "status": "healthy",
        "service": "movie_matching",
        "timestamp": datetime.utcnow().isoformat()
    }