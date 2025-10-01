import base64
import os
import json
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

async def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 string"""
    try:
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
            base64_string = base64.b64encode(image_data).decode('utf-8')
            return base64_string
    except Exception as e:
        print(f"Failed to convert image to base64: {e}")
        raise

async def call_google_vision_api(base64_image: str):
    """Call the Google Vision API and print the response"""
    google_api_key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY")
    if not google_api_key:
        print("Google Vision API key not configured")
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://vision.googleapis.com/v1/images:annotate?key={google_api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "requests": [
                        {
                            "image": {
                                "content": base64_image
                            },
                            "features": [
                                {"type": "TEXT_DETECTION"}
                            ]
                        }
                    ]
                }
            )

        if not response.is_success:
            print(f"Google Vision API HTTP error: {response.status_code} - {response.text}")
            return

        data = response.json()
        print(json.dumps(data, indent=2))

    except Exception as e:
        print(f"Google Cloud Vision API error: {e}")

async def main():
    """Main function to run the test"""
    image_path = "backend/Screenshot 2025-10-01 at 8.50.55 AM.png"
    base64_image = await image_to_base64(image_path)
    await call_google_vision_api(base64_image)

if __name__ == "__main__":
    asyncio.run(main())