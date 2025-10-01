// Comprehensive movie metadata service with rich information
export interface MovieMetadata {
  title: string;
  releaseYear: number;
  genre: string;
  director: string;
  runtime: number;
  rating: string;
  imdbRating: number;
  studio: string;
  format: string;
  language: string;
  cast: string[];
  plot: string;
  awards?: string;
  boxOffice?: string;
  country: string;
  poster?: string;
}

// Function to fetch metadata for a movie title from the backend API
export const fetchMovieMetadata = async (title: string): Promise<MovieMetadata | null> => {
  try {
    const response = await fetch(`/api/v1/movies/metadata/${encodeURIComponent(title)}`);
    if (!response.ok) {
      console.error(`[MovieMetadata] API error for "${title}": ${response.statusText}`);
      return null;
    }
    const metadata: MovieMetadata = await response.json();
    return metadata;
  } catch (error) {
    console.error(`[MovieMetadata] Network error fetching metadata for "${title}":`, error);
    return null;
  }
};

// Function to enrich a movie with metadata
export const enrichMovieWithMetadata = async (movieTitle: string): Promise<Partial<MovieMetadata>> => {
  try {
    console.log('[MovieMetadata] Enriching metadata for:', movieTitle);
    
    if (!movieTitle || typeof movieTitle !== 'string') {
      console.warn('[MovieMetadata] Invalid movie title provided:', movieTitle);
      return {
        title: 'Unknown Title',
        format: "Blu-ray",
        language: "English"
      };
    }
    
    const metadata = await fetchMovieMetadata(movieTitle);
    if (metadata) {
      console.log('[MovieMetadata] Found metadata for:', movieTitle);
      return metadata;
    }
    
    console.log('[MovieMetadata] No metadata found for:', movieTitle, 'using defaults');
    // Return basic defaults if no metadata found
    return {
      title: movieTitle,
      format: "Blu-ray",
      language: "English"
    };
  } catch (error) {
    console.error('[MovieMetadata] Error enriching metadata for:', movieTitle, error);
    return {
      title: movieTitle || 'Unknown Title',
      format: "Blu-ray",
      language: "English"
    };
  }
};

// Function to format runtime for display
export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

// Function to format box office for display
export const formatBoxOffice = (boxOffice: string): string => {
  return boxOffice.replace(/\$(\d+(?:\.\d+)?)([MBK])/g, (match, num, suffix) => {
    const suffixMap: Record<string, string> = {
      'K': ' thousand',
      'M': ' million',
      'B': ' billion'
    };
    return `$${num}${suffixMap[suffix] || suffix}`;
  });
};

// Function to get genre color for display
export const getGenreColor = (genre: string): string => {
  const genreColors: Record<string, string> = {
    'Action': 'bg-red-100 text-red-700',
    'Adventure': 'bg-orange-100 text-orange-700',
    'Comedy': 'bg-yellow-100 text-yellow-700',
    'Crime': 'bg-gray-100 text-gray-700',
    'Drama': 'bg-blue-100 text-blue-700',
    'Fantasy': 'bg-purple-100 text-purple-700',
    'Horror': 'bg-red-100 text-red-800',
    'Romance': 'bg-pink-100 text-pink-700',
    'Sci-Fi': 'bg-indigo-100 text-indigo-700',
    'Thriller': 'bg-gray-100 text-gray-800',
    'War': 'bg-red-100 text-red-800',
    'Western': 'bg-amber-100 text-amber-700'
  };
  return genreColors[genre] || 'bg-gray-100 text-gray-700';
};

// Function to get rating color for display
export const getRatingColor = (rating: string): string => {
  const ratingColors: Record<string, string> = {
    'G': 'bg-green-100 text-green-700',
    'PG': 'bg-blue-100 text-blue-700',
    'PG-13': 'bg-yellow-100 text-yellow-700',
    'R': 'bg-red-100 text-red-700',
    'NC-17': 'bg-red-100 text-red-800',
    'TV-14': 'bg-purple-100 text-purple-700',
    'TV-MA': 'bg-red-100 text-red-700'
  };
  return ratingColors[rating] || 'bg-gray-100 text-gray-700';
};

// Function to format cast list for display
export const formatCastList = (cast: string[], maxLength: number = 2): string => {
  if (!cast || cast.length === 0) return '';
  
  if (cast.length <= maxLength) {
    return cast.join(', ');
  }
  
  return `${cast.slice(0, maxLength).join(', ')} +${cast.length - maxLength} more`;
};

// Function to get decade from year
export const getDecade = (year: number): string => {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
};

// Function to calculate movie age
export const getMovieAge = (year: number): string => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age === 0) return 'This year';
  if (age === 1) return '1 year ago';
  if (age < 10) return `${age} years ago`;
  if (age < 20) return `${age} years ago`;
  if (age < 30) return `${age} years ago (${getDecade(year)})`;
  return `${age} years ago (Classic ${getDecade(year)})`;
};