import { createWorker, PSM } from 'tesseract.js';
import { SpineDetection } from '@/types/collection';

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
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 &:-\'.,',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
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
      
      // Apply image preprocessing to improve OCR accuracy
      const imageData = ctx.getImageData(0, 0, spineWidth, spineHeight);
      const data = imageData.data;
      
      // Convert to grayscale and apply adaptive thresholding
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        
        // More sophisticated contrast enhancement
        let enhanced;
        if (gray < 80) {
          enhanced = 0; // Dark text
        } else if (gray > 180) {
          enhanced = 255; // Light background
        } else {
          // Enhance mid-tones
          enhanced = gray > 130 ? 255 : 0;
        }
        
        data[i] = enhanced;     // Red
        data[i + 1] = enhanced; // Green
        data[i + 2] = enhanced; // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to data URL
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
    .replace(/[^\w\s&:'-.,]/g, '') // Remove special characters except common movie title chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n+/g, ' ') // Replace newlines with spaces
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
        
        // Only add if we got meaningful text with reasonable confidence
        if (cleanedText && cleanedText.length > 1 && data.confidence > 20) {
          detectedTitles.push({
            spineId: spine.id,
            title: cleanedText,
            confidence: data.confidence / 100 // Convert to 0-1 range
          });
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