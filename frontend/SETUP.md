# Snap Your Shelf - Setup Guide

## Quick Start

This app uses OpenAI's Vision API to analyze photos of your movie collection and automatically identify movie titles. Follow these steps to get started:

### 1. Get an OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)

### 2. Configure the App

1. Create a `.env` file in the `frontend` directory:
   ```bash
   touch .env
   ```

2. Add your API key to the `.env` file:
   ```
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. Save the file and restart the development server

### 3. Start Using the App

1. Open http://localhost:3000
2. Click "Upload Image" or "Take Photo"
3. Upload a photo of your movie shelf
4. The app will automatically identify movie titles using the same AI as ChatGPT
5. Review and edit any incorrect titles
6. Your movies will be added to your digital catalog with rich metadata

## Features

- **Real AI Vision**: Uses OpenAI's GPT-4o model (same as ChatGPT) to analyze images
- **Automatic Title Detection**: Identifies movie titles from DVD/Blu-ray spines
- **Rich Metadata**: Automatically adds movie information, ratings, cast, and posters
- **Digital Catalog**: Browse your collection with detailed movie information
- **Manual Editing**: Add, edit, or remove movies manually
- **Responsive Design**: Works on desktop and mobile devices

## Troubleshooting

### "OpenAI API key not found" Error

- Make sure you created a `.env` file in the `frontend` directory
- Check that your API key is correctly formatted (starts with `sk-`)
- Restart the development server after adding the API key

### API Key Not Working

- Verify your OpenAI account has sufficient credits
- Make sure the API key has Vision API access
- Check the browser console for detailed error messages

### No Movies Detected

- Ensure the image is clear and movie titles are visible
- Try taking a photo with better lighting
- Make sure movie spines are facing the camera
- The AI works best with clearly readable text

## Cost Information

- OpenAI Vision API charges per image analyzed
- Typical cost is $0.01-0.05 per image depending on size
- You only pay for images you upload and analyze
- Check your OpenAI usage dashboard for current costs

## Privacy & Security

- Images are sent to OpenAI for analysis
- No images are stored permanently by this app
- Your movie collection data is stored locally in your browser
- API calls are made directly from your browser to OpenAI

## Need Help?

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your `.env` file is correctly configured
3. Make sure your OpenAI account is active and has credits
4. Try with a different, clearer image of your movie shelf

The app is designed to work just like ChatGPT's vision capabilities - if ChatGPT can identify titles in your image, this app should too!