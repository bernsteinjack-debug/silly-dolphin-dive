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
    tessedit_pageseg_mode: PSM.SINGLE_LINE,
    preserve_interword_spaces: '1',
  });

  return ocrWorker;
};

const extractSpineRegion = async (imageUrl: string, spine: SpineDetection): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate spine region coordinates
      const spineX = (spine.x / 100) * img.width;
      const spineY = (spine.y / 100) * img.height;
      const spineWidth = (spine.width / 100) * img.width;
      const spineHeight = (spine.height / 100) * img.height;
      
      // Set canvas size to spine region
      canvas.width = spineWidth;
      canvas.height = spineHeight;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw the spine region onto the canvas
      ctx.drawImage(
        img, 
        spineX, spineY, spineWidth, spineHeight, // Source rectangle
        0, 0, spineWidth, spineHeight // Destination rectangle
      );
      
      // Scale up the image for better OCR accuracy
      const scaleFactor = 3;
      const scaledWidth = spineWidth * scaleFactor;
      const scaledHeight = spineHeight * scaleFactor;
      
      // Create a larger canvas for better OCR
      const scaledCanvas = document.createElement('canvas');
      const scaledCtx = scaledCanvas.getContext('2d');
      scaledCanvas.width = scaledWidth;
      scaledCanvas.height = scaledHeight;
      
      if (!scaledCtx) {
        reject(new Error('Could not get scaled canvas context'));
        return;
      }
      
      // Draw scaled image
      scaledCtx.imageSmoothingEnabled = false; // Preserve sharp edges
      scaledCtx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
      
      // Apply image preprocessing to improve OCR accuracy
      const imageData = scaledCtx.getImageData(0, 0, scaledWidth, scaledHeight);
      const data = imageData.data;
      
      // More aggressive preprocessing for movie spine text
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Apply high contrast threshold specifically for text
        let enhanced;
        if (luminance < 100) {
          enhanced = 0; // Make dark areas completely black
        } else if (luminance > 150) {
          enhanced = 255; // Make light areas completely white
        } else {
          // For mid-tones, use a sharper threshold
          enhanced = luminance > 125 ? 255 : 0;
        }
        
        data[i] = enhanced;     // Red
        data[i + 1] = enhanced; // Green
        data[i + 2] = enhanced; // Blue
        // Alpha channel remains unchanged
      }
      
      scaledCtx.putImageData(imageData, 0, 0);
      
      // Convert scaled canvas to data URL
      const dataUrl = scaledCanvas.toDataURL('image/png');
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
    .trim()
    .substring(0, 100); // Allow longer titles
};

export const extractTitlesFromImage = async (
  imageUrl: string, 
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  const detectedTitles: DetectedTitle[] = [];
  
  try {
    // Initialize OCR worker
    const worker = await initializeOCR();
    
    console.log('Starting OCR processing for', spineDetections.length, 'spines...');
    
    // Process each spine detection
    for (const spine of spineDetections) {
      try {
        console.log(`Processing spine ${spine.id}...`);
        
        // Extract the spine region from the image
        const spineImageData = await extractSpineRegion(imageUrl, spine);
        
        // Use OCR to extract text from the spine region
        const { data } = await worker.recognize(spineImageData);
        
        // Clean and process the extracted text
        const cleanedText = cleanOCRText(data.text);
        
        console.log(`Spine ${spine.id} OCR result:`, {
          raw: data.text,
          cleaned: cleanedText,
          confidence: data.confidence
        });
        
        // Try to match with movie database for better accuracy
        const bestMatch = findBestMovieMatch(cleanedText);
        
        if (bestMatch) {
          // Found a good match in the movie database
          detectedTitles.push({
            spineId: spine.id,
            title: bestMatch,
            confidence: Math.max(0.8, data.confidence / 100) // Boost confidence for database matches
          });
          console.log(`Matched "${cleanedText}" to "${bestMatch}"`);
        } else if (cleanedText && cleanedText.length > 2 && data.confidence > 15) {
          // Use raw OCR result if no database match but confidence is reasonable
          detectedTitles.push({
            spineId: spine.id,
            title: cleanedText,
            confidence: data.confidence / 100
          });
          console.log(`Using raw OCR result: "${cleanedText}"`);
        }
      } catch (error) {
        console.error(`OCR failed for spine ${spine.id}:`, error);
      }
    }
    
    console.log('OCR processing complete. Found titles:', detectedTitles);
    
  } catch (error) {
    console.error('OCR initialization failed:', error);
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