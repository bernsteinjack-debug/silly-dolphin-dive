import { SpineDetection } from '@/types/collection';

// Mock OCR service - in a real implementation, this would use:
// - Tesseract.js for client-side OCR
// - Google Vision API, AWS Textract, or Azure Computer Vision
// - Custom ML model trained on movie spine text

export interface DetectedTitle {
  spineId: string;
  title: string;
  confidence: number;
}

// Mock movie titles for demonstration
const MOCK_MOVIE_TITLES = [
  "The Dark Knight",
  "Inception",
  "Pulp Fiction",
  "The Godfather",
  "Goodfellas",
  "The Shawshank Redemption",
  "Fight Club",
  "The Matrix",
  "Interstellar",
  "Blade Runner 2049",
  "Mad Max: Fury Road",
  "John Wick",
  "The Avengers",
  "Iron Man",
  "Spider-Man",
  "Batman Begins",
  "Casino Royale",
  "Skyfall",
  "Mission Impossible",
  "Fast & Furious",
  "Transformers",
  "Jurassic Park",
  "Star Wars",
  "Lord of the Rings",
  "Harry Potter",
  "Pirates of the Caribbean",
  "The Bourne Identity",
  "Die Hard",
  "Terminator",
  "Alien"
];

export const extractTitlesFromImage = async (
  imageUrl: string, 
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const detectedTitles: DetectedTitle[] = [];

  // For each spine detection, simulate OCR extraction
  spineDetections.forEach((spine, index) => {
    // Simulate OCR success rate (80% of spines get titles detected)
    if (Math.random() > 0.2) {
      const randomTitle = MOCK_MOVIE_TITLES[Math.floor(Math.random() * MOCK_MOVIE_TITLES.length)];
      const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence
      
      detectedTitles.push({
        spineId: spine.id,
        title: randomTitle,
        confidence
      });
    }
  });

  return detectedTitles;
};

// Real implementation would look like this:
/*
export const extractTitlesFromImage = async (
  imageUrl: string, 
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  const detectedTitles: DetectedTitle[] = [];

  for (const spine of spineDetections) {
    try {
      // Extract the spine region from the image
      const spineImageData = await extractSpineRegion(imageUrl, spine);
      
      // Use OCR to extract text
      const ocrResult = await Tesseract.recognize(spineImageData, 'eng', {
        logger: m => console.log(m)
      });
      
      // Clean and process the extracted text
      const cleanedText = cleanOCRText(ocrResult.data.text);
      
      if (cleanedText && cleanedText.length > 2) {
        detectedTitles.push({
          spineId: spine.id,
          title: cleanedText,
          confidence: ocrResult.data.confidence / 100
        });
      }
    } catch (error) {
      console.error(`OCR failed for spine ${spine.id}:`, error);
    }
  }

  return detectedTitles;
};

const extractSpineRegion = async (imageUrl: string, spine: SpineDetection): Promise<ImageData> => {
  // Create canvas and extract the spine region
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const spineX = (spine.x / 100) * img.width;
      const spineY = (spine.y / 100) * img.height;
      const spineWidth = (spine.width / 100) * img.width;
      const spineHeight = (spine.height / 100) * img.height;
      
      canvas.width = spineWidth;
      canvas.height = spineHeight;
      
      ctx?.drawImage(img, spineX, spineY, spineWidth, spineHeight, 0, 0, spineWidth, spineHeight);
      
      const imageData = ctx?.getImageData(0, 0, spineWidth, spineHeight);
      if (imageData) {
        resolve(imageData);
      } else {
        reject(new Error('Failed to extract spine region'));
      }
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
};

const cleanOCRText = (rawText: string): string => {
  return rawText
    .replace(/[^\w\s&:'-]/g, '') // Remove special characters except common movie title chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split('\n')[0] // Take first line only
    .substring(0, 50); // Limit length
};
*/