import { createWorker, PSM } from 'tesseract.js';
import { SpineDetection } from '@/types/collection';
import { findBestMovieMatch } from './movieDatabase';

export interface DetectedTitle {
  spineId: string;
  title: string;
  confidence: number;
}

// Initialize Tesseract worker
let ocrWorker: Tesseract.Worker | null = null;

const initializeOCR = async (): Promise<Tesseract.Worker> => {
  if (ocrWorker) {
    return ocrWorker;
  }

  ocrWorker = await createWorker('eng');
  await ocrWorker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 &:-\'.,()[]',
    tessedit_pageseg_mode: PSM.AUTO,
    preserve_interword_spaces: '1',
  });

  return ocrWorker;
};

const preprocessImage = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Apply preprocessing to enhance text visibility
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and enhance contrast
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Apply contrast enhancement
        let enhanced = luminance;
        if (luminance < 128) {
          enhanced = Math.max(0, luminance - 30); // Darken dark areas
        } else {
          enhanced = Math.min(255, luminance + 30); // Brighten light areas
        }
        
        data[i] = enhanced;     // Red
        data[i + 1] = enhanced; // Green
        data[i + 2] = enhanced; // Blue
        // Alpha channel remains unchanged
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
};

const cleanOCRText = (rawText: string): string => {
  return rawText
    .replace(/[^\w\s&:'-.,()]/g, '') // Remove special characters except common movie title chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/[|]/g, 'I') // Common OCR mistake: | instead of I
    .replace(/[0]/g, 'O') // Common OCR mistake: 0 instead of O
    .replace(/[5]/g, 'S') // Common OCR mistake: 5 instead of S
    .trim();
};

const extractMovieTitlesFromText = (text: string): string[] => {
  const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 0);
  const potentialTitles: string[] = [];
  
  // Process each line and look for movie title patterns
  for (const line of lines) {
    const cleaned = cleanOCRText(line);
    if (cleaned.length >= 3 && cleaned.length <= 100) {
      // Split by common separators and process each part
      const parts = cleaned.split(/[|\/\\]+/);
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.length >= 3) {
          potentialTitles.push(trimmed);
        }
      }
    }
  }
  
  return potentialTitles;
};

export const extractTitlesFromImage = async (
  imageUrl: string, 
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  const detectedTitles: DetectedTitle[] = [];
  
  try {
    // Initialize OCR worker
    const worker = await initializeOCR();
    
    console.log('Starting OCR processing for entire image...');
    
    // Preprocess the image for better OCR results
    const processedImageUrl = await preprocessImage(imageUrl);
    
    // Use OCR to extract all text from the entire image
    const { data } = await worker.recognize(processedImageUrl);
    
    console.log('Raw OCR result:', data.text);
    console.log('OCR confidence:', data.confidence);
    
    // Extract potential movie titles from the OCR text
    const potentialTitles = extractMovieTitlesFromText(data.text);
    console.log('Potential titles found:', potentialTitles);
    
    // Match each potential title with the movie database
    const uniqueTitles = new Set<string>();
    
    for (let i = 0; i < potentialTitles.length; i++) {
      const potentialTitle = potentialTitles[i];
      const bestMatch = findBestMovieMatch(potentialTitle);
      
      if (bestMatch && !uniqueTitles.has(bestMatch)) {
        uniqueTitles.add(bestMatch);
        detectedTitles.push({
          spineId: `title-${i}`,
          title: bestMatch,
          confidence: 0.85 // High confidence for database matches
        });
        console.log(`Matched "${potentialTitle}" to "${bestMatch}"`);
      } else if (potentialTitle.length > 5 && !uniqueTitles.has(potentialTitle)) {
        // Include longer unmatched titles with lower confidence
        uniqueTitles.add(potentialTitle);
        detectedTitles.push({
          spineId: `title-${i}`,
          title: potentialTitle,
          confidence: 0.6
        });
        console.log(`Using unmatched title: "${potentialTitle}"`);
      }
    }
    
    console.log('Final detected titles:', detectedTitles);
    
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
  
  return detectedTitles;
};

// Cleanup function to terminate the worker when done
export const cleanupOCR = async (): Promise<void> => {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
};