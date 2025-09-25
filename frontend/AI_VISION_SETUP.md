# AI Vision Setup Guide

This application uses Anthropic Claude Vision for automatically identifying movie titles from shelf images.

## Demo Mode (No API Key Required)
The application works out of the box with demo data! When no API key is provided, it will show sample movie titles that demonstrate the metadata enrichment and poster display functionality.

## Production Mode with Anthropic Claude Vision
For real image processing, you can set up Claude Vision:

### Setup:
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Create a `.env` file in the frontend directory
3. Add your API key:
   ```
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

### Pricing:
- Claude 3.5 Sonnet: $3 per million input tokens, $15 per million output tokens
- Images are typically ~1,000-2,000 tokens depending on size and detail
- Very cost-effective for occasional use

## How It Works
- **With API Key**: Claude analyzes your actual images and identifies movie titles
- **Without API Key**: Shows demo movie titles to demonstrate the app functionality
- **Metadata Enrichment**: All titles (real or demo) are automatically enriched with metadata from the built-in movie database

## Security Note
⚠️ **Important**: The API key is exposed in the browser since this is a frontend-only application. For production use, you should:
- Move AI processing to a backend server
- Never expose API keys in client-side code
- Use environment variables only for development/demo purposes

## Example .env file:
```
# Optional - app works without this for demo purposes
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Usage
1. **Demo Mode**: Just use the app! Upload any image and it will show sample movie titles
2. **Production Mode**: Add your API key to `.env` file for real image processing
3. Take a photo or upload an image of your movie shelf
4. Review and edit any titles as needed before adding to your catalog
5. Enjoy your digital movie catalog with rich metadata and poster images!

## Features
- ✅ Works immediately without setup (demo mode)
- ✅ Real AI vision when API key is provided
- ✅ Automatic metadata enrichment
- ✅ Movie poster display with elegant fallbacks
- ✅ Rich movie information (year, genre, director, ratings, etc.)