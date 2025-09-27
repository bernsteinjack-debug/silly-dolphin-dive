import os
from typing import Optional, List
from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "Snap Your Shelf API"
    app_env: str = "development"
    port: int = 8000
    
    # MongoDB
    mongodb_uri: Optional[str] = None
    
    # JWT
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_expires_in: int = 86400  # 24 hours in seconds
    
    # CORS
    cors_origins: str = "http://localhost:5137"
    
    # File Storage
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB in bytes
    allowed_file_types: List[str] = ["image/jpeg", "image/png", "image/webp"]

    # Google Vision API
    GOOGLE_VISION_API_KEY: Optional[str] = None
    
    def __init__(self, **kwargs):
        # Load from environment variables
        env_values = {
            'app_name': os.getenv('APP_NAME', 'Snap Your Shelf API'),
            'app_env': os.getenv('APP_ENV', 'development'),
            'port': int(os.getenv('PORT', '8000')),
            'mongodb_uri': 'mongodb://localhost:27017/silly-dolphin-dive',
            'jwt_secret': os.getenv('JWT_SECRET', 'your-secret-key-change-in-production'),
            'jwt_expires_in': int(os.getenv('JWT_EXPIRES_IN', '86400')),
            'cors_origins': os.getenv('CORS_ORIGINS', 'http://localhost:5137'),
            'GOOGLE_VISION_API_KEY': os.getenv('GOOGLE_VISION_API_KEY'),
        }
        env_values.update(kwargs)
        super().__init__(**env_values)


settings = Settings()