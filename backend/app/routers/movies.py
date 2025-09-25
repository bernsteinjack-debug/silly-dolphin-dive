from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from pymongo import ASCENDING, DESCENDING

from ..core.database import db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.movie import (
    Movie, MovieCreate, MovieUpdate, MovieInDB, 
    MovieSearchParams, BulkDeleteRequest
)
from ..services.metadata_enrichment import enrich_movie_data

router = APIRouter()


async def verify_collection_ownership(collection_id: str, user_id: str) -> bool:
    """Verify that the collection belongs to the current user"""
    if not ObjectId.is_valid(collection_id):
        return False
    
    collection = await db.database.collections.find_one({
        "_id": ObjectId(collection_id),
        "user_id": ObjectId(user_id)
    })
    return collection is not None


def build_search_query(params: MovieSearchParams, collection_id: str) -> Dict[str, Any]:
    """Build MongoDB query from search parameters"""
    query = {"collection_id": ObjectId(collection_id)}
    
    # General search query (searches across title, director, cast, plot)
    if params.q:
        search_regex = {"$regex": params.q, "$options": "i"}
        query["$or"] = [
            {"title": search_regex},
            {"director": search_regex},
            {"cast": {"$elemMatch": search_regex}},
            {"plot": search_regex},
            {"genre": search_regex},
            {"studio": search_regex}
        ]
    
    # Specific field filters
    if params.title:
        query["title"] = {"$regex": params.title, "$options": "i"}
    
    if params.genre:
        query["genre"] = {"$regex": params.genre, "$options": "i"}
    
    if params.director:
        query["director"] = {"$regex": params.director, "$options": "i"}
    
    if params.rating:
        query["rating"] = params.rating
    
    if params.personal_rating:
        query["personal_rating"] = params.personal_rating
    
    # Year range filter
    if params.year_from or params.year_to:
        year_filter = {}
        if params.year_from:
            year_filter["$gte"] = params.year_from
        if params.year_to:
            year_filter["$lte"] = params.year_to
        query["release_year"] = year_filter
    
    # Tags filter
    if params.tags:
        query["tags"] = {"$in": params.tags}
    
    return query


def get_sort_criteria(sort_by: str, sort_order: str) -> List[tuple]:
    """Get MongoDB sort criteria"""
    direction = ASCENDING if sort_order == "asc" else DESCENDING
    
    sort_mapping = {
        "title": "title",
        "release_year": "release_year",
        "added_at": "added_at",
        "personal_rating": "personal_rating",
        "imdb_rating": "imdb_rating"
    }
    
    field = sort_mapping.get(sort_by, "added_at")
    return [(field, direction)]


