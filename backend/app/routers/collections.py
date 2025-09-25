from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from ..core.database import db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.collection import Collection, CollectionCreate, CollectionUpdate, CollectionInDB

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_collections(current_user: User = Depends(get_current_user)) -> List[dict]:
    """Get all collections for the current user"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        # Find all collections for the current user
        collections_cursor = db.database.collections.find({"user_id": ObjectId(current_user.id)})
        collections = await collections_cursor.to_list(length=None)
        
        # Convert to response format
        result = []
        for collection_doc in collections:
            result.append({
                "id": str(collection_doc["_id"]),
                "user_id": str(collection_doc["user_id"]),
                "name": collection_doc["name"],
                "shelf_image_url": collection_doc.get("shelf_image_url"),
                "created_at": collection_doc["created_at"].isoformat(),
                "updated_at": collection_doc["updated_at"].isoformat()
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve collections"
        )


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Create a new collection for the current user"""
    if not db.database:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )
    
    try:
        # Create collection document
        now = datetime.utcnow()
        collection_doc = {
            "user_id": ObjectId(current_user.id),
            "name": collection_data.name,
            "shelf_image_url": collection_data.shelf_image_url,
            "created_at": now,
            "updated_at": now
        }
        
        # Insert collection into database
        result = await db.database.collections.insert_one(collection_doc)
        collection_id = str(result.inserted_id)
        
        return {
            "message": "Collection created successfully",
            "collection": {
                "id": collection_id,
                "user_id": str(current_user.id),
                "name": collection_data.name,
                "shelf_image_url": collection_data.shelf_image_url,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create collection"
        )


@router.get("/{collection_id}", response_model=dict)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Get a specific collection by ID"""
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
        # Find collection by ID and user ownership
        collection_doc = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not collection_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found"
            )
        
        return {
            "collection": {
                "id": str(collection_doc["_id"]),
                "user_id": str(collection_doc["user_id"]),
                "name": collection_doc["name"],
                "shelf_image_url": collection_doc.get("shelf_image_url"),
                "created_at": collection_doc["created_at"].isoformat(),
                "updated_at": collection_doc["updated_at"].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve collection"
        )


@router.put("/{collection_id}", response_model=dict)
async def update_collection(
    collection_id: str,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Update a specific collection"""
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
        # Check if collection exists and belongs to user
        existing_collection = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not existing_collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found"
            )
        
        # Build update document
        update_data = {"updated_at": datetime.utcnow()}
        if collection_data.name is not None:
            update_data["name"] = collection_data.name
        if collection_data.shelf_image_url is not None:
            update_data["shelf_image_url"] = collection_data.shelf_image_url
        
        # Update collection
        result = await db.database.collections.update_one(
            {"_id": ObjectId(collection_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made to collection"
            )
        
        # Get updated collection
        updated_collection = await db.database.collections.find_one({"_id": ObjectId(collection_id)})
        
        return {
            "message": "Collection updated successfully",
            "collection": {
                "id": str(updated_collection["_id"]),
                "user_id": str(updated_collection["user_id"]),
                "name": updated_collection["name"],
                "shelf_image_url": updated_collection.get("shelf_image_url"),
                "created_at": updated_collection["created_at"].isoformat(),
                "updated_at": updated_collection["updated_at"].isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update collection"
        )


@router.delete("/{collection_id}", response_model=dict)
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Delete a specific collection"""
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
        # Check if collection exists and belongs to user
        existing_collection = await db.database.collections.find_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if not existing_collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found"
            )
        
        # Delete collection
        result = await db.database.collections.delete_one({
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(current_user.id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Collection not found"
            )
        
        return {
            "message": "Collection deleted successfully",
            "collection_id": collection_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete collection"
        )