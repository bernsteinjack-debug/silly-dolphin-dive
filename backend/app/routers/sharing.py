from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from typing import List, Optional
import io
from datetime import datetime
from bson import ObjectId

from ..core.auth import get_current_user
from ..core.database import db
from ..models.user import User
from ..models.collection import Collection
from ..models.movie import Movie
from ..services.sharing_service import SharingService

router = APIRouter()
sharing_service = SharingService()


@router.post("/collections/{collection_id}/share")
async def generate_share_image(
    collection_id: str,
    format_type: str = "default",
    current_user: User = Depends(get_current_user),
    # No db dependency needed - using global db
):
    """
    Generate a shareable image for a collection
    
    - **collection_id**: The ID of the collection to share
    - **format_type**: The format for the share image (default, facebook, twitter, instagram, linkedin)
    """
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(collection_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid collection ID"
        )
    
    try:
        # Get collection and verify ownership
        collection_data = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not collection_data:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Convert MongoDB document to Collection model
        collection_dict = {
            "id": str(collection_data["_id"]),
            "user_id": str(collection_data["user_id"]),
            "name": collection_data["name"],
            "shelf_image_url": collection_data.get("shelf_image_url"),
            "created_at": collection_data["created_at"],
            "updated_at": collection_data["updated_at"]
        }
        collection = Collection(**collection_dict)
        
        # Get movies in the collection
        movies_cursor = db.database.movies.find({"collection_id": ObjectId(collection_id)})
        movies_data = await movies_cursor.to_list(length=None)
        movies = []
        for movie_data in movies_data:
            movie_dict = {
                "id": str(movie_data["_id"]),
                "collection_id": str(movie_data["collection_id"]),
                "title": movie_data["title"],
                "release_year": movie_data.get("release_year"),
                "genre": movie_data.get("genre"),
                "director": movie_data.get("director"),
                "runtime": movie_data.get("runtime"),
                "rating": movie_data.get("rating"),
                "imdb_rating": movie_data.get("imdb_rating"),
                "studio": movie_data.get("studio"),
                "format": movie_data.get("format"),
                "language": movie_data.get("language"),
                "cast": movie_data.get("cast"),
                "plot": movie_data.get("plot"),
                "awards": movie_data.get("awards"),
                "box_office": movie_data.get("box_office"),
                "country": movie_data.get("country"),
                "poster_url": movie_data.get("poster_url"),
                "personal_rating": movie_data.get("personal_rating"),
                "notes": movie_data.get("notes"),
                "tags": movie_data.get("tags"),
                "spine_position": movie_data.get("spine_position"),
                "added_at": movie_data["added_at"]
            }
            movies.append(Movie(**movie_dict))
        
        # Validate format type
        supported_formats = sharing_service.get_supported_formats()
        if format_type not in supported_formats:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported format. Supported formats: {', '.join(supported_formats)}"
            )
        
        # Generate the image
        image_bytes = await sharing_service.generate_catalog_image(
            collection=collection,
            movies=movies,
            format_type=format_type
        )
        
        # Return the image as a streaming response
        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename={collection.name.replace(' ', '_')}_catalog.png"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating share image: {str(e)}")


