import { SpineDetection } from '@/types/collection';
import { findBestMovieMatch } from './movieDatabase';
import { enrichMovieWithMetadata, MovieMetadata } from './movieMetadataService';
import OpenAI from 'openai';

export interface DetectedTitle {
  spineId: string;
  title: string;
  confidence: number;
  isManuallyEdited?: boolean;
  metadata?: Partial<MovieMetadata>;
}

// Convert image to base64 for API
const imageToBase64 = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (imageUrl.startsWith('data:')) {
      // Already base64
      resolve(imageUrl);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(base64);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// Use OpenAI Vision API to identify movie titles (same as ChatGPT)
const identifyMovieTitlesWithAI = async (base64Image: string): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please create a .env file with VITE_OPENAI_API_KEY=your_api_key_here');
  }

  try {
    console.log('Using OpenAI Vision API (same as ChatGPT) to analyze image...');
    
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    // Extract base64 data from data URL if needed
    const base64Data = base64Image.startsWith('data:')
      ? base64Image.split(',')[1]
      : base64Image;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this image of a movie collection (DVD/Blu-ray shelf) and identify all visible movie titles on the spines. Look carefully at each spine and read the text exactly as it appears. Return only a JSON array of strings containing the movie titles you can clearly identify. Be precise and only include titles you can read with confidence."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI Vision API');
    }
    
    console.log('OpenAI Vision API response:', content);
    
    // Try to parse as JSON first
    try {
      const titles = JSON.parse(content);
      if (Array.isArray(titles)) {
        console.log('Successfully parsed JSON response:', titles);
        return titles;
      }
    } catch (parseError) {
      console.log('Response is not JSON, extracting titles from text...');
    }
    
    // Fallback: extract titles from text response
    const lines = content.split('\n').filter(line => line.trim());
    const extractedTitles = lines
      .map(line => line.replace(/^[-*•\d.]\s*/, '').trim())
      .filter(line => line.length > 2 && !line.toLowerCase().includes('movie') && !line.toLowerCase().includes('title'))
      .slice(0, 15); // Limit to reasonable number
    
    console.log('Extracted titles from text:', extractedTitles);
    return extractedTitles;
    
  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    throw error;
  }
};

// Main function to extract titles using AI Vision
export const extractTitlesFromImage = async (
  imageUrl: string, 
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  const detectedTitles: DetectedTitle[] = [];
  
  try {
    console.log('Starting AI Vision processing...');
    
    // Convert image to base64
    const base64Image = await imageToBase64(imageUrl);
    
    // Use AI Vision to identify movie titles
    const aiIdentifiedTitles = await identifyMovieTitlesWithAI(base64Image);
    
    // Process each identified title
    for (let i = 0; i < aiIdentifiedTitles.length; i++) {
      const title = aiIdentifiedTitles[i];
      
      // Try to match with our movie database for consistency
      const bestMatch = findBestMovieMatch(title);
      const finalTitle = bestMatch || title;
      
      // Enrich with metadata
      const metadata = enrichMovieWithMetadata(finalTitle);
      
      detectedTitles.push({
        spineId: `ai-${i}`,
        title: finalTitle,
        confidence: 0.95, // High confidence for AI Vision results
        metadata: metadata
      });
      
      console.log(`AI identified: "${title}" -> Final: "${finalTitle}" with metadata:`, metadata);
    }
    
    console.log('AI Vision processing complete. Found titles:', detectedTitles);
    
  } catch (error) {
    console.error('OpenAI Vision processing failed:', error);
    throw error; // Re-throw to let the UI handle the error
  }
  
  return detectedTitles;
};

// Cleanup function (not needed for AI Vision but kept for compatibility)
export const cleanupOCR = async (): Promise<void> => {
  // No cleanup needed for AI Vision API
  console.log('AI Vision cleanup complete');
};