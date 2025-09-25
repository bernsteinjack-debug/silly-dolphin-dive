// Pure image-based detection - no hardcoded movie database
// This file now only contains utility functions for text processing

// Simple string similarity calculation for deduplication
export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance calculation for similarity matching
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

// Clean and normalize detected text for better processing - less aggressive
export const cleanDetectedText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[^\w\s&:'-.,()]/g, '') // Remove special characters except common ones
    .replace(/\b(DVD|BLU-?RAY|4K|ULTRA\s*HD|HD|DIGITAL|COPY|DISC)\b/gi, '') // Remove only obvious media format text
    .replace(/\b(PG-?13|PG|R|NC-?17|G|RATED|UNRATED)\b/gi, '') // Remove ratings
    .trim();
};

// Check if detected text looks like a valid movie title - more permissive
export const isValidMovieTitle = (text: string): boolean => {
  const cleaned = cleanDetectedText(text);
  
  // Must be at least 2 characters
  if (cleaned.length < 2) return false;
  
  // Must not be too long (likely not a title)
  if (cleaned.length > 120) return false; // More permissive length
  
  // Must not be just numbers
  if (/^\d+$/.test(cleaned)) return false;
  
  // Must not be single characters
  if (/^[A-Z]$/.test(cleaned)) return false;
  
  // Only filter out the most obvious non-titles
  if (/^(AND|OR|OF|IN|ON|AT|TO|FOR|WITH|BY)$/i.test(cleaned)) return false;
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(cleaned)) return false;
  
  return true;
};

// Remove duplicate titles based on similarity - slightly more permissive
export const removeDuplicateTitles = (titles: string[]): string[] => {
  const unique: string[] = [];
  
  for (const title of titles) {
    let isDuplicate = false;
    
    for (const existing of unique) {
      if (calculateSimilarity(title.toLowerCase(), existing.toLowerCase()) > 0.85) { // Slightly higher threshold
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      unique.push(title);
    }
  }
  
  return unique;
};