@router.get("/collections/{collection_id}/export")
async def export_collection(
    collection_id: str,
    format: str = "json",
    current_user: User = Depends(get_current_user)
):
    """
    Export collection data in various formats
    
    - **collection_id**: The ID of the collection to export
    - **format**: Export format (json, csv)
    """
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(collection_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid collection ID"
        )
    
    try:
        # Get collection and verify ownership
        collection_data = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not collection_data:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Convert MongoDB document to Collection model
        collection_dict = {
            "id": str(collection_data["_id"]),
            "user_id": str(collection_data["user_id"]),
            "name": collection_data["name"],
            "shelf_image_url": collection_data.get("shelf_image_url"),
            "created_at": collection_data["created_at"],
            "updated_at": collection_data["updated_at"]
        }
        collection = Collection(**collection_dict)
        
        # Get movies in the collection
        movies_cursor = db.database.movies.find({"collection_id": ObjectId(collection_id)})
        movies_data = await movies_cursor.to_list(length=None)
        movies = []
        for movie_data in movies_data:
            movie_dict = {
                "id": str(movie_data["_id"]),
                "collection_id": str(movie_data["collection_id"]),
                "title": movie_data["title"],
                "release_year": movie_data.get("release_year"),
                "genre": movie_data.get("genre"),
                "director": movie_data.get("director"),
                "runtime": movie_data.get("runtime"),
                "rating": movie_data.get("rating"),
                "imdb_rating": movie_data.get("imdb_rating"),
                "studio": movie_data.get("studio"),
                "format": movie_data.get("format"),
                "language": movie_data.get("language"),
                "cast": movie_data.get("cast"),
                "plot": movie_data.get("plot"),
                "awards": movie_data.get("awards"),
                "box_office": movie_data.get("box_office"),
                "country": movie_data.get("country"),
                "poster_url": movie_data.get("poster_url"),
                "personal_rating": movie_data.get("personal_rating"),
                "notes": movie_data.get("notes"),
                "tags": movie_data.get("tags"),
                "spine_position": movie_data.get("spine_position"),
                "added_at": movie_data["added_at"]
            }
            movies.append(Movie(**movie_dict))
        
        # Validate export format
        supported_formats = sharing_service.get_supported_export_formats()
        if format not in supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported export format. Supported formats: {', '.join(supported_formats)}"
            )
        
        # Generate export data
        if format == "json":
            export_data = await sharing_service.export_collection_json(collection, movies)
            media_type = "application/json"
            filename = f"{collection.name.replace(' ', '_')}_export.json"
        elif format == "csv":
            export_data = await sharing_service.export_collection_csv(collection, movies)
            media_type = "text/csv"
            filename = f"{collection.name.replace(' ', '_')}_export.csv"
        else:
            raise HTTPException(status_code=400, detail="Invalid export format")
        
        # Return the export data
        return StreamingResponse(
            io.BytesIO(export_data),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting collection: {str(e)}")


@router.get("/collections/{collection_id}/share/{format_type}")
async def get_share_in_format(
    collection_id: str,
    format_type: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a shareable image in a specific format
    
    - **collection_id**: The ID of the collection to share
    - **format_type**: The format for the share image (default, facebook, twitter, instagram, linkedin)
    """
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(collection_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid collection ID"
        )
    
    try:
        # Get collection and verify ownership
        collection_data = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not collection_data:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Convert MongoDB document to Collection model
        collection_dict = {
            "id": str(collection_data["_id"]),
            "user_id": str(collection_data["user_id"]),
            "name": collection_data["name"],
            "shelf_image_url": collection_data.get("shelf_image_url"),
            "created_at": collection_data["created_at"],
            "updated_at": collection_data["updated_at"]
        }
        collection = Collection(**collection_dict)
        
        # Get movies in the collection
        movies_cursor = db.database.movies.find({"collection_id": ObjectId(collection_id)})
        movies_data = await movies_cursor.to_list(length=None)
        movies = []
        for movie_data in movies_data:
            movie_dict = {
                "id": str(movie_data["_id"]),
                "collection_id": str(movie_data["collection_id"]),
                "title": movie_data["title"],
                "release_year": movie_data.get("release_year"),
                "genre": movie_data.get("genre"),
                "director": movie_data.get("director"),
                "runtime": movie_data.get("runtime"),
                "rating": movie_data.get("rating"),
                "imdb_rating": movie_data.get("imdb_rating"),
                "studio": movie_data.get("studio"),
                "format": movie_data.get("format"),
                "language": movie_data.get("language"),
                "cast": movie_data.get("cast"),
                "plot": movie_data.get("plot"),
                "awards": movie_data.get("awards"),
                "box_office": movie_data.get("box_office"),
                "country": movie_data.get("country"),
                "poster_url": movie_data.get("poster_url"),
                "personal_rating": movie_data.get("personal_rating"),
                "notes": movie_data.get("notes"),
                "tags": movie_data.get("tags"),
                "spine_position": movie_data.get("spine_position"),
                "added_at": movie_data["added_at"]
            }
            movies.append(Movie(**movie_dict))
        
        # Validate format type
        supported_formats = sharing_service.get_supported_formats()
        if format_type not in supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format. Supported formats: {', '.join(supported_formats)}"
            )
        
        # Generate the image
        image_bytes = await sharing_service.generate_catalog_image(
            collection=collection,
            movies=movies,
            format_type=format_type
        )
        
        # Return the image as a streaming response
        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename={collection.name.replace(' ', '_')}_{format_type}_catalog.png"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating share image: {str(e)}")


@router.get("/formats")
async def get_supported_formats():
    """
    Get list of supported sharing and export formats
    """
    return {
        "sharing_formats": sharing_service.get_supported_formats(),
        "export_formats": sharing_service.get_supported_export_formats()
    }


@router.get("/collections/{collection_id}/share/preview")
async def preview_share_image(
    collection_id: str,
    format_type: str = "default",
    current_user: User = Depends(get_current_user)
):
    """
    Preview a shareable image without downloading
    
    - **collection_id**: The ID of the collection to preview
    - **format_type**: The format for the share image preview
    """
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(collection_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid collection ID"
        )
    
    try:
        # Get collection and verify ownership
        collection_data = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not collection_data:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # Convert MongoDB document to Collection model
        collection_dict = {
            "id": str(collection_data["_id"]),
            "user_id": str(collection_data["user_id"]),
            "name": collection_data["name"],
            "shelf_image_url": collection_data.get("shelf_image_url"),
            "created_at": collection_data["created_at"],
            "updated_at": collection_data["updated_at"]
        }
        collection = Collection(**collection_dict)
        
        # Get movies in the collection (limit for preview)
        movies_cursor = db.database.movies.find({"collection_id": ObjectId(collection_id)}).limit(20)
        movies_data = await movies_cursor.to_list(length=20)
        movies = []
        for movie_data in movies_data:
            movie_dict = {
                "id": str(movie_data["_id"]),
                "collection_id": str(movie_data["collection_id"]),
                "title": movie_data["title"],
                "release_year": movie_data.get("release_year"),
                "genre": movie_data.get("genre"),
                "director": movie_data.get("director"),
                "runtime": movie_data.get("runtime"),
                "rating": movie_data.get("rating"),
                "imdb_rating": movie_data.get("imdb_rating"),
                "studio": movie_data.get("studio"),
                "format": movie_data.get("format"),
                "language": movie_data.get("language"),
                "cast": movie_data.get("cast"),
                "plot": movie_data.get("plot"),
                "awards": movie_data.get("awards"),
                "box_office": movie_data.get("box_office"),
                "country": movie_data.get("country"),
                "poster_url": movie_data.get("poster_url"),
                "personal_rating": movie_data.get("personal_rating"),
                "notes": movie_data.get("notes"),
                "tags": movie_data.get("tags"),
                "spine_position": movie_data.get("spine_position"),
                "added_at": movie_data["added_at"]
            }
            movies.append(Movie(**movie_dict))
        
        # Validate format type
        supported_formats = sharing_service.get_supported_formats()
        if format_type not in supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format. Supported formats: {', '.join(supported_formats)}"
            )
        
        # Generate the preview image
        image_bytes = await sharing_service.generate_catalog_image(
            collection=collection,
            movies=movies,
            format_type=format_type
        )
        
        # Return the image for preview
        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=preview_{collection.name.replace(' ', '_')}_catalog.png"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")