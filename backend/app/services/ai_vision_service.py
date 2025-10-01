import asyncio
import base64
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import httpx
import os
import re

from ..core.database import db
from ..core.config import settings
from ..models.photo import ProcessingStatus
from ..services.external_api_gateway import ExternalAPIGateway
from bson import ObjectId
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class DetectedTitle:
    """Detected movie title with confidence score"""
    def __init__(self, title: str, confidence: float, source: str = "unknown"):
        self.title = title
        self.confidence = confidence
        self.source = source
        self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "title": self.title,
            "confidence": self.confidence,
            "source": self.source,
            "metadata": self.metadata
        }

class AIVisionService:
    """AI Vision service for detecting movie titles from photos"""
    
    def __init__(self):
        self.anthropic_client = None
        self.google_vision_api_key = None
        self.external_api_gateway = ExternalAPIGateway()
        self._load_google_vision_api_key()

    def _load_google_vision_api_key(self):
        """Load Google Vision API key from environment variables"""
        self.google_vision_api_key =settings.GOOGLE_VISION_API_KEY or os.getenv("GOOGLE_CLOUD_VISION_API_KEY")
        print(settings.GOOGLE_VISION_API_KEY ,os.getenv("GOOGLE_CLOUD_VISION_API_KEY"))
        if self.google_vision_api_key:
            logger.info("Google Vision API key loaded successfully")
        else:
            logger.warning("Google Vision API key not found in environment variables")
    
    def _initialize_clients(self):
        """Initialize AI service clients"""
        # This method can be used for other client initializations if needed
        pass
    
    async def _image_to_base64(self, image_path: str) -> str:
        """Convert image file to base64 string"""
        try:
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
                base64_string = base64.b64encode(image_data).decode('utf-8')
                return base64_string
        except Exception as e:
            logger.error(f"Failed to convert image to base64: {e}")
            raise
    
    async def _detect_titles_with_anthropic(self, base64_image: str) -> List[DetectedTitle]:
        """Use Anthropic Claude Vision to detect movie titles"""
        if not self.external_api_gateway.anthropic_client:
            logger.warning("Anthropic client not initialized in gateway, skipping detection.")
            return []

        logger.info("Starting title detection with Anthropic Claude Vision API via gateway.")
        
        prompt = """You are analyzing an image of DVD/Blu-ray movie cases stacked on top of each other. Your task is to extract ALL visible movie titles from the spines of these cases.

INSTRUCTIONS:
1. Examine the image systematically from top to bottom
2. Look at each individual spine/case in the stack
3. Read the text on each spine, focusing on the main movie title
4. Include titles even if partially obscured or at angles
5. Ignore non-title text like "Blu-ray", "DVD", "4K Ultra HD", studio names, ratings, etc.
6. Focus only on the actual movie titles

IMPORTANT GUIDELINES:
- Look for text that appears to be movie titles (usually the largest/most prominent text on each spine)
- Include titles with different text orientations (some spines may have vertical text)
- Don't skip cases that are partially visible or at the edges
- If you can see part of a title, include your best interpretation
- Extract ONLY what you can actually see in the image - do not make assumptions
- Be accurate and only include titles that are clearly visible

Return ONLY a JSON array of movie titles that you can actually see in the image, like this:
["TITLE 1", "TITLE 2", "TITLE 3", ...]

Do not include any other text, explanations, or formatting - just the JSON array of movie titles that are actually visible in the image."""
        
        try:
            response = await self.external_api_gateway.call_anthropic_vision_api(base64_image, prompt)
            
            if not response:
                logger.warning("No response from Anthropic API via gateway.")
                return []

            # The response from the gateway is a dict, not a message object
            content_block = response.get('content', [])
            if not content_block:
                logger.warning("No content in response from Anthropic Claude Vision API.")
                return []

            content = content_block.get('text', '')
            
            if not content:
                logger.warning("No content in response from Anthropic Claude Vision API.")
                return []
            
            logger.info(f"Anthropic Claude Vision API response received: {content[:200]}...")
            
            try:
                json_match = re.search(r'\[[\s\S]*\]', content)
                if not json_match:
                    logger.warning("No JSON array found in the Anthropic response.")
                    return []
                
                json_content = json_match.group(0)
                titles_list = json.loads(json_content)
                
                if not isinstance(titles_list, list):
                    logger.warning(f"Expected a list from JSON, but got {type(titles_list)}.")
                    return []

                detected_titles = []
                for title in titles_list:
                    if isinstance(title, str) and title.strip():
                        cleaned_title = self._clean_detected_text(title.strip())
                        if self._is_valid_movie_title(cleaned_title):
                            detected_titles.append(
                                DetectedTitle(
                                    title=cleaned_title,
                                    confidence=0.95,
                                    source="anthropic"
                                )
                            )
                
                logger.info(f"Successfully parsed {len(detected_titles)} titles from Anthropic JSON response.")
                return detected_titles
                    
            except json.JSONDecodeError:
                logger.error("Failed to decode JSON from Anthropic response.", exc_info=True)
                # Fallback to text extraction can be implemented here if needed
                return []
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Anthropic API request failed with status {e.response.status_code}: {e.response.text}", exc_info=True)
            return []
        except Exception as e:
            logger.error(f"An unexpected error occurred during Anthropic API call: {e}", exc_info=True)
            return []
    
    async def _detect_titles_with_google_vision(self, base64_image: str) -> List[DetectedTitle]:
        """Use Google Cloud Vision API to detect movie titles"""
        if not self.google_vision_api_key:
            raise Exception("Google Vision API key not configured")
        
        try:
            logger.info("Using Google Cloud Vision API to analyze image...")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://vision.googleapis.com/v1/images:annotate?key={self.google_vision_api_key}",
                    headers={"Content-Type": "application/json"},
                    json = {
                        "requests": [
                            {
                                "image": {
                                    "content": base64_image  # must be a raw base64 string, no data URI prefix
                                },
                                "features": [
                                    {"type": "TEXT_DETECTION"}
                                ]
                            }
                        ]
                    }
                )
            
            if not response.is_success:
                error_text = response.text
                logger.error(f"Google Vision API HTTP error: {response.status_code} - {error_text}")
                if response.status_code == 400:
                    raise Exception(f"Invalid Google Cloud Vision API request: {error_text}")
                elif response.status_code == 403:
                    raise Exception(f"Google Cloud Vision API access denied: {error_text}")
                elif response.status_code == 429:
                    raise Exception(f"Google Cloud Vision API rate limit exceeded: {error_text}")
                else:
                    raise Exception(f"Google Cloud Vision API error: {response.status_code} - {error_text}")
            
            data = response.json()
            # Log the entire raw JSON response for debugging
            logger.info(f"Google Vision API raw response: {json.dumps(data, indent=2)}")
            
            if not data.get("responses"):
                logger.warning("No 'responses' key in Google Cloud Vision API response")
                return []
            
            if not data["responses"]:
                logger.warning("Empty responses array from Google Cloud Vision API")
                return []
            
            if not data["responses"]:
                logger.warning("First response is empty from Google Cloud Vision API")
                return []
            
            response_data = data["responses"]
            logger.info(f"Processing response data: {json.dumps(response_data, indent=2)}")
            
            if response_data.get("error"):
                raise Exception(f"Google Vision API error: {response_data['error']['message']}")
            
            # Extract text from full text annotation
            text_annotations = response_data.get("textAnnotations", [])
            
            if not text_annotations:
                logger.warning("No text detected by Google Vision")
                return []
            
            logger.info(f"Google Vision found {len(text_annotations)} text annotations")
            
            # The first annotation is the full text, subsequent are individual words/phrases
            # We can grab all the text descriptions and join them.
            detected_text = " ".join([anno["description"] for anno in text_annotations if "description" in anno])
            
            logger.info(f"Google Vision detected text: '{detected_text}'")
            
            if not detected_text:
                logger.warning("No text descriptions found in Google Vision response")
                return []

            # Process the full text to extract movie titles
            detected_titles = self._extract_movie_titles_from_text(detected_text, "google_vision")
            
            logger.info(f"Google Vision detected {len(detected_titles)} titles: {[t.title for t in detected_titles]}")
            return detected_titles
            
        except Exception as e:
            logger.error(f"Google Cloud Vision API error: {e}", exc_info=True)
            raise
    
    def _extract_movie_titles_from_text(self, ocr_text: str, source: str) -> List[DetectedTitle]:
        """Extract movie titles from OCR text"""
        if not ocr_text:
            return []
        
        # Define stopwords to filter out - reduced to only the most obvious non-title words
        stopwords = {
            "UHD", "BLU-RAY", "BLURAY", "4K", "DISC", "STEELBOOK",
            "DVD", "DIGITAL", "COPY", "HD", "RATED", "UNRATED",
            "PG", "PG-13", "R", "NC-17", "G"
        }
        
        lines = ocr_text.split('\n')
        potential_titles = []
        
        for line in lines:
            line = line.strip()
            if len(line) < 2:
                continue
            if re.match(r'^\d+$', line):  # Skip pure numbers
                continue
            if re.match(r'^[A-Z]$', line):  # Skip single letters
                continue
            if re.match(r'^P\d+', line):  # Skip product codes
                continue
            
            # Clean the line
            cleaned = re.sub(r'[^\w\s&:\'-.,()]', ' ', line)
            cleaned = re.sub(r'\s+', ' ', cleaned).strip()
            
            if len(cleaned) < 3:
                continue
            
            # Filter out stopwords
            words = cleaned.split()
            meaningful_words = [
                word for word in words
                if len(word) > 1 and not re.match(r'^\d+$', word) and word.upper() not in stopwords
            ]
            
            if meaningful_words:
                title = ' '.join(meaningful_words).strip()
                if 3 <= len(title) <= 60:
                    cleaned_title = self._clean_detected_text(title)
                    if self._is_valid_movie_title(cleaned_title):
                        potential_titles.append(cleaned_title)
        
        # Remove duplicates and create DetectedTitle objects
        unique_titles = list(set(potential_titles))
        detected_titles = []
        
        for title in unique_titles:
            detected_titles.append(
                DetectedTitle(
                    title=title,
                    confidence=0.90,
                    source=source
                )
            )
        
        return detected_titles
    
    def _clean_detected_text(self, text: str) -> str:
        """Clean detected text to extract movie title"""
        if not text:
            return ""
        
        # Remove extra whitespace and normalize
        cleaned = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common prefixes/suffixes
        cleaned = re.sub(r'^(THE\s+)?', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s+(DVD|BLU-?RAY|4K|UHD)$', '', cleaned, flags=re.IGNORECASE)
        
        # Title case
        cleaned = cleaned.title()
        
        return cleaned.strip()
    
    def _is_valid_movie_title(self, title: str) -> bool:
        """Validate if text looks like a movie title"""
        if not title or len(title) < 2:
            return False
        
        # Skip obvious non-titles
        title_upper = title.upper()
        invalid_patterns = [
            r'^(ICON|DRIVE)$',  # Single words that might not be movies
            r'CTURES$',  # Fragment of "PICTURES"
            r'^\d+$',  # Pure numbers
            r'^[A-Z]$'  # Single letters
        ]
        
        for pattern in invalid_patterns:
            if re.match(pattern, title_upper):
                return False
        
        return True
    
    def _remove_duplicate_titles(self, titles: List[DetectedTitle]) -> List[DetectedTitle]:
        """Remove duplicate titles based on similarity"""
        if not titles:
            return []
        
        unique_titles = []
        processed_titles = set()
        
        for title in titles:
            title_lower = title.title.lower()
            
            # Check for exact duplicates
            if title_lower in processed_titles:
                continue
            
            # Check for similar titles (basic similarity)
            is_duplicate = False
            for existing in unique_titles:
                if self._calculate_similarity(title.title, existing.title) > 0.8:
                    # Keep the one with higher confidence
                    if title.confidence > existing.confidence:
                        unique_titles.remove(existing)
                        unique_titles.append(title)
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_titles.append(title)
                processed_titles.add(title_lower)
        
        return unique_titles
    
    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings"""
        str1_lower = str1.lower()
        str2_lower = str2.lower()
        
        if str1_lower == str2_lower:
            return 1.0
        
        # Simple similarity based on common words
        words1 = set(str1_lower.split())
        words2 = set(str2_lower.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    async def process_photo_ai_vision(self, photo_id: str, user_id: str) -> Dict[str, Any]:
        """Process a photo with AI vision to detect movie titles"""
        if not db.database:
            raise Exception("Database connection unavailable")
        
        try:
            # Get photo from database
            photo_doc = await db.database.photos.find_one({
                "_id": ObjectId(photo_id),
                "user_id": ObjectId(user_id)
            })
            
            if not photo_doc:
                raise Exception("Photo not found")
            
            # Update status to processing
            await db.database.photos.update_one(
                {"_id": ObjectId(photo_id)},
                {"$set": {"processing_status": ProcessingStatus.PROCESSING}}
            )
            
            # Get image file path
            filename = photo_doc["filename"]
            storage_path = os.getenv("STORAGE_PATH", "./uploads")
            image_path = os.path.join(storage_path, "photos", user_id, filename)
            
            if not os.path.exists(image_path):
                raise Exception(f"Image file not found: {image_path}")
            
            # Convert image to base64
            base64_image = await self._image_to_base64(image_path)
            
            # Try Anthropic first, then Google Vision as fallback
            detected_titles = []
            processing_errors = []
            
            # Check if any AI service is available
            if not self.external_api_gateway.anthropic_client and not self.google_vision_api_key:
                error_msg = "No AI vision services are configured. Please set up either ANTHROPIC_API_KEY or GOOGLE_CLOUD_VISION_API_KEY."
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Try Anthropic Claude Vision
            if self.external_api_gateway.anthropic_client:
                try:
                    anthropic_titles = await self._detect_titles_with_anthropic(base64_image)
                    detected_titles.extend(anthropic_titles)
                    logger.info(f"Anthropic detected {len(anthropic_titles)} titles")
                except Exception as e:
                    logger.error(f"Anthropic processing failed: {e}")
                    processing_errors.append(f"Anthropic: {str(e)}")
            else:
                processing_errors.append("Anthropic: API key not configured")
            
            # Try Google Vision as fallback if Anthropic failed or found no titles
            if (not detected_titles or len(detected_titles) < 3) and self.google_vision_api_key:
                try:
                    google_titles = await self._detect_titles_with_google_vision(base64_image)
                    detected_titles.extend(google_titles)
                    logger.info(f"Google Vision detected {len(google_titles)} titles")
                except Exception as e:
                    logger.error(f"Google Vision processing failed: {e}")
                    processing_errors.append(f"Google Vision: {str(e)}")
            elif not self.google_vision_api_key:
                processing_errors.append("Google Vision: API key not configured")
            
            # Remove duplicates
            unique_titles = self._remove_duplicate_titles(detected_titles)
            
            # Convert to storage format
            titles_data = [title.to_dict() for title in unique_titles]
            
            # Determine status and message
            if unique_titles:
                status = "completed"
                message = f"Successfully detected {len(unique_titles)} movie titles"
            else:
                status = "failed"
                if processing_errors:
                    message = f"AI vision processing failed: {'; '.join(processing_errors)}"
                else:
                    message = "No movie titles could be detected in the image"
            
            # Update photo with results
            update_data = {
                "processing_status": ProcessingStatus.COMPLETED if unique_titles else ProcessingStatus.FAILED,
                "detected_titles": titles_data
            }
            
            await db.database.photos.update_one(
                {"_id": ObjectId(photo_id)},
                {"$set": update_data}
            )
            
            result = {
                "photo_id": photo_id,
                "status": status,
                "detected_titles": titles_data,
                "total_titles": len(unique_titles),
                "processing_errors": processing_errors,
                "message": message
            }
            
            logger.info(f"AI vision processing completed for photo {photo_id}: {len(unique_titles)} titles detected")
            return result
            
        except Exception as e:
            logger.error(f"AI vision processing failed for photo {photo_id}: {e}")
            
            # Update status to failed
            if db.database:
                await db.database.photos.update_one(
                    {"_id": ObjectId(photo_id)},
                    {"$set": {"processing_status": ProcessingStatus.FAILED}}
                )
            
            # Return error details instead of just raising
            return {
                "photo_id": photo_id,
                "status": "failed",
                "detected_titles": [],
                "total_titles": 0,
                "processing_errors": [str(e)],
                "message": f"Processing failed: {str(e)}"
            }
def get_vision_service() -> 'AIVisionService':
    """
    Returns an instance of the AI Vision Service with both Google Vision and Anthropic enabled.
    """
    service = AIVisionService()
    logger.info("AI Vision service initialized with available clients.")
    return service

# Global instance
ai_vision_service = get_vision_service()