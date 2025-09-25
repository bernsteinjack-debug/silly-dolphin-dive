import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings


class FileStorageService:
    """Service for handling file storage operations"""
    
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.photos_dir = self.upload_dir / "photos"
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure upload directories exist"""
        self.photos_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file"""
        # Check file type
        if file.content_type not in settings.allowed_file_types:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(settings.allowed_file_types)}"
            )
        
        # Check file size (this is approximate, actual size check happens during upload)
        if hasattr(file, 'size') and file.size and file.size > settings.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"File size {file.size} exceeds maximum allowed size of {settings.max_file_size} bytes"
            )
    
    def generate_unique_filename(self, original_filename: str) -> str:
        """Generate a unique filename while preserving extension"""
        file_extension = Path(original_filename).suffix.lower()
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{file_extension}"
    
    async def save_photo(self, file: UploadFile, user_id: str) -> tuple[str, str]:
        """
        Save uploaded photo file
        Returns: (filename, file_path)
        """
        self.validate_file(file)
        
        # Generate unique filename
        unique_filename = self.generate_unique_filename(file.filename)
        
        # Create user-specific directory
        user_photos_dir = self.photos_dir / user_id
        user_photos_dir.mkdir(exist_ok=True)
        
        # Full file path
        file_path = user_photos_dir / unique_filename
        
        # Save file
        try:
            content = await file.read()
            
            # Check actual file size
            if len(content) > settings.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File size {len(content)} exceeds maximum allowed size of {settings.max_file_size} bytes"
                )
            
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            return unique_filename, str(file_path)
            
        except Exception as e:
            # Clean up file if it was partially created
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    def delete_photo(self, filename: str, user_id: str) -> bool:
        """Delete a photo file"""
        file_path = self.photos_dir / user_id / filename
        
        try:
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception:
            return False
    
    def get_photo_url(self, filename: str, user_id: str) -> str:
        """Generate URL for accessing photo"""
        return f"/uploads/photos/{user_id}/{filename}"
    
    def get_photo_path(self, filename: str, user_id: str) -> Path:
        """Get full path to photo file"""
        return self.photos_dir / user_id / filename


# Global instance
file_storage = FileStorageService()