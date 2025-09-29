import { SpineDetection } from '@/types/collection';
import { enrichMovieWithMetadata } from './movieMetadataService';

// DetectedTitle interface (matching backend format)
export interface DetectedTitle {
  spineId: string;
  title: string;
  confidence: number;
  isManuallyEdited?: boolean;
  metadata?: any;
}

export interface HybridDetectionResult {
  titles: DetectedTitle[];
  sources: {
    ai: DetectedTitle[];
    ocr: DetectedTitle[];
    googleVision: DetectedTitle[];
    combined: DetectedTitle[];
  };
  processingTime: number;
  confidence: number;
}

// Advanced fuzzy matching for title consolidation
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[j] = j;
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


// Enhanced title validation (pure image-based, no database matching)
const validateAndEnhanceTitles = async (titles: DetectedTitle[]): Promise<DetectedTitle[]> => {
  const enhanced: DetectedTitle[] = [];
  
  for (const title of titles) {
    // Keep original title and enrich with metadata
    const enrichedTitle: DetectedTitle = {
      ...title,
      metadata: await enrichMovieWithMetadata(title.title)
    };
    enhanced.push(enrichedTitle);
  }
  
  return enhanced;
};

// Backend API configuration
const getBackendUrl = (): string => {
  // Check if we're in development mode
  // if (import.meta.env.DEV) {
    // Use environment variable for development
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
  // }
  // In production, use relative URLs, letting the browser handle the host
  // return '';
};

// Call backend API for image processing
const callBackendImageProcessing = async (imageUrl: string): Promise<DetectedTitle[]> => {
  const baseUrl = getBackendUrl();
  const fullUrl = `${baseUrl}/api/v1/ai-vision/process-image`;
  
  try {
    console.log('🚀 Calling backend AI vision service at:', fullUrl);
    
    // Convert image URL to base64 if needed
    let base64Image = imageUrl;
    if (imageUrl.startsWith('data:')) {
      base64Image = imageUrl.split(',');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real app, you'd need to handle authentication here
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        image: {
          data: base64Image
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `Backend API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage += `. ${errorText}`;
        }
      } catch (e) {
        // Ignore error reading response body
      }
      
      // Provide more specific error messages
      if (response.status === 401) {
        errorMessage = 'Authentication required. Please log in to use AI vision features.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You may not have permission to use AI vision features.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 500) {
        errorMessage = 'Backend server error. The AI vision service may be temporarily unavailable.';
      } else if (response.status === 503) {
        errorMessage = 'AI vision service is temporarily unavailable. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Backend API response:', data);
    
    if (data.status === 'failed') {
      const errorMessage = data.message || 'Backend processing failed for unknown reasons';
      
      // Check for specific error types
      if (data.processing_errors && data.processing_errors.length > 0) {
        const errors = data.processing_errors.join(', ');
        throw new Error(`AI vision processing failed: ${errors}`);
      }
      
      throw new Error(`Backend processing failed: ${errorMessage}`);
    }
    
    // Validate response data
    if (!data.detected_titles || !Array.isArray(data.detected_titles)) {
      throw new Error('Invalid response format from backend API');
    }
    
    // Convert backend format to frontend format
    const detectedTitles: DetectedTitle[] = data.detected_titles.map((title: any, index: number) => ({
      spineId: `backend-${index}`,
      title: title.title || 'Unknown Title',
      confidence: title.confidence || 0.5,
      metadata: title.metadata || {}
    }));
    
    console.log(`🎯 Backend processing complete: ${detectedTitles.length} titles detected`);
    return detectedTitles;
    
  } catch (error) {
    console.error('Backend API call failed:', error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to backend service. Please check your internet connection.');
    }
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The image processing is taking too long. Please try with a smaller image.');
    }
    
    // Re-throw the error with context
    throw error;
  }
};

export const extractTitlesWithHybridApproach = async (
  imageUrl: string,
  spineDetections: SpineDetection[] = []
): Promise<HybridDetectionResult> => {
  const startTime = Date.now();
  
  console.log('🚀 Starting backend AI vision processing...');
  
  try {
    // Call backend API for processing
    const backendTitles = await callBackendImageProcessing(imageUrl);
    
    // Enhance with metadata if needed
    const finalTitles = await validateAndEnhanceTitles(backendTitles);
    
    const processingTime = Date.now() - startTime;
    
    // Calculate overall confidence
    const avgConfidence = finalTitles.length > 0
      ? finalTitles.reduce((sum, t) => sum + t.confidence, 0) / finalTitles.length
      : 0;
    
    const result: HybridDetectionResult = {
      titles: finalTitles,
      sources: {
        ai: backendTitles,
        ocr: [],
        googleVision: backendTitles, // Backend uses both AI and Google Vision
        combined: backendTitles
      },
      processingTime,
      confidence: avgConfidence
    };
    
    console.log(`🎯 Backend processing complete: ${finalTitles.length} titles in ${processingTime}ms`);
    console.log(`Overall confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    return result;
    
  } catch (error) {
    console.error('Backend processing failed:', error);
    
    // Fallback: return empty result with error info
    return {
      titles: [],
      sources: { ai: [], ocr: [], googleVision: [], combined: [] },
      processingTime: Date.now() - startTime,
      confidence: 0
    };
  }
};

// Convenience function that matches the existing API
export const extractTitlesFromImage = async (
  imageUrl: string,
  spineDetections: SpineDetection[] = []
): Promise<DetectedTitle[]> => {
  const result = await extractTitlesWithHybridApproach(imageUrl, spineDetections);
  return result.titles;
};