@router.get("/collections/{collection_id}/movies", response_model=Dict[str, Any])
async def get_movies(
    collection_id: str,
    q: Optional[str] = Query(None, description="General search query"),
    title: Optional[str] = Query(None, description="Filter by title"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    director: Optional[str] = Query(None, description="Filter by director"),
    year_from: Optional[int] = Query(None, description="Filter by release year from"),
    year_to: Optional[int] = Query(None, description="Filter by release year to"),
    rating: Optional[str] = Query(None, description="Filter by rating"),
    personal_rating: Optional[int] = Query(None, ge=1, le=5, description="Filter by personal rating"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    sort_by: str = Query("added_at", regex="^(title|release_year|added_at|personal_rating|imdb_rating)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get movies in a collection with search and filtering"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Verify collection ownership
    if not await verify_collection_ownership(collection_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    try:
        # Build search parameters
        search_params = MovieSearchParams(
            q=q, title=title, genre=genre, director=director,
            year_from=year_from, year_to=year_to, rating=rating,
            personal_rating=personal_rating, tags=tags,
            limit=limit, skip=skip, sort_by=sort_by, sort_order=sort_order
        )
        
        # Build query and sort criteria
        query = build_search_query(search_params, collection_id)
        sort_criteria = get_sort_criteria(sort_by, sort_order)
        
        # Get total count
        total_count = await db.database.movies.count_documents(query)
        
        # Get movies with pagination and sorting
        movies_cursor = db.database.movies.find(query).sort(sort_criteria).skip(skip).limit(limit)
        movies = await movies_cursor.to_list(length=None)
        
        # Convert to response format
        movie_list = []
        for movie_doc in movies:
            movie_list.append({
                "id": str(movie_doc["_id"]),
                "collection_id": str(movie_doc["collection_id"]),
                "title": movie_doc["title"],
                "release_year": movie_doc.get("release_year"),
                "genre": movie_doc.get("genre"),
                "director": movie_doc.get("director"),
                "runtime": movie_doc.get("runtime"),
                "rating": movie_doc.get("rating"),
                "imdb_rating": movie_doc.get("imdb_rating"),
                "studio": movie_doc.get("studio"),
                "format": movie_doc.get("format"),
                "language": movie_doc.get("language"),
                "cast": movie_doc.get("cast", []),
                "plot": movie_doc.get("plot"),
                "awards": movie_doc.get("awards"),
                "box_office": movie_doc.get("box_office"),
                "country": movie_doc.get("country"),
                "poster_url": movie_doc.get("poster_url"),
                "personal_rating": movie_doc.get("personal_rating"),
                "notes": movie_doc.get("notes"),
                "tags": movie_doc.get("tags", []),
                "spine_position": movie_doc.get("spine_position"),
                "added_at": movie_doc["added_at"].isoformat()
            })
        
        return {
            "movies": movie_list,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "skip": skip,
                "has_more": skip + limit < total_count
            },
            "filters": {
                "q": q,
                "title": title,
                "genre": genre,
                "director": director,
                "year_from": year_from,
                "year_to": year_to,
                "rating": rating,
                "personal_rating": personal_rating,
                "tags": tags,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve movies"
        )


@router.post("/collections/{collection_id}/movies", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def add_movie(
    collection_id: str,
    movie_data: MovieCreate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Add a movie to a collection"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Verify collection ownership
    if not await verify_collection_ownership(collection_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    try:
        # Convert movie data to dict and enrich with metadata
        movie_dict = movie_data.dict()
        enriched_data = enrich_movie_data(movie_dict)
        
        # Create movie document
        now = datetime.utcnow()
        movie_doc = {
            "collection_id": ObjectId(collection_id),
            "title": enriched_data["title"],
            "release_year": enriched_data.get("release_year"),
            "genre": enriched_data.get("genre"),
            "director": enriched_data.get("director"),
            "runtime": enriched_data.get("runtime"),
            "rating": enriched_data.get("rating"),
            "imdb_rating": enriched_data.get("imdb_rating"),
            "studio": enriched_data.get("studio"),
            "format": enriched_data.get("format"),
            "language": enriched_data.get("language"),
            "cast": enriched_data.get("cast", []),
            "plot": enriched_data.get("plot"),
            "awards": enriched_data.get("awards"),
            "box_office": enriched_data.get("box_office"),
            "country": enriched_data.get("country"),
            "poster_url": enriched_data.get("poster_url"),
            "personal_rating": enriched_data.get("personal_rating"),
            "notes": enriched_data.get("notes"),
            "tags": enriched_data.get("tags", []),
            "spine_position": enriched_data.get("spine_position"),
            "added_at": now
        }
        
        # Insert movie into database
        result = await db.database.movies.insert_one(movie_doc)
        movie_id = str(result.inserted_id)
        
        return {
            "message": "Movie added successfully",
            "movie": {
                "id": movie_id,
                "collection_id": collection_id,
                "title": enriched_data["title"],
                "release_year": enriched_data.get("release_year"),
                "genre": enriched_data.get("genre"),
                "director": enriched_data.get("director"),
                "runtime": enriched_data.get("runtime"),
                "rating": enriched_data.get("rating"),
                "imdb_rating": enriched_data.get("imdb_rating"),
                "studio": enriched_data.get("studio"),
                "format": enriched_data.get("format"),
                "language": enriched_data.get("language"),
                "cast": enriched_data.get("cast", []),
                "plot": enriched_data.get("plot"),
                "awards": enriched_data.get("awards"),
                "box_office": enriched_data.get("box_office"),
                "country": enriched_data.get("country"),
                "poster_url": enriched_data.get("poster_url"),
                "personal_rating": enriched_data.get("personal_rating"),
                "notes": enriched_data.get("notes"),
                "tags": enriched_data.get("tags", []),
                "spine_position": enriched_data.get("spine_position"),
                "added_at": now.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add movie"
        )


@router.get("/{movie_id}", response_model=Dict[str, Any])
async def get_movie(
    movie_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get a specific movie by ID"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(movie_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid movie ID"
        )
    
    try:
        # Find movie
        movie_doc = await db.database.movies.find_one({"_id": ObjectId(movie_id)})
        
        if not movie_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found"
            )
        
        # Verify collection ownership
        collection_id = str(movie_doc["collection_id"])
        if not await verify_collection_ownership(collection_id, str(current_user.id)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found"
            )
        
        return {
            "movie": {
                "id": str(movie_doc["_id"]),
                "collection_id": str(movie_doc["collection_id"]),
                "title": movie_doc["title"],
                "release_year": movie_doc.get("release_year"),
                "genre": movie_doc.get("genre"),
                "director": movie_doc.get("director"),
                "runtime": movie_doc.get("runtime"),
                "rating": movie_doc.get("rating"),
                "imdb_rating": movie_doc.get("imdb_rating"),
                "studio": movie_doc.get("studio"),
                "format": movie_doc.get("format"),
                "language": movie_doc.get("language"),
                "cast": movie_doc.get("cast", []),
                "plot": movie_doc.get("plot"),
                "awards": movie_doc.get("awards"),
                "box_office": movie_doc.get("box_office"),
                "country": movie_doc.get("country"),
                "poster_url": movie_doc.get("poster_url"),
                "personal_rating": movie_doc.get("personal_rating"),
                "notes": movie_doc.get("notes"),
                "tags": movie_doc.get("tags", []),
                "spine_position": movie_doc.get("spine_position"),
                "added_at": movie_doc["added_at"].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve movie"
        )


@router.put("/{movie_id}", response_model=Dict[str, Any])
async def update_movie(
    movie_id: str,
    movie_data: MovieUpdate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update a specific movie"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(movie_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid movie ID"
        )
    
    try:
        # Find existing movie
        existing_movie = await db.database.movies.find_one({"_id": ObjectId(movie_id)})
        
        if not existing_movie:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found"
            )
        
        # Verify collection ownership
        collection_id = str(existing_movie["collection_id"])
        if not await verify_collection_ownership(collection_id, str(current_user.id)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found"
            )
        
        # Build update document
        update_data = {}
        update_dict = movie_data.dict(exclude_unset=True)
        
        for key, value in update_dict.items():
            if value is not None:
                update_data[key] = value
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Update movie
        result = await db.database.movies.update_one(
            {"_id": ObjectId(movie_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made to movie"
            )
        
        # Get updated movie
        updated_movie = await db.database.movies.find_one({"_id": ObjectId(movie_id)})
        
        return {
            "message": "Movie updated successfully",
            "movie": {
                "id": str(updated_movie["_id"]),
                "collection_id": str(updated_movie["collection_id"]),
                "title": updated_movie["title"],
                "release_year": updated_movie.get("release_year"),
                "genre": updated_movie.get("genre"),
                "director": updated_movie.get("director"),
                "runtime": updated_movie.get("runtime"),
                "rating": updated_movie.get("rating"),
                "imdb_rating": updated_movie.get("imdb_rating"),
                "studio": updated_movie.get("studio"),
                "format": updated_movie.get("format"),
                "language": updated_movie.get("language"),
                "cast": updated_movie.get("cast", []),
                "plot": updated_movie.get("plot"),
                "awards": updated_movie.get("awards"),
                "box_office": updated_movie.get("box_office"),
                "country": updated_movie.get("country"),
                "poster_url": updated_movie.get("poster_url"),
                "personal_rating": updated_movie.get("personal_rating"),
                "notes": updated_movie.get("notes"),
                "tags": updated_movie.get("tags", []),
                "spine_position": updated_movie.get("spine_position"),
                "added_at": updated_movie["added_at"].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update movie"
        )


@router.delete("/{movie_id}", response_model=Dict[str, Any])
async def delete_movie(
    movie_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete a specific movie"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(movie_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid movie ID"
        )
    
    try:
        # Find existing movie
        existing_movie = await db.database.movies.find_one({"_id": ObjectId(movie_id)})
        
        if not existing_movie:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found"
            )
        
        # Verify collection ownership
        collection_id = str(existing_movie["collection_id"])
        if not await verify_collection_ownership(collection_id, str(current_user.id)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found"
            )
        
        # Delete movie
        result = await db.database.movies.delete_one({"_id": ObjectId(movie_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found"
            )
        
        return {
            "message": "Movie deleted successfully",
            "movie_id": movie_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete movie"
        )


@router.delete("/collections/{collection_id}/movies/bulk", response_model=Dict[str, Any])
async def bulk_delete_movies(
    collection_id: str,
    bulk_request: BulkDeleteRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Bulk delete movies from a collection"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Verify collection ownership
    if not await verify_collection_ownership(collection_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    if not bulk_request.movie_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No movie IDs provided"
        )
    
    # Validate all movie IDs
    valid_ids = []
    for movie_id in bulk_request.movie_ids:
        if ObjectId.is_valid(movie_id):
            valid_ids.append(ObjectId(movie_id))
    
    if not valid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid movie IDs provided"
        )
    
    try:
        # Verify all movies belong to the collection
        movies_in_collection = await db.database.movies.count_documents({
            "_id": {"$in": valid_ids},
            "collection_id": ObjectId(collection_id)
        })
        
        if movies_in_collection != len(valid_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some movies do not belong to this collection"
            )
        
        # Delete movies
        result = await db.database.movies.delete_many({
            "_id": {"$in": valid_ids},
            "collection_id": ObjectId(collection_id)
        })
        
        return {
            "message": f"Successfully deleted {result.deleted_count} movies",
            "deleted_count": result.deleted_count,
            "requested_count": len(bulk_request.movie_ids)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk delete movies"
        )