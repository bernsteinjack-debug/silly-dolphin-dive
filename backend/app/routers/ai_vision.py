import asyncio
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from bson import ObjectId

from ..core.database import db
from ..models.photo import ProcessingStatus
from ..services.ai_vision_service import ai_vision_service

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Background task storage (in production, use Redis or similar)
processing_tasks = {}

async def background_ai_processing(photo_id: str, user_id: str):
    """Background task for AI vision processing"""
    try:
        logger.info(f"Starting background AI processing for photo {photo_id}")
        result = await ai_vision_service.process_photo_ai_vision(photo_id, user_id)
        
        # Store result in task storage
        processing_tasks[photo_id] = {
            "status": "completed",
            "result": result,
            "error": None
        }
        
        logger.info(f"Background AI processing completed for photo {photo_id}")
        
    except ValueError as e:
        logger.error(f"AI Vision configuration error for photo {photo_id}: {e}")
        processing_tasks[photo_id] = {
            "status": "failed",
            "result": None,
            "error": str(e)
        }
    except Exception as e:
        logger.error(f"Background AI processing failed for photo {photo_id}: {e}")
        processing_tasks[photo_id] = {
            "status": "failed",
            "result": None,
            "error": str(e)
        }


@router.post("/{photo_id}/process", response_model=Dict[str, Any])
async def start_ai_processing(
    photo_id: str,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Start AI processing for a photo"""
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
        # Check if photo exists
        photo_doc = await db.database.photos.find_one({
            "_id": ObjectId(photo_id)
        })
        
        if not photo_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        # Check if already processing
        if photo_doc.get("processing_status") == ProcessingStatus.PROCESSING:
            return {
                "message": "Photo is already being processed",
                "photo_id": photo_id,
                "status": "processing"
            }
        
        # Check if already completed
        if photo_doc.get("processing_status") == ProcessingStatus.COMPLETED:
            return {
                "message": "Photo has already been processed",
                "photo_id": photo_id,
                "status": "completed",
                "detected_titles": photo_doc.get("detected_titles", [])
            }
        
        # Initialize task tracking
        processing_tasks[photo_id] = {
            "status": "processing",
            "result": None,
            "error": None
        }
        
        # Start background processing
        user_id = str(photo_doc["user_id"])
        background_tasks.add_task(background_ai_processing, photo_id, user_id)
        
        # Update photo status to processing
        await db.database.photos.update_one(
            {"_id": ObjectId(photo_id)},
            {"$set": {"processing_status": ProcessingStatus.PROCESSING}}
        )
        
        return {
            "message": "AI processing started",
            "photo_id": photo_id,
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"AI Vision configuration error for photo {photo_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to start AI processing for photo {photo_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start AI processing"
        )


@router.get("/{photo_id}/status", response_model=Dict[str, Any])
async def get_processing_status(
    photo_id: str
) -> Dict[str, Any]:
    """Get processing status for a photo"""
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
        # Check if photo exists
        photo_doc = await db.database.photos.find_one({
            "_id": ObjectId(photo_id)
        })
        
        if not photo_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        processing_status = photo_doc.get("processing_status", ProcessingStatus.PENDING)
        
        # Check background task status if available
        task_info = processing_tasks.get(photo_id)
        
        result = {
            "photo_id": photo_id,
            "status": processing_status,
            "detected_titles_count": len(photo_doc.get("detected_titles", [])),
            "uploaded_at": photo_doc["uploaded_at"].isoformat()
        }
        
        # Add task-specific information if available
        if task_info:
            result["task_status"] = task_info["status"]
            if task_info["error"]:
                result["error"] = task_info["error"]
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get processing status for photo {photo_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get processing status"
        )


@router.get("/{photo_id}/results", response_model=Dict[str, Any])
async def get_processing_results(
    photo_id: str
) -> Dict[str, Any]:
    """Get detected titles and processing results for a photo"""
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
        # Check if photo exists
        photo_doc = await db.database.photos.find_one({
            "_id": ObjectId(photo_id)
        })
        
        if not photo_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        processing_status = photo_doc.get("processing_status", ProcessingStatus.PENDING)
        detected_titles = photo_doc.get("detected_titles", [])
        
        # Check if processing is complete
        if processing_status == ProcessingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Photo has not been processed yet. Start processing first."
            )
        
        if processing_status == ProcessingStatus.PROCESSING:
            return {
                "photo_id": photo_id,
                "status": "processing",
                "message": "Processing is still in progress. Check back later.",
                "detected_titles": []
            }
        
        # Return results
        result = {
            "photo_id": photo_id,
            "status": processing_status,
            "detected_titles": detected_titles,
            "total_titles": len(detected_titles),
            "uploaded_at": photo_doc["uploaded_at"].isoformat(),
            "filename": photo_doc["filename"],
            "url": photo_doc["url"]
        }
        
        # Add task-specific information if available
        task_info = processing_tasks.get(photo_id)
        if task_info and task_info.get("result"):
            result["processing_info"] = {
                "processing_errors": task_info["result"].get("processing_errors", []),
                "total_detected": task_info["result"].get("total_titles", 0)
            }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get processing results for photo {photo_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get processing results"
        )


@router.post("/{photo_id}/reprocess", response_model=Dict[str, Any])
async def reprocess_photo(
    photo_id: str,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Reprocess a photo with AI vision (useful for retrying failed processing)"""
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
        # Check if photo exists
        photo_doc = await db.database.photos.find_one({
            "_id": ObjectId(photo_id)
        })
        
        if not photo_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found"
            )
        
        # Check if already processing
        if photo_doc.get("processing_status") == ProcessingStatus.PROCESSING:
            return {
                "message": "Photo is already being processed",
                "photo_id": photo_id,
                "status": "processing"
            }
        
        # Clear previous results
        await db.database.photos.update_one(
            {"_id": ObjectId(photo_id)},
            {
                "$set": {
                    "processing_status": ProcessingStatus.PENDING,
                    "detected_titles": []
                }
            }
        )
        
        # Initialize task tracking
        processing_tasks[photo_id] = {
            "status": "processing",
            "result": None,
            "error": None
        }
        
        # Start background processing
        user_id = str(photo_doc["user_id"])
        background_tasks.add_task(background_ai_processing, photo_id, user_id)
        
        # Update photo status to processing
        await db.database.photos.update_one(
            {"_id": ObjectId(photo_id)},
            {"$set": {"processing_status": ProcessingStatus.PROCESSING}}
        )
        
        return {
            "message": "AI reprocessing started",
            "photo_id": photo_id,
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reprocess photo {photo_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reprocess photo"
        )


@router.get("/health", response_model=Dict[str, Any])
async def ai_vision_health_check() -> Dict[str, Any]:
    """Health check for AI vision services"""
    try:
        # Check if AI services are configured
        anthropic_configured = ai_vision_service.anthropic_client is not None
        google_vision_configured = ai_vision_service.google_vision_api_key is not None
        
        return {
            "status": "healthy",
            "services": {
                "anthropic": {
                    "configured": anthropic_configured,
                    "status": "available" if anthropic_configured else "not_configured"
                },
                "google_vision": {
                    "configured": google_vision_configured,
                    "status": "available" if google_vision_configured else "not_configured"
                }
            },
            "message": "AI Vision services status"
        }
        
    except Exception as e:
        logger.error(f"AI vision health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "AI Vision services are not available"
        }


@router.post("/process-image", response_model=Dict[str, Any])
async def process_image(
    image_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Endpoint to process an image and detect movie titles.
    This endpoint takes image data, calls the processing function,
    and returns the detected titles.
    """
    return await process_image_direct(image_data)

async def process_image_direct(
    image_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Process image data directly without uploading to storage"""
    try:
        # Extract base64 image data
        if "image" not in image_data or "data" not in image_data["image"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image data format. Expected: {image: {data: 'base64_string'}}"
            )
        
        base64_image = image_data["image"]["data"]

        # Handle case where data is wrapped in a list
        if isinstance(base64_image, list) and base64_image:
            base64_image = base64_image

        if isinstance(base64_image, str):
            if "data:" in base64_image and "," in base64_image:
                base64_image = base64_image.split(",", 1)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid type for image data: {type(base64_image)}"
            )
        
        logger.info("Processing image directly with AI vision services")
        
        # Check if any AI service is available
        if not ai_vision_service.anthropic_client and not ai_vision_service.google_vision_api_key:
            error_msg = "No AI vision services are configured. Please set up either ANTHROPIC_API_KEY or GOOGLE_CLOUD_VISION_API_KEY."
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg
            )
        
        # Try Anthropic first, then Google Vision as fallback
        detected_titles = []
        processing_errors = []
        
        # Try Anthropic Claude Vision
        if ai_vision_service.anthropic_client:
            try:
                anthropic_titles = await ai_vision_service._detect_titles_with_anthropic(base64_image)
                detected_titles.extend(anthropic_titles)
                logger.info(f"Anthropic detected {len(anthropic_titles)} titles")
            except Exception as e:
                logger.error(f"Anthropic processing failed: {e}")
                processing_errors.append(f"Anthropic: {str(e)}")
        else:
            processing_errors.append("Anthropic: API key not configured")
        
        # Try Google Vision as fallback if Anthropic failed or found no titles
        if (not detected_titles or len(detected_titles) < 3) and ai_vision_service.google_vision_api_key:
            try:
                google_titles = await ai_vision_service._detect_titles_with_google_vision(base64_image)
                detected_titles.extend(google_titles)
                logger.info(f"Google Vision detected {len(google_titles)} titles")
            except Exception as e:
                logger.error(f"Google Vision processing failed: {e}", exc_info=True)
                processing_errors.append(f"Google Vision: {str(e)}")
        elif not ai_vision_service.google_vision_api_key:
            processing_errors.append("Google Vision: API key not configured")

        # Remove duplicates
        unique_titles = ai_vision_service._remove_duplicate_titles(detected_titles)
        
        # Convert to storage format
        titles_data = [title.to_dict() for title in unique_titles]
        
        # Determine status and message
        processing_status_str = "pending"
        if unique_titles:
            processing_status_str = "completed"
            message = f"Successfully detected {len(unique_titles)} movie titles"
        else:
            processing_status_str = "failed"
            if processing_errors:
                message = f"AI vision processing failed: {'; '.join(processing_errors)}"
            else:
                message = "No movie titles could be detected in the image"
        
        result = {
            "status": processing_status_str,
            "detected_titles": titles_data,
            "total_titles": len(unique_titles),
            "processing_errors": processing_errors,
            "message": message
        }
        
        logger.info(f"Direct image processing completed: {len(unique_titles)} titles detected")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Direct image processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image processing failed: {str(e)}"
        )