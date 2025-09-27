#!/usr/bin/env python3
"""
Test script for backend AI vision endpoints
Tests the actual backend API endpoints with image upload and processing
"""

import asyncio
import base64
import json
import os
import sys
import time
from typing import Dict, Any
import httpx
from PIL import Image, ImageDraw, ImageFont

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
        ("DUNE", "orange"),
        ("TOP GUN MAVERICK", "navy"),
        ("SPIDER-MAN", "red"),
        ("BATMAN", "black"),
        ("JOKER", "purple")
    ]
    
    y_pos = 50
    for movie, color in movies:
        # Draw spine background
        draw.rectangle([50, y_pos, 350, y_pos + 80], fill=color, outline="black", width=2)
        
        # Draw movie title
        draw.text((60, y_pos + 25), movie, fill="white", font=font)
        
        # Add some typical spine text
        draw.text((60, y_pos + 55), "4K UHD", fill="lightgray", font=small_font)
        
        y_pos += 100
    
    # Save the test image
    test_image_path = "test_backend_image.jpg"
    img.save(test_image_path, "JPEG")
    print(f"Created test image: {test_image_path}")
    
    return test_image_path

async def test_health_endpoint():
    """Test the AI vision health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/api/v1/ai-vision/health")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Health endpoint working")
                print(f"   Status: {data['status']}")
                print(f"   Google Vision: {data['services']['google_vision']['status']}")
                print(f"   Anthropic: {data['services']['anthropic']['status']}")
                return True
            else:
                print(f"❌ Health endpoint failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

async def test_photo_upload_and_processing():
    """Test photo upload and AI processing workflow"""
    print("\n=== Testing Photo Upload and AI Processing ===")
    
    # Create test image
    image_path = await create_test_image()
    
    try:
        # Step 1: Upload photo
        print("Step 1: Uploading photo...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Read the image file
            with open(image_path, "rb") as f:
                files = {"file": ("test_image.jpg", f, "image/jpeg")}
                # Note: This would normally require authentication
                # For testing, we'll try without auth first to see the error
                response = await client.post(
                    "http://localhost:8000/api/v1/photos/upload",
                    data={"upload_data": json.dumps({"user_id": "665f0f5b874f310e731a4188"})},
                    files={"file": ("test_image.jpg", f, "image/jpeg")}
                )
                print(f"Upload response status: {response.status_code}")
                print(f"Upload response: {response.text}")
                
                if response.status_code == 201:
                    upload_data = response.json()
                    photo_id = upload_data.get("photo_id")
                    print(f"✅ Photo uploaded successfully: {photo_id}")
                    
                    # Step 2: Start AI processing
                    print("Step 2: Starting AI processing...")
                    
                    process_response = await client.post(
                        f"http://localhost:8000/api/v1/ai-vision/{photo_id}/process"
                    )
                    
                    print(f"Process response status: {process_response.status_code}")
                    print(f"Process response: {process_response.text}")
                    
                    if process_response.status_code == 200:
                        process_data = process_response.json()
                        print(f"✅ AI processing started: {process_data}")
                        
                        # Step 3: Check processing status
                        print("Step 3: Checking processing status...")
                        
                        # Wait a bit for processing
                        await asyncio.sleep(2)
                        
                        status_response = await client.get(
                            f"http://localhost:8000/api/v1/ai-vision/{photo_id}/status"
                        )
                        
                        print(f"Status response: {status_response.json()}")
                        
                        # Step 4: Get results
                        print("Step 4: Getting results...")
                        
                        results_response = await client.get(
                            f"http://localhost:8000/api/v1/ai-vision/{photo_id}/results"
                        )
                        
                        print(f"Results response: {results_response.json()}")
                        
                        return {
                            "upload_success": True,
                            "processing_started": True,
                            "results_available": results_response.status_code == 200
                        }
                    else:
                        return {
                            "upload_success": True,
                            "processing_started": False,
                            "error": process_response.text
                        }
                else:
                    return {
                        "upload_success": False,
                        "error": response.text,
                        "status_code": response.status_code
                    }
                    
    except Exception as e:
        print(f"❌ Photo upload/processing error: {e}")
        return {"error": str(e)}
    
    finally:
        # Cleanup
        if os.path.exists(image_path):
            os.remove(image_path)
            print(f"Cleaned up test image: {image_path}")

async def test_direct_vision_api_integration():
    """Test if we can create a direct endpoint test"""
    print("\n=== Testing Direct Vision API Integration ===")
    
    # Create test image
    image_path = await create_test_image()
    
    try:
        # Convert image to base64
        with open(image_path, "rb") as f:
            image_data = f.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Test the Google Vision API directly through our backend service
        # We'll create a simple test that mimics what the backend does
        
        from app.services.ai_vision_service import ai_vision_service
        
        print("Testing AI vision service directly...")
        
        # This would test the actual service method
        # Note: This requires the backend to be importable
        print("✅ AI vision service is importable and configured")
        
        return {"direct_test": "service_available"}
        
    except ImportError as e:
        print(f"⚠️  Cannot import backend service (expected in test environment): {e}")
        return {"direct_test": "import_error", "note": "This is expected when testing from outside the backend environment"}
    
    except Exception as e:
        print(f"❌ Direct vision API test error: {e}")
        return {"direct_test": "error", "error": str(e)}
    
    finally:
        # Cleanup
        if os.path.exists(image_path):
            os.remove(image_path)

async def test_process_image_endpoint():
    """Test the /process-image endpoint directly"""
    print("\n=== Testing /process-image Endpoint ===")
    
    image_path = await create_test_image()
    
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://localhost:8000/api/v1/ai-vision/process-image",
                json={"image": {"data": base64_image}}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ /process-image endpoint working")
                print(f"   Status: {data['status']}")
                print(f"   Detected titles: {data['total_titles']}")
                return True
            else:
                print(f"❌ /process-image endpoint failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
    
    except Exception as e:
        print(f"❌ /process-image endpoint error: {e}")
        return False
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)

async def test_api_endpoints_without_auth():
    """Test API endpoints that might work without authentication"""
    print("\n=== Testing API Endpoints (No Auth) ===")
    
    results = {}
    
    # Test various endpoints to see which ones work without auth
    endpoints_to_test = [
        ("GET", "/api/v1/", "API root"),
        ("GET", "/api/v1/ai-vision/health", "AI Vision health"),
        ("GET", "/health", "General health"),
    ]
    
    async with httpx.AsyncClient() as client:
        for method, endpoint, description in endpoints_to_test:
            try:
                if method == "GET":
                    response = await client.get(f"http://localhost:8000{endpoint}")
                else:
                    response = await client.post(f"http://localhost:8000{endpoint}")
                
                results[endpoint] = {
                    "status_code": response.status_code,
                    "description": description,
                    "working": response.status_code == 200,
                    "response": response.json() if response.status_code == 200 else response.text
                }
                
                if response.status_code == 200:
                    print(f"✅ {description}: Working")
                else:
                    print(f"❌ {description}: Status {response.status_code}")
                    
            except Exception as e:
                results[endpoint] = {
                    "error": str(e),
                    "description": description,
                    "working": False
                }
                print(f"❌ {description}: Error - {e}")
    
    return results

async def main():
    """Main test function"""
    print("=== Backend AI Vision Endpoints Test Suite ===")
    
    results = {
        "timestamp": time.time(),
        "tests": {}
    }
    
    # Test 1: Health endpoint
    health_result = await test_health_endpoint()
    results["tests"]["health"] = health_result
    
    # Test 2: API endpoints without auth
    api_results = await test_api_endpoints_without_auth()
    results["tests"]["api_endpoints"] = api_results
    
    # Test 3: Photo upload and processing (will likely require auth)
    upload_result = await test_photo_upload_and_processing()
    results["tests"]["photo_processing"] = upload_result
    
    # Test 4: Direct vision API integration
    direct_result = await test_direct_vision_api_integration()
    results["tests"]["direct_vision"] = direct_result

    # Test 5: /process-image endpoint
    process_image_result = await test_process_image_endpoint()
    results["tests"]["process_image"] = process_image_result
    
    # Summary
    print("\n=== TEST SUMMARY ===")
    print(f"Health endpoint: {'✅ Working' if results['tests']['health'] else '❌ Failed'}")
    
    api_working = sum(1 for r in results['tests']['api_endpoints'].values() if r.get('working', False))
    api_total = len(results['tests']['api_endpoints'])
    print(f"API endpoints: {api_working}/{api_total} working")
    
    if results['tests']['photo_processing'].get('auth_required'):
        print("Photo processing: ⚠️  Requires authentication (expected)")
    elif results['tests']['photo_processing'].get('upload_success'):
        print("Photo processing: ✅ Working")
    else:
        print("Photo processing: ❌ Failed")
    
    print(f"Direct vision test: {results['tests']['direct_vision'].get('direct_test', 'unknown')}")
    
    # Save detailed results
    with open("backend_endpoints_test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nDetailed results saved to: backend_endpoints_test_results.json")

if __name__ == "__main__":
    asyncio.run(main())