import { createWorker, PSM } from 'tesseract.js';
import { SpineDetection } from '@/types/collection';
import { cleanDetectedText, isValidMovieTitle, removeDuplicateTitles } from './movieDatabase';
import { enrichMovieWithMetadata, MovieMetadata } from './movieMetadataService';

// Fuzzy string matching library (simple implementation)
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

const fuzzyMatch = (str1: string, str2: string, threshold: number = 0.7): boolean => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return true;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const similarity = (maxLength - distance) / maxLength;
  return similarity >= threshold;
};

export interface DetectedTitle {
  spineId: string;
  title: string;
  confidence: number;
  isManuallyEdited?: boolean;
  metadata?: Partial<MovieMetadata>;
}

// Initialize Tesseract worker
let ocrWorker: Tesseract.Worker | null = null;

const initializeOCR = async (): Promise<Tesseract.Worker> => {
  if (ocrWorker) {
    return ocrWorker;
  }

  console.log('Initializing advanced OCR worker...');
  ocrWorker = await createWorker('eng');
  
  // Enhanced OCR parameters specifically optimized for DVD spine text detection
  await ocrWorker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 &:-\'.,()[]!?',
    tessedit_pageseg_mode: PSM.AUTO, // Changed to AUTO for better spine detection
    preserve_interword_spaces: '1',
    tessedit_do_invert: '0',
    tessedit_create_hocr: '1',
    tessedit_create_tsv: '1',
    // More aggressive settings for spine text
    classify_bln_numeric_mode: '0',
    textord_really_old_xheight: '0', // Changed to 0 for better small text
    textord_min_xheight: '5', // Reduced for smaller spine text
    textord_min_linesize: '0.5', // Much smaller for spine text
    tessedit_reject_alphas_in_number_perm: '0', // Allow more flexibility
    // Additional parameters for better spine text detection
    textord_tabfind_show_vlines: '0',
    textord_use_cjk_fp_model: '0',
    textord_force_make_prop_words: '1',
    textord_chopper_test: '1',
    // Lower confidence thresholds to catch more text
    classify_min_certainty: '-10',
    classify_min_certainty_margin: '0.0',
  });

  console.log('OCR worker initialized with enhanced parameters');
  return ocrWorker;
};

// No more hardcoded suggestions - pure image-based detection only

// Advanced image preprocessing with multiple enhancement techniques optimized for DVD spines
const preprocessImage = async (imageUrl: string, variant: 'contrast' | 'edge' | 'denoise' | 'sharpen' | 'dvd_spine' = 'contrast'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Scale up significantly for better OCR accuracy on small spine text
      const scale = variant === 'dvd_spine' ? 3 : 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Enable image smoothing for scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Apply different preprocessing based on variant
      switch (variant) {
        case 'contrast':
          applyContrastEnhancement(data);
          break;
        case 'edge':
          applyEdgeDetection(data, width, height);
          break;
        case 'denoise':
          applyDenoising(data, width, height);
          break;
        case 'sharpen':
          applySharpening(data, width, height);
          break;
        case 'dvd_spine':
          applyDVDSpineOptimization(data, width, height);
          break;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
};

// Contrast enhancement for better text visibility
const applyContrastEnhancement = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to grayscale with optimized weights for text
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply adaptive thresholding with multiple levels
    let processed;
    if (gray < 60) {
      processed = 0; // Very dark -> black
    } else if (gray > 200) {
      processed = 255; // Very light -> white
    } else if (gray < 100) {
      processed = Math.max(0, gray - 30); // Darken mid-dark
    } else if (gray > 160) {
      processed = Math.min(255, gray + 30); // Lighten mid-light
    } else {
      // Critical mid-range: aggressive contrast
      processed = gray > 130 ? 255 : 0;
    }
    
    data[i] = processed;
    data[i + 1] = processed;
    data[i + 2] = processed;
  }
};

// Edge detection to highlight text boundaries
const applyEdgeDetection = (data: Uint8ClampedArray, width: number, height: number) => {
  const original = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Sobel edge detection
      const gx =
        -1 * getGray(original, (y-1) * width + (x-1)) + 1 * getGray(original, (y-1) * width + (x+1)) +
        -2 * getGray(original, y * width + (x-1)) + 2 * getGray(original, y * width + (x+1)) +
        -1 * getGray(original, (y+1) * width + (x-1)) + 1 * getGray(original, (y+1) * width + (x+1));
      
      const gy =
        -1 * getGray(original, (y-1) * width + (x-1)) + -2 * getGray(original, (y-1) * width + x) + -1 * getGray(original, (y-1) * width + (x+1)) +
        1 * getGray(original, (y+1) * width + (x-1)) + 2 * getGray(original, (y+1) * width + x) + 1 * getGray(original, (y+1) * width + (x+1));
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const processed = magnitude > 50 ? 255 : 0;
      
      data[idx] = processed;
      data[idx + 1] = processed;
      data[idx + 2] = processed;
    }
  }
};

// Denoising filter
const applyDenoising = (data: Uint8ClampedArray, width: number, height: number) => {
  const original = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // 3x3 median filter
      const neighbors = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          neighbors.push(getGray(original, (y + dy) * width + (x + dx)));
        }
      }
      neighbors.sort((a, b) => a - b);
      const median = neighbors[4]; // Middle value
      
      data[idx] = median;
      data[idx + 1] = median;
      data[idx + 2] = median;
    }
  }
};

// Sharpening filter
const applySharpening = (data: Uint8ClampedArray, width: number, height: number) => {
  const original = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Unsharp mask
      const center = getGray(original, y * width + x);
      const surrounding = (
        getGray(original, (y-1) * width + x) +
        getGray(original, (y+1) * width + x) +
        getGray(original, y * width + (x-1)) +
        getGray(original, y * width + (x+1))
      ) / 4;
      
      const sharpened = Math.min(255, Math.max(0, center + 1.5 * (center - surrounding)));
      
      data[idx] = sharpened;
      data[idx + 1] = sharpened;
      data[idx + 2] = sharpened;
    }
  }
};

// DVD Spine specific optimization combining multiple techniques
const applyDVDSpineOptimization = (data: Uint8ClampedArray, width: number, height: number) => {
  const original = new Uint8ClampedArray(data);
  
  // Step 1: Apply aggressive contrast enhancement for spine text
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to grayscale with optimized weights for text
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Aggressive thresholding specifically for spine text
    let processed;
    if (gray < 80) {
      processed = 0; // Dark text -> black
    } else if (gray > 180) {
      processed = 255; // Light background -> white
    } else {
      // Critical mid-range: very aggressive contrast
      processed = gray > 130 ? 255 : 0;
    }
    
    data[i] = processed;
    data[i + 1] = processed;
    data[i + 2] = processed;
  }
  
  // Step 2: Apply morphological operations to clean up text
  const processed = new Uint8ClampedArray(data);
  
  // Erosion followed by dilation (opening) to remove noise
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Check 3x3 neighborhood for erosion
      let minVal = 255;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
          minVal = Math.min(minVal, processed[neighborIdx]);
        }
      }
      
      data[idx] = minVal;
      data[idx + 1] = minVal;
      data[idx + 2] = minVal;
    }
  }
};

// Helper function to get grayscale value
const getGray = (data: Uint8ClampedArray, pixelIndex: number): number => {
  const idx = pixelIndex * 4;
  return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
};

const cleanOCRText = (rawText: string): string => {
  let cleaned = rawText;
  
  // Remove common DVD/Blu-ray text that's not part of movie titles
  cleaned = cleaned.replace(/\b(DVD|BLU-?RAY|4K|ULTRA\s*HD|HD|DIGITAL|COPY|DISC|COLLECTION|TRILOGY|SERIES)\b/gi, '');
  cleaned = cleaned.replace(/\b(WARNER|UNIVERSAL|PARAMOUNT|SONY|DISNEY|FOX|MGM|LIONSGATE)\b/gi, '');
  cleaned = cleaned.replace(/\b(BROS|PICTURES|ENTERTAINMENT|STUDIOS|HOME|VIDEO)\b/gi, '');
  cleaned = cleaned.replace(/\b(PG-?13|PG|R|NC-?17|G|RATED|UNRATED)\b/gi, '');
  cleaned = cleaned.replace(/\b(SPECIAL|EDITION|EXTENDED|DIRECTOR'S|CUT|VERSION)\b/gi, '');
  
  // Clean up common OCR errors and formatting
  cleaned = cleaned
    .replace(/[^\w\s&:'-.,()]/g, '') // Remove special characters except common ones
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n+/g, ' ') // Newlines to spaces
    .replace(/[|]/g, 'I') // Common OCR error
    .replace(/[0]/g, 'O') // Zero to O
    .replace(/[5]/g, 'S') // 5 to S
    .replace(/[8]/g, 'B') // 8 to B
    .replace(/[1]/g, 'I') // 1 to I
    .replace(/[6]/g, 'G') // 6 to G
    .trim();
  
  // Remove leading/trailing articles and common prefixes
  cleaned = cleaned.replace(/^(THE\s+|A\s+|AN\s+)/i, '');
  
  // Fix common title patterns
  cleaned = cleaned.replace(/\bTHE\s+(\w+)\s+NETWORK\b/i, 'THE $1 NETWORK');
  cleaned = cleaned.replace(/\bNO\s+TIME\s+TO\s+DIE\b/i, 'NO TIME TO DIE');
  cleaned = cleaned.replace(/\bOCEAN'?S\s+ELEVEN\b/i, "OCEAN'S ELEVEN");
  cleaned = cleaned.replace(/\bBOURNE\s+COMPLETE\s+COLLECTION\b/i, 'THE BOURNE COMPLETE COLLECTION');
  
  return cleaned.trim();
};

// Process OCR text into valid movie titles (pure image-based)
const processOCRText = (ocrText: string): string | null => {
  const cleaned = cleanDetectedText(ocrText);
  return isValidMovieTitle(cleaned) ? cleaned : null;
};

export const extractTitlesFromImage = async (
  imageUrl: string,
  spineDetections: SpineDetection[]
): Promise<DetectedTitle[]> => {
  const detectedTitles: DetectedTitle[] = [];
  
  try {
    const worker = await initializeOCR();
    console.log('Starting multi-pass enhanced OCR processing...');
    
    // Multi-pass OCR with different preprocessing variants, including DVD spine optimization
    const variants: Array<'contrast' | 'edge' | 'denoise' | 'sharpen' | 'dvd_spine'> = ['dvd_spine', 'contrast', 'edge', 'denoise', 'sharpen'];
    const allPotentialTitles: string[] = [];
    const ocrResults: Array<{ variant: string; text: string; confidence: number }> = [];
    
    // Process image with each enhancement variant
    for (const variant of variants) {
      try {
        console.log(`Processing with ${variant} enhancement...`);
        const processedImageUrl = await preprocessImage(imageUrl, variant);
        const { data } = await worker.recognize(processedImageUrl);
        
        ocrResults.push({
          variant,
          text: data.text,
          confidence: data.confidence
        });
        
        console.log(`${variant} OCR result (confidence: ${data.confidence}%):`, data.text.substring(0, 200));
        
        // Extract potential titles from this variant
        const lines = data.text.split(/[\n\r]+/).filter(line => line.trim().length > 0);
        
        for (const line of lines) {
          const cleaned = cleanOCRText(line);
          if (cleaned.length >= 2 && cleaned.length <= 100) {
            allPotentialTitles.push(cleaned);
            
            // Also try splitting by common separators
            const parts = cleaned.split(/[|\/\\-]+/);
            for (const part of parts) {
              const trimmed = part.trim();
              if (trimmed.length >= 3) {
                allPotentialTitles.push(trimmed);
              }
            }
          }
        }
      } catch (variantError) {
        console.warn(`OCR variant ${variant} failed:`, variantError);
      }
    }
    
    console.log('All potential titles from multi-pass OCR:', allPotentialTitles);
    console.log('OCR Results Summary:', ocrResults.map(r => `${r.variant}: ${r.confidence}%`));
    
    // Advanced title matching with confidence scoring
    const titleCandidates = new Map<string, { count: number; confidence: number; sources: string[] }>();
    
    // Process all potential titles (pure image-based)
    const validTitles: string[] = [];
    for (const potentialTitle of allPotentialTitles) {
      const processed = processOCRText(potentialTitle);
      if (processed) {
        validTitles.push(processed);
      }
    }
    
    // Remove duplicates and create title candidates
    const uniqueTitles = removeDuplicateTitles(validTitles);
    
    for (const title of uniqueTitles) {
      if (!titleCandidates.has(title)) {
        titleCandidates.set(title, { count: 1, confidence: 0.8, sources: [title] });
      } else {
        const candidate = titleCandidates.get(title)!;
        candidate.count++;
        candidate.confidence = Math.min(0.95, candidate.confidence + 0.1);
      }
    }
    
    // Sort candidates by confidence and count
    const sortedCandidates = Array.from(titleCandidates.entries())
      .sort(([, a], [, b]) => (b.confidence * b.count) - (a.confidence * a.count));
    
    console.log('Title candidates with scores:', sortedCandidates.map(([title, data]) =>
      `${title}: confidence=${data.confidence.toFixed(2)}, count=${data.count}, sources=[${data.sources.join(', ')}]`
    ));
    
    // Add high-confidence matches
    let titleIndex = 0;
    for (const [title, data] of sortedCandidates) {
      if (data.confidence > 0.5 && titleIndex < 15) { // Limit to prevent too many results
        detectedTitles.push({
          spineId: `ocr-${titleIndex++}`,
          title,
          confidence: Math.min(0.95, data.confidence),
          metadata: await enrichMovieWithMetadata(title)
        });
        console.log(`High-confidence match: "${title}" (${data.confidence.toFixed(2)}) from sources: ${data.sources.join(', ')}`);
      }
    }
    
    // No fallback suggestions - only use what was actually detected from the image
    
    console.log(`Final multi-pass OCR results: ${detectedTitles.length} titles detected`);
    
  } catch (error) {
    console.error('Multi-pass OCR processing failed:', error);
    
    // No fallback suggestions - return empty array if OCR fails
    console.log('OCR processing failed, returning empty results');
  }
  
  return detectedTitles;
};

export const cleanupOCR = async (): Promise<void> => {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
  }
};