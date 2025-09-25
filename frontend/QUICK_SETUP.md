# Quick Setup - OpenAI Vision API

## Get the app working in 3 steps:

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Add API Key to App
1. Create `.env` file in the `frontend` folder:
   ```bash
   touch .env
   ```

2. Add your API key to the `.env` file:
   ```
   VITE_OPENAI_API_KEY=sk-your-actual-key-here
   ```

### Step 3: Restart and Test
1. Restart the development server (Ctrl+C then `npm run dev`)
2. Go to http://localhost:3000
3. Upload an image of your movie shelf
4. The app will now use the same AI as ChatGPT to identify real movie titles!

## Cost
- About $0.01-0.05 per image analyzed
- Only pay for images you upload
- Same accuracy as ChatGPT

## That's it!
The app will now correctly identify the actual movie titles from your uploaded images using OpenAI's Vision API.