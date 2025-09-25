# Snap Your Shelf - Movie Catalog App

A React application that uses AI vision to identify movie titles from photos of your movie collection and creates a digital catalog with rich metadata.

## Features

- 📸 **Photo Capture**: Take photos of your movie shelf
- 🤖 **AI Vision**: Automatically identify movie titles using OpenAI's Vision API
- 📚 **Rich Metadata**: Display comprehensive movie information including ratings, cast, plot, and more
- 🖼️ **Movie Posters**: Show movie poster images alongside titles
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 💾 **Local Storage**: Saves your collection locally in the browser

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OpenAI API Key

**IMPORTANT**: The app currently has a placeholder API key. To use real AI vision like ChatGPT:

1. Get your OpenAI API key:
   - Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key (requires OpenAI account with credits)
   - Copy the key

2. Replace the placeholder in the `.env` file:
   ```
   VITE_OPENAI_API_KEY=your_actual_api_key_here
   ```

3. **The app is now using GPT-4o (same as ChatGPT) for image analysis**

### 3. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## How to Use

1. **Take a Photo**: Click "Add More Movies" and take a photo of your movie shelf
2. **AI Analysis**: The app will use OpenAI Vision API to identify movie titles
3. **Review Results**: Check the identified titles and edit if needed
4. **View Catalog**: Browse your collection with rich metadata and poster images
5. **Movie Details**: Click on any movie title or poster to see detailed information

## API Configuration

The app uses OpenAI's Vision API to analyze images. You need a valid OpenAI API key with access to the Vision API (GPT-4 with vision capabilities).

### Important Security Note

This demo app makes API calls directly from the browser for simplicity. In a production environment, you should:

1. Move API calls to your backend server
2. Never expose API keys in frontend code
3. Implement proper authentication and rate limiting

## Troubleshooting

### "OpenAI API key not configured" Error

- Make sure you've created a `.env` file with your API key
- Restart the development server after adding the API key
- Verify your API key is valid and has Vision API access

### AI Vision Not Working

- Check browser console for error messages
- Verify your OpenAI account has sufficient credits
- Ensure the image is clear and movie titles are visible
- The app will fall back to simulation mode if the API fails

### No Movie Posters Showing

- Clear your browser's local storage and reload the page
- Use the "Clear Collection" button if available
- Check browser console for image loading errors

## Development

### Project Structure

```
src/
├── components/          # React components
├── services/           # API and business logic
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── pages/              # Page components
```

### Key Files

- `src/services/aiVisionService.ts` - OpenAI Vision API integration
- `src/services/movieMetadataService.ts` - Movie metadata enrichment
- `src/components/PhotoCapture.tsx` - Camera functionality
- `src/components/CatalogView.tsx` - Movie collection display

## License

This project is for demonstration purposes. Please ensure you comply with OpenAI's usage policies when using their API.
