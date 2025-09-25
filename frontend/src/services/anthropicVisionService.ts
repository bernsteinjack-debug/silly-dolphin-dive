import { SpineDetection } from '@/types/collection';
import { cleanDetectedText, isValidMovieTitle, removeDuplicateTitles } from './movieDatabase';
import { enrichMovieWithMetadata, MovieMetadata } from './movieMetadataService';

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
      const base64 = canvas.toDataURL('image/jpeg', 0.95);
      resolve(base64);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// Use Anthropic Claude Vision API to identify movie titles
const identifyMovieTitlesWithClaude = async (base64Image: string): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    throw new Error('Anthropic API key not found. Please add your actual API key to the .env file. Replace "your_anthropic_api_key_here" with your real API key from https://console.anthropic.com/');
  }

  try {
    console.log('Using Anthropic Claude Vision API to analyze image...');
    
    // Extract base64 data from data URL if needed
    const base64Data = base64Image.startsWith('data:')
      ? base64Image.split(',')[1]
      : base64Image;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: 'You are analyzing an image of DVD/Blu-ray movie cases stacked on top of each other. Your task is to extract ALL visible movie titles from the spines of these cases.\n\nINSTRUCTIONS:\n1. Examine the image systematically from top to bottom\n2. Look at each individual spine/case in the stack\n3. Read the text on each spine, focusing on the main movie title\n4. Include titles even if partially obscured or at angles\n5. Ignore non-title text like "Blu-ray", "DVD", "4K Ultra HD", studio names, ratings, etc.\n6. Focus only on the actual movie titles\n\nIMPORTANT GUIDELINES:\n- Look for text that appears to be movie titles (usually the largest/most prominent text on each spine)\n- Include titles with different text orientations (some spines may have vertical text)\n- Don\'t skip cases that are partially visible or at the edges\n- If you can see part of a title, include your best interpretation\n- Extract ONLY what you can actually see in the image - do not make assumptions\n- Be accurate and only include titles that are clearly visible\n\nReturn ONLY a JSON array of movie titles that you can actually see in the image, like this:\n["TITLE 1", "TITLE 2", "TITLE 3", ...]\n\nDo not include any other text, explanations, or formatting - just the JSON array of movie titles that are actually visible in the image.'
              }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your API key in the .env file.');
      } else if (response.status === 429) {
        throw new Error('Anthropic API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}. ${errorText}`);
      }
    }
    
    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      throw new Error('No response from Anthropic Claude Vision API');
    }
    
    console.log('Anthropic Claude Vision API response:', content);
    console.log('Response length:', content.length);
    console.log('Response type:', typeof content);
    
    // Try to parse as JSON first (preferred format)
    console.log('Attempting to parse JSON response...');
    
    try {
      // Clean the content to extract JSON if it's wrapped in other text
      let jsonContent = content.trim();
      
      // Look for JSON array in the response
      const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      const titles = JSON.parse(jsonContent);
      if (Array.isArray(titles)) {
        console.log('Successfully parsed JSON response:', titles);
        console.log('Number of titles in JSON:', titles.length);
        return titles.filter(title => typeof title === 'string' && title.trim().length > 0);
      }
    } catch (parseError) {
      console.log('JSON parsing failed, falling back to text extraction...');
    }
    
    // Fallback: extract titles from text response
    const lines = content.split('\n').filter(line => line.trim());
    console.log('All lines from response:', lines);
    
    const extractedTitles = [];
    
    for (const line of lines) {
      let cleaned = line.trim();
      
      // Remove common prefixes and formatting
      cleaned = cleaned.replace(/^[-*•]\s*/, '');
      cleaned = cleaned.replace(/^\d+\.\s*/, '');
      cleaned = cleaned.replace(/^["'`]|["'`]$/g, '');
      cleaned = cleaned.trim();
      
      // Skip empty lines and non-title content
      if (cleaned.length < 2) continue;
      if (cleaned.toLowerCase().match(/^(section|total|count|technical|image|processing|visibility|expected|systematic|critical)/)) continue;
      if (cleaned.toLowerCase().match(/^(here|the following|movies?|titles?|dvd|blu-?ray|collection|visible|spines?)/)) continue;
      if (cleaned.includes('JSON') || cleaned.includes('[') || cleaned.includes(']')) continue;
      
      // Look for movie title patterns
      if (cleaned.match(/^[A-Z0-9]/i) && cleaned.length <= 100) {
        extractedTitles.push(cleaned);
      }
    }
    
    console.log('Final extracted titles from text:', extractedTitles);
    console.log('Number of extracted titles:', extractedTitles.length);
    return extractedTitles.slice(0, 30); // Limit to reasonable number
    
  } catch (error) {
    console.error('Anthropic Claude Vision API error:', error);
    throw error;
  }
};

// Main function to extract titles using Claude Vision
export const extractTitlesFromImage = async (
  imageUrl: string, 
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  const detectedTitles: DetectedTitle[] = [];
  
  try {
    console.log('Starting Claude Vision processing...');
    
    // Convert image to base64
    const base64Image = await imageToBase64(imageUrl);
    
    // Use Claude Vision to identify movie titles
    const aiIdentifiedTitles = await identifyMovieTitlesWithClaude(base64Image);
    
    // Process each identified title (pure image-based, no database matching)
    const validTitles: string[] = [];
    for (const title of aiIdentifiedTitles) {
      const cleaned = cleanDetectedText(title);
      if (isValidMovieTitle(cleaned)) {
        validTitles.push(cleaned);
      }
    }
    
    // Remove duplicates based on similarity
    const uniqueTitles = removeDuplicateTitles(validTitles);
    
    // Create DetectedTitle objects for each valid title
    for (let i = 0; i < uniqueTitles.length; i++) {
      const title = uniqueTitles[i];
      
      // Enrich with metadata
      const metadata = await enrichMovieWithMetadata(title);
      
      detectedTitles.push({
        spineId: `claude-${i}`,
        title: title,
        confidence: 0.95, // High confidence for Claude Vision results
        metadata: metadata
      });
      
      console.log(`Claude identified from image: "${title}" with metadata:`, metadata);
    }
    
    console.log('Claude Vision processing complete. Found titles:', detectedTitles);
    
  } catch (error) {
    console.error('Claude Vision processing failed:', error);
    throw error; // Re-throw to let the UI handle the error
  }
  
  return detectedTitles;
};

// Cleanup function (not needed for Claude Vision but kept for compatibility)
export const cleanupOCR = async (): Promise<void> => {
  // No cleanup needed for Claude Vision API
  console.log('Claude Vision cleanup complete');
};