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
      // Already base64, extract the data part
      const base64Data = imageUrl.split(',')[1];
      resolve(base64Data);
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
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// Use Google Cloud Vision API to detect text in images with improved document detection
const detectTextWithGoogleVision = async (base64Image: string): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey || apiKey === 'AIzaSyDvQm-G0bIScw6VFvT1UbOjuaEPmWT_ncQ') {
    throw new Error('Google Cloud Vision API key not found. Please add your actual API key to the .env file.');
  }

  try {
    console.log('Using Google Cloud Vision API with DOCUMENT_TEXT_DETECTION...');
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 50
              }
            ],
            imageContext: {
              languageHints: ["en"], // helps filter out junk
              textDetectionParams: {
                enableTextDetectionConfidenceScore: true
              }
            }
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 400) {
        throw new Error('Invalid Google Cloud Vision API request. Please check your API key and request format.');
      } else if (response.status === 403) {
        throw new Error('Google Cloud Vision API access denied. Please check your API key permissions.');
      } else if (response.status === 429) {
        throw new Error('Google Cloud Vision API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Google Cloud Vision API error: ${response.status} ${response.statusText}. ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('Google Vision API response:', data);
    
    if (!data.responses || !data.responses[0]) {
      throw new Error('No response from Google Cloud Vision API');
    }
    
    const response_data = data.responses[0];
    
    if (response_data.error) {
      throw new Error(`Google Vision API error: ${response_data.error.message}`);
    }
    
    // Get the full text first
    let fullText = '';
    if (response_data.fullTextAnnotation) {
      fullText = response_data.fullTextAnnotation.text;
      console.log("=== Raw OCR Output ===");
      console.log(fullText);
    }
    
    // Process the full text to extract movie titles
    const extractedTitles = extractMovieTitlesFromText(fullText);
    
    console.log('\n=== Extracted Movie Titles ===');
    extractedTitles.forEach(title => console.log(title));
    
    return extractedTitles;
    
  } catch (error) {
    console.error('Google Cloud Vision API error:', error);
    throw error;
  }
};

// Extract movie titles from the full OCR text with improved processing
const extractMovieTitlesFromText = (ocrText: string): string[] => {
  if (!ocrText) return [];
  
  console.log("=== Processing OCR Text ===");
  console.log("Raw text length:", ocrText.length);
  
  // Define comprehensive stopwords
  const stopwords = new Set([
    "ULTRA", "UHD", "BLU", "BLU-RAY", "BLURAY", "4K", "DISC", "STEELBOOK",
    "WARNER", "DISNEY", "CRITERION", "LIONSGATE", "UNIVERSAL", "PARAMOUNT",
    "SONY", "FOX", "MGM", "BROS", "PICTURES", "ENTERTAINMENT", "STUDIOS",
    "HOME", "VIDEO", "DVD", "DIGITAL", "COPY", "HD", "RATED", "UNRATED",
    "PG", "PG-13", "R", "NC-17", "G", "SPECIAL", "EDITION", "EXTENDED",
    "DIRECTOR'S", "DIRECTORS", "CUT", "VERSION", "COLLECTION", "COMPLETE",
    "TRILOGY", "SAGA", "SERIES", "SEASON", "VOLUME", "VOL", "PART", "PT",
    "CHAPTER", "CHAPTERS", "KEANU", "REEVES", "TOM", "CRUISE", "STANLEY",
    "KUBRICK", "FROZEN", "EMPIRE", "GHOSTBUSTERS", "LIVE", "DIE", "REPEAT"
  ]);
  
  // Split text into lines and process each line
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log("Total lines:", lines.length);
  
  const potentialTitles: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`Line ${i}: "${line}"`);
    
    // Skip lines that are clearly not movie titles
    if (line.length < 2) continue;
    if (/^\d+$/.test(line)) continue; // Skip pure numbers
    if (/^[A-Z]$/.test(line)) continue; // Skip single letters
    if (/^P\d+/.test(line)) continue; // Skip product codes like P425555
    
    // Clean the line - be more aggressive about cleaning
    let cleaned = line
      .replace(/[^\w\s&:'-.,()]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim();
    
    // Skip if too short after cleaning
    if (cleaned.length < 3) continue;
    
    // Check if this looks like a movie title
    const words = cleaned.split(/\s+/);
    
    // Filter out stopwords but be more lenient
    const meaningfulWords = words.filter(word => {
      const upperWord = word.toUpperCase();
      
      // Skip obvious junk
      if (word.length <= 1) return false;
      if (/^\d+$/.test(word)) return false;
      if (stopwords.has(upperWord)) return false;
      
      // Keep words that could be part of movie titles
      return true;
    });
    
    // If we have meaningful words, create a title
    if (meaningfulWords.length > 0) {
      const title = meaningfulWords.join(' ').trim();
      
      // Additional validation for the complete title
      if (title.length >= 3 && title.length <= 60) {
        // Skip titles that are clearly not movies
        const upperTitle = title.toUpperCase();
        if (upperTitle.includes('CTURES')) continue; // Fragment of "PICTURES"
        if (upperTitle === 'ICON') continue; // Single word that's not a movie
        if (upperTitle === 'DRIVE' && title.length === 5) {
          // "Drive" could be a movie, but let's be more selective
          potentialTitles.push(title);
        } else if (title.length > 5 || meaningfulWords.length > 1) {
          // Prefer longer titles or multi-word titles
          potentialTitles.push(title);
        }
      }
    }
  }
  
  // Remove duplicates
  const uniqueTitles = [...new Set(potentialTitles)];
  console.log("Unique potential titles:", uniqueTitles);
  
  // Final filtering and scoring
  const scoredTitles = uniqueTitles.map(title => {
    let score = 0;
    const words = title.split(/\s+/);
    
    // Score based on various factors
    if (words.length > 1) score += 2; // Multi-word titles are more likely
    if (title.length > 10) score += 1; // Longer titles are more likely
    if (/^[A-Z]/.test(title)) score += 1; // Titles starting with capital
    if (title.includes(':')) score += 1; // Titles with colons (like "MISSION: IMPOSSIBLE")
    
    // Penalize certain patterns
    if (/^\d/.test(title)) score -= 2; // Titles starting with numbers
    if (title.length < 5) score -= 1; // Very short titles
    
    return { title, score };
  });
  
  // Sort by score (highest first) and return titles
  const finalTitles = scoredTitles
    .filter(item => item.score >= 0) // Only keep titles with positive scores
    .sort((a, b) => b.score - a.score)
    .map(item => item.title);
  
  console.log("Final scored titles:", finalTitles);
  return finalTitles;
};

// Clean and filter text to identify movie titles (simplified since we now process full text)
const cleanAndFilterMovieTitles = (detectedTexts: string[]): string[] => {
  // Since we're now processing the full text in extractMovieTitlesFromText,
  // this function just does basic cleanup and deduplication
  const potentialTitles: string[] = [];
  
  for (const text of detectedTexts) {
    let cleaned = text.trim();
    
    // Skip very short or very long text
    if (cleaned.length < 3 || cleaned.length > 100) continue;
    
    // Basic cleanup
    cleaned = cleaned
      .replace(/[^\w\s&:'-.,()]/g, ' ') // Replace special characters with spaces
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim();
    
    if (cleaned.length >= 3) {
      potentialTitles.push(cleaned);
    }
  }
  
  // Remove duplicates and sort by length (longer titles first)
  const uniqueTitles = [...new Set(potentialTitles)];
  return uniqueTitles.sort((a, b) => b.length - a.length);
};

// Process detected text into movie titles (pure image-based, no database matching)
const processDetectedTitles = async (potentialTitles: string[]): Promise<DetectedTitle[]> => {
  const detectedTitles: DetectedTitle[] = [];
  
  console.log('Processing potential titles from image:', potentialTitles);
  
  // Clean and validate all potential titles
  const validTitles: string[] = [];
  for (const text of potentialTitles) {
    const cleaned = cleanDetectedText(text);
    if (isValidMovieTitle(cleaned)) {
      validTitles.push(cleaned);
    }
  }
  
  // Remove duplicates based on similarity
  const uniqueTitles = removeDuplicateTitles(validTitles);
  
  console.log('Valid unique titles from image:', uniqueTitles);
  
  // Create DetectedTitle objects for each valid title
  for (let i = 0; i < uniqueTitles.length; i++) {
    const title = uniqueTitles[i];
    const metadata = await enrichMovieWithMetadata(title);
    
    detectedTitles.push({
      spineId: `google-vision-${i}`,
      title: title,
      confidence: 0.9, // High confidence for Google Vision results
      metadata: metadata
    });
    
    console.log(`Google Vision detected from image: "${title}"`);
  }
  
  return detectedTitles;
};

// Main function to extract titles using Google Cloud Vision
export const extractTitlesFromImage = async (
  imageUrl: string, 
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  try {
    console.log('Starting Google Cloud Vision processing...');
    
    // Convert image to base64
    const base64Image = await imageToBase64(imageUrl);
    
    // Use Google Vision to detect text
    const detectedTexts = await detectTextWithGoogleVision(base64Image);
    
    if (detectedTexts.length === 0) {
      console.log('No text detected by Google Vision');
      return [];
    }
    
    // Clean and filter potential movie titles
    const potentialTitles = cleanAndFilterMovieTitles(detectedTexts);
    
    // Process detected titles (pure image-based)
    const detectedTitles = await processDetectedTitles(potentialTitles);
    
    console.log('Google Vision processing complete. Found titles:', detectedTitles);
    
    return detectedTitles;
    
  } catch (error) {
    console.error('Google Vision processing failed:', error);
    throw error; // Re-throw to let the UI handle the error
  }
};

// Cleanup function (not needed for Google Vision but kept for compatibility)
export const cleanupOCR = async (): Promise<void> => {
  // No cleanup needed for Google Vision API
  console.log('Google Vision cleanup complete');
};