from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from bson import ObjectId

from ..core.database import db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.photo import Photo, PhotoCreate, PhotoUpdate, PhotoInDB, PhotoUploadResponse, ProcessingStatus
from ..services.file_storage import file_storage

router = APIRouter()


@router.post("/upload", response_model=PhotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    collection_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
) -> PhotoUploadResponse:
    """Upload a photo file"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate collection_id if provided
    if collection_id and not ObjectId.is_valid(collection_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid collection ID"
        )
    
    # If collection_id provided, verify it belongs to the user
    if collection_id:
        collection_doc = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        if not collection_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found"
            )
    
    # Validate and save file
    try:
        filename, file_path = await file_storage.save_photo(file, str(current_user.id))
        photo_url = file_storage.get_photo_url(filename, str(current_user.id))
        
        # Create photo document
        now = datetime.utcnow()
        photo_doc = {
            "user_id": ObjectId(current_user.id),
            "filename": filename,
            "url": photo_url,
            "processing_status": ProcessingStatus.PENDING,
            "detected_titles": [],
            "uploaded_at": now
        }
        
        # Add collection_id if provided
        if collection_id:
            photo_doc["collection_id"] = ObjectId(collection_id)
        
        # Insert photo into database
        result = await db.database.photos.insert_one(photo_doc)
        photo_id = str(result.inserted_id)
        
        return PhotoUploadResponse(
            id=photo_id,
            filename=filename,
            url=photo_url,
            processing_status=ProcessingStatus.PENDING,
            uploaded_at=now,
            message="Photo uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo: {str(e)}"
        )


@router.get("/", response_model=List[dict])
async def get_photos(
    collection_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> List[dict]:
    """Get all photos for the current user, optionally filtered by collection"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Build query
    query = {"user_id": ObjectId(current_user.id)}
    if collection_id:
        if not ObjectId.is_valid(collection_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid collection ID"
            )
        query["collection_id"] = ObjectId(collection_id)
    
    try:
        # Find all photos for the current user
        photos_cursor = db.database.photos.find(query)
        photos = await photos_cursor.to_list(length=None)
        
        # Convert to response format
        result = []
        for photo_doc in photos:
            result.append({
                "id": str(photo_doc["_id"]),
                "user_id": str(photo_doc["user_id"]),
                "collection_id": str(photo_doc["collection_id"]) if photo_doc.get("collection_id") else None,
                "filename": photo_doc["filename"],
                "url": photo_doc["url"],
                "processing_status": photo_doc["processing_status"],
                "detected_titles": photo_doc.get("detected_titles", []),
                "uploaded_at": photo_doc["uploaded_at"].isoformat()
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve photos"
        )


@router.get("/{photo_id}", response_model=dict)
async def get_photo(
    photo_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Get a specific photo by ID"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(photo_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo ID"
        )
    
    try:
        # Find photo by ID and user ownership
        photo_doc = await db.database.photos.find_one({
            "_id": ObjectId(photo_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not photo_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        return {
            "photo": {
                "id": str(photo_doc["_id"]),
                "user_id": str(photo_doc["user_id"]),
                "collection_id": str(photo_doc["collection_id"]) if photo_doc.get("collection_id") else None,
                "filename": photo_doc["filename"],
                "url": photo_doc["url"],
                "processing_status": photo_doc["processing_status"],
                "detected_titles": photo_doc.get("detected_titles", []),
                "uploaded_at": photo_doc["uploaded_at"].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve photo"
        )


@router.put("/{photo_id}", response_model=dict)
async def update_photo(
    photo_id: str,
    photo_data: PhotoUpdate,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Update a specific photo"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(photo_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo ID"
        )
    
    try:
        # Check if photo exists and belongs to user
        existing_photo = await db.database.photos.find_one({
            "_id": ObjectId(photo_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not existing_photo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        # Build update document
        update_data = {}
        if photo_data.processing_status is not None:
            update_data["processing_status"] = photo_data.processing_status
        if photo_data.detected_titles is not None:
            update_data["detected_titles"] = photo_data.detected_titles
        if photo_data.collection_id is not None:
            # Validate collection belongs to user
            if photo_data.collection_id:
                collection_doc = await db.database.collections.find_one({
                    "_id": ObjectId(photo_data.collection_id),
                    "user_id": ObjectId(current_user.id)
                })
                if not collection_doc:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Collection not found"
                    )
            update_data["collection_id"] = ObjectId(photo_data.collection_id) if photo_data.collection_id else None
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Update photo
        result = await db.database.photos.update_one(
            {"_id": ObjectId(photo_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made to photo"
            )
        
        # Get updated photo
        updated_photo = await db.database.photos.find_one({"_id": ObjectId(photo_id)})
        
        return {
            "message": "Photo updated successfully",
            "photo": {
                "id": str(updated_photo["_id"]),
                "user_id": str(updated_photo["user_id"]),
                "collection_id": str(updated_photo["collection_id"]) if updated_photo.get("collection_id") else None,
                "filename": updated_photo["filename"],
                "url": updated_photo["url"],
                "processing_status": updated_photo["processing_status"],
                "detected_titles": updated_photo.get("detected_titles", []),
                "uploaded_at": updated_photo["uploaded_at"].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update photo"
        )


@router.delete("/{photo_id}", response_model=dict)
async def delete_photo(
    photo_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Delete a specific photo"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(photo_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo ID"
        )
    
    try:
        # Check if photo exists and belongs to user
        existing_photo = await db.database.photos.find_one({
            "_id": ObjectId(photo_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not existing_photo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        # Delete file from storage
        file_deleted = file_storage.delete_photo(
            existing_photo["filename"], 
            str(current_user.id)
        )
        
        # Delete photo from database
        result = await db.database.photos.delete_one({
            "_id": ObjectId(photo_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        return {
            "message": "Photo deleted successfully",
            "photo_id": photo_id,
            "file_deleted": file_deleted
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete photo"
        )