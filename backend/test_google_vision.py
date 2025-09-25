#!/usr/bin/env python3
"""
Test script for Google Vision API functionality
Tests both TEXT_DETECTION and DOCUMENT_TEXT_DETECTION with a sample image
"""

import asyncio
import base64
import json
import os
import sys
from typing import Dict, Any
import httpx
from PIL import Image, ImageDraw, ImageFont

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

async def create_test_image() -> str:
    """Create a simple test image with movie titles"""
    # Create a test image with movie spine-like text
    img = Image.new('RGB', (400, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
        small_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
    except:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw movie spine-like rectangles and text
    movies = [
        ("THE MATRIX", "black"),
        ("INCEPTION", "blue"),
        ("INTERSTELLAR", "darkgreen"),
        ("BLADE RUNNER", "red"),
        ("AVATAR", "purple")
    ]
    
    y_pos = 50
    for movie, color in movies:
        # Draw spine background
        draw.rectangle([50, y_pos, 350, y_pos + 80], fill=color, outline="black", width=2)
        
        # Draw movie title
        draw.text((60, y_pos + 25), movie, fill="white", font=font)
        
        # Add some typical spine text
        draw.text((60, y_pos + 55), "BLU-RAY", fill="lightgray", font=small_font)
        
        y_pos += 100
    
    # Save the test image
    test_image_path = "test_movie_spines.jpg"
    img.save(test_image_path, "JPEG")
    print(f"Created test image: {test_image_path}")
    
    return test_image_path

async def image_to_base64(image_path: str) -> str:
    """Convert image to base64"""
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
        base64_string = base64.b64encode(image_data).decode('utf-8')
        return base64_string

async def test_google_vision_api(api_key: str, base64_image: str, detection_type: str) -> Dict[str, Any]:
    """Test Google Vision API with specified detection type"""
    print(f"\n=== Testing Google Vision API with {detection_type} ===")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://vision.googleapis.com/v1/images:annotate?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "requests": [
                        {
                            "image": {"content": base64_image},
                            "features": [
                                {
                                    "type": detection_type,
                                    "maxResults": 50
                                }
                            ],
                            "imageContext": {
                                "languageHints": ["en"],
                                "textDetectionParams": {
                                    "enableTextDetectionConfidenceScore": True
                                }
                            }
                        }
                    ]
                }
            )
        
        print(f"Status Code: {response.status_code}")
        
        if not response.is_success:
            error_text = response.text
            print(f"Error Response: {error_text}")
            
            if response.status_code == 400:
                return {"error": "Invalid Google Cloud Vision API request", "details": error_text}
            elif response.status_code == 403:
                return {"error": "Google Cloud Vision API access denied - check API key permissions", "details": error_text}
            elif response.status_code == 429:
                return {"error": "Google Cloud Vision API rate limit exceeded", "details": error_text}
            else:
                return {"error": f"Google Cloud Vision API error: {response.status_code}", "details": error_text}
        
        data = response.json()
        print(f"Response received successfully")
        
        if not data.get("responses") or not data["responses"][0]:
            return {"error": "No response from Google Cloud Vision API", "data": data}
        
        response_data = data["responses"][0]
        
        if response_data.get("error"):
            return {"error": f"Google Vision API error: {response_data['error']['message']}", "data": response_data}
        
        # Analyze the response
        result = {
            "detection_type": detection_type,
            "success": True,
            "raw_response": response_data
        }
        
        # Extract text annotations
        if "textAnnotations" in response_data:
            text_annotations = response_data["textAnnotations"]
            result["text_annotations_count"] = len(text_annotations)
            
            if text_annotations:
                # First annotation is usually the full text
                result["full_text"] = text_annotations[0].get("description", "")
                
                # Individual text blocks
                result["individual_texts"] = []
                for i, annotation in enumerate(text_annotations[1:], 1):  # Skip first one
                    text_info = {
                        "text": annotation.get("description", ""),
                        "confidence": annotation.get("confidence", 0),
                        "bounding_box": annotation.get("boundingPoly", {})
                    }
                    result["individual_texts"].append(text_info)
        
        # Extract full text annotation (for DOCUMENT_TEXT_DETECTION)
        if "fullTextAnnotation" in response_data:
            full_text_annotation = response_data["fullTextAnnotation"]
            result["full_text_annotation"] = {
                "text": full_text_annotation.get("text", ""),
                "pages_count": len(full_text_annotation.get("pages", [])),
                "blocks_count": sum(len(page.get("blocks", [])) for page in full_text_annotation.get("pages", [])),
                "paragraphs_count": sum(
                    len(block.get("paragraphs", []))
                    for page in full_text_annotation.get("pages", [])
                    for block in page.get("blocks", [])
                ),
                "words_count": sum(
                    len(paragraph.get("words", []))
                    for page in full_text_annotation.get("pages", [])
                    for block in page.get("blocks", [])
                    for paragraph in block.get("paragraphs", [])
                )
            }
        
        return result
        
    except Exception as e:
        return {"error": f"Exception during API call: {str(e)}", "exception_type": type(e).__name__}

async def analyze_movie_title_detection(result: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze how well the API detected movie titles"""
    expected_titles = ["THE MATRIX", "INCEPTION", "INTERSTELLAR", "BLADE RUNNER", "AVATAR"]
    
    analysis = {
        "expected_titles": expected_titles,
        "detected_titles": [],
        "accuracy_score": 0.0,
        "missing_titles": [],
        "extra_detections": []
    }
    
    if result.get("success"):
        # Extract all detected text
        all_detected_text = []
        
        if "full_text" in result:
            all_detected_text.extend(result["full_text"].split('\n'))
        
        if "individual_texts" in result:
            all_detected_text.extend([item["text"] for item in result["individual_texts"]])
        
        if "full_text_annotation" in result:
            all_detected_text.extend(result["full_text_annotation"]["text"].split('\n'))
        
        # Clean and normalize detected text
        cleaned_detections = []
        for text in all_detected_text:
            cleaned = text.strip().upper()
            if len(cleaned) > 2 and cleaned not in ["BLU-RAY", "DVD", "4K"]:
                cleaned_detections.append(cleaned)
        
        # Check which expected titles were found
        found_titles = []
        for expected in expected_titles:
            for detected in cleaned_detections:
                if expected in detected or detected in expected:
                    found_titles.append(expected)
                    break
        
        analysis["detected_titles"] = found_titles
        analysis["accuracy_score"] = len(found_titles) / len(expected_titles)
        analysis["missing_titles"] = [title for title in expected_titles if title not in found_titles]
        analysis["all_detected_text"] = list(set(cleaned_detections))
    
    return analysis

async def main():
    """Main test function"""
    print("=== Google Vision API Test Suite ===")
    
    # Load API key from environment
    api_key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_CLOUD_VISION_API_KEY not found in environment")
        return
    
    print(f"API Key configured: {api_key[:10]}...{api_key[-4:]}")
    
    # Create test image
    test_image_path = await create_test_image()
    
    # Convert to base64
    base64_image = await image_to_base64(test_image_path)
    print(f"Image converted to base64 ({len(base64_image)} characters)")
    
    # Test both detection types
    detection_types = ["TEXT_DETECTION", "DOCUMENT_TEXT_DETECTION"]
    results = {}
    
    for detection_type in detection_types:
        result = await test_google_vision_api(api_key, base64_image, detection_type)
        results[detection_type] = result
        
        # Print summary
        if result.get("success"):
            print(f"✅ {detection_type}: SUCCESS")
            if "text_annotations_count" in result:
                print(f"   Text annotations: {result['text_annotations_count']}")
            if "full_text" in result:
                print(f"   Full text length: {len(result['full_text'])} characters")
            if "full_text_annotation" in result:
                fta = result["full_text_annotation"]
                print(f"   Document structure: {fta['pages_count']} pages, {fta['blocks_count']} blocks, {fta['words_count']} words")
        else:
            print(f"❌ {detection_type}: FAILED")
            print(f"   Error: {result.get('error', 'Unknown error')}")
        
        # Analyze movie title detection
        analysis = await analyze_movie_title_detection(result)
        print(f"   Movie title accuracy: {analysis['accuracy_score']:.1%}")
        print(f"   Detected titles: {analysis['detected_titles']}")
        if analysis['missing_titles']:
            print(f"   Missing titles: {analysis['missing_titles']}")
        
        results[f"{detection_type}_analysis"] = analysis
    
    # Compare the two methods
    print("\n=== COMPARISON ===")
    text_detection_accuracy = results.get("TEXT_DETECTION_analysis", {}).get("accuracy_score", 0)
    document_detection_accuracy = results.get("DOCUMENT_TEXT_DETECTION_analysis", {}).get("accuracy_score", 0)
    
    print(f"TEXT_DETECTION accuracy: {text_detection_accuracy:.1%}")
    print(f"DOCUMENT_TEXT_DETECTION accuracy: {document_detection_accuracy:.1%}")
    
    if document_detection_accuracy > text_detection_accuracy:
        print("🏆 DOCUMENT_TEXT_DETECTION performed better")
    elif text_detection_accuracy > document_detection_accuracy:
        print("🏆 TEXT_DETECTION performed better")
    else:
        print("🤝 Both methods performed equally")
    
    # Save detailed results
    with open("google_vision_test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nDetailed results saved to: google_vision_test_results.json")
    
    # Cleanup
    if os.path.exists(test_image_path):
        os.remove(test_image_path)
        print(f"Cleaned up test image: {test_image_path}")

if __name__ == "__main__":
    asyncio.run(main())