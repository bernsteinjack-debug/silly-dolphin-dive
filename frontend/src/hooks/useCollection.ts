import { useState, useEffect, useCallback } from 'react';
import { Movie, Collection, SpineDetection } from '@/types/collection';
import { enrichMovieWithMetadata } from '@/services/movieMetadataService';

const STORAGE_KEY = 'snap-your-shelf-collection';
const MAX_STORAGE_SIZE = 8 * 1024 * 1024; // 8MB conservative limit
const COMPRESSION_THRESHOLD = 1024 * 1024; // 1MB - start optimizing above this

// Storage optimization utilities
const compressImageData = (imageData: string): string => {
  // If it's a base64 image and too large, we'll store a placeholder
  if (imageData.startsWith('data:image/') && imageData.length > 100000) { // 100KB limit for images
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBUb28gTGFyZ2U8L3RleHQ+PC9zdmc+';
  }
  return imageData;
};

const optimizeMovieData = (movie: Movie): Movie => {
  const optimized = { ...movie };
  
  // Compress poster images
  if (optimized.poster) {
    optimized.poster = compressImageData(optimized.poster);
  }
  
  // Limit text fields to reasonable lengths
  if (optimized.plot && optimized.plot.length > 1000) {
    optimized.plot = optimized.plot.substring(0, 997) + '...';
  }
  
  if (optimized.notes && optimized.notes.length > 500) {
    optimized.notes = optimized.notes.substring(0, 497) + '...';
  }
  
  // Limit cast array
  if (optimized.cast && optimized.cast.length > 10) {
    optimized.cast = optimized.cast.slice(0, 10);
  }
  
  return optimized;
};

const optimizeCollectionData = (collection: Collection): Collection => {
  const optimized = { ...collection };
  
  // Compress shelf image
  if (optimized.shelfImage) {
    optimized.shelfImage = compressImageData(optimized.shelfImage);
  }
  
  // Optimize all movies
  optimized.movies = optimized.movies.map(optimizeMovieData);
  
  return optimized;
};

const getStorageSize = (data: string): number => {
  return new Blob([data]).size;
};

const saveToStorageWithFallback = (key: string, data: Collection): boolean => {
  try {
    let serializedData = JSON.stringify(data);
    let dataSize = getStorageSize(serializedData);
    
    console.log(`[Storage] Attempting to save ${(dataSize / (1024 * 1024)).toFixed(2)} MB`);
    
    // If data is too large, optimize it
    if (dataSize > MAX_STORAGE_SIZE) {
      console.warn('[Storage] Data too large, applying optimization...');
      const optimizedData = optimizeCollectionData(data);
      serializedData = JSON.stringify(optimizedData);
      dataSize = getStorageSize(serializedData);
      console.log(`[Storage] Optimized to ${(dataSize / (1024 * 1024)).toFixed(2)} MB`);
    }
    
    // Final check - if still too large, remove oldest movies
    if (dataSize > MAX_STORAGE_SIZE && data.movies.length > 0) {
      console.warn('[Storage] Still too large, removing oldest movies...');
      const reducedData = { ...data };
      
      while (getStorageSize(JSON.stringify(reducedData)) > MAX_STORAGE_SIZE && reducedData.movies.length > 10) {
        // Remove oldest movies (keep at least 10)
        reducedData.movies = reducedData.movies.slice(1);
      }
      
      serializedData = JSON.stringify(reducedData);
      dataSize = getStorageSize(serializedData);
      console.log(`[Storage] Reduced to ${reducedData.movies.length} movies, ${(dataSize / (1024 * 1024)).toFixed(2)} MB`);
    }
    
    localStorage.setItem(key, serializedData);
    console.log('[Storage] Successfully saved collection');
    return true;
    
  } catch (error) {
    console.error('[Storage] Failed to save collection:', error);
    
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[Storage] Quota exceeded - attempting emergency cleanup...');
      
      // Emergency cleanup: try to save just the movie titles and basic info
      try {
        const emergencyData = {
          ...data,
          shelfImage: undefined, // Remove shelf image
          movies: data.movies.map(movie => ({
            id: movie.id,
            title: movie.title,
            releaseYear: movie.releaseYear,
            genre: movie.genre,
            addedAt: movie.addedAt,
            // Remove all large fields
            poster: undefined,
            plot: undefined,
            cast: undefined,
            notes: undefined
          }))
        };
        
        localStorage.setItem(key, JSON.stringify(emergencyData));
        console.log('[Storage] Emergency save successful - some data was lost');
        return true;
        
      } catch (emergencyError) {
        console.error('[Storage] Emergency save also failed:', emergencyError);
        return false;
      }
    }
    
    return false;
  }
};

export const useCollection = () => {
  const [collection, setCollection] = useState<Collection>({
    id: 'default',
    name: 'My Collection',
    movies: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Load collection from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        
        // Enrich existing movies with metadata if they don't have it
        Promise.all(parsed.movies.map(async (movie: any) => {
          const movieWithDates = {
            ...movie,
            addedAt: new Date(movie.addedAt)
          };
          
          // Always enrich with the latest metadata from the database
          const enrichedMetadata = await enrichMovieWithMetadata(movie.title);
          
          return {
            ...movieWithDates, // Keep original data and dates
            ...enrichedMetadata // Overwrite with latest metadata
          };
        })).then(enrichedMovies => {
          setCollection({ ...parsed, movies: enrichedMovies });
        });
      } catch (error) {
        console.error('Error loading collection from storage:', error);
      }
    }
  }, []);

  // Debounced save function to prevent excessive localStorage writes
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (collectionToSave: Collection) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const success = saveToStorageWithFallback(STORAGE_KEY, collectionToSave);
          if (!success) {
            console.error('[Storage] Failed to save collection - data may be lost');
            // Could show user notification here
          }
        }, 500); // 500ms debounce
      };
    })(),
    []
  );

  // Save collection to localStorage whenever it changes (debounced)
  useEffect(() => {
    debouncedSave(collection);
  }, [collection, debouncedSave]);

  const addMovie = async (movieData: {
    title: string;
    releaseYear?: number;
    genre?: string;
    director?: string;
    runtime?: number;
    rating?: string;
    format?: string;
    personalRating?: number;
    notes?: string;
    poster?: string;
  }, spinePosition?: { x: number; y: number }): Promise<Movie> => {
    try {
      console.log('[useCollection] Adding movie:', movieData.title);
      
      // Enrich with metadata from database if not already provided
      const enrichedMetadata = await enrichMovieWithMetadata(movieData.title);
      console.log('[useCollection] Enriched metadata:', enrichedMetadata);
      
      const newMovie: Movie = {
        id: `movie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        // First apply enriched metadata, then override with provided data
        ...enrichedMetadata,
        ...movieData,
        addedAt: new Date(),
        spinePosition
      };

      console.log('[useCollection] New movie object:', newMovie);

      setCollection(prev => {
        console.log('[useCollection] Previous collection movies count:', prev.movies.length);
        const newCollection = {
          ...prev,
          movies: [...prev.movies, newMovie],
          updatedAt: new Date()
        };
        console.log('[useCollection] New collection movies count:', newCollection.movies.length);
        return newCollection;
      });

      return newMovie;
    } catch (error) {
      console.error('[useCollection] Error adding movie:', error);
      throw error;
    }
  };

  const updateMovie = async (movieId: string, movieData: {
    title: string;
    releaseYear?: number;
    genre?: string;
    director?: string;
    runtime?: number;
    rating?: string;
    format?: string;
    personalRating?: number;
    notes?: string;
    poster?: string;
  }) => {
    const updatedMovies = await Promise.all(collection.movies.map(async movie => {
      if (movie.id === movieId) {
        const shouldEnrich = movie.title !== movieData.title;
        const enrichedMetadata = shouldEnrich ? await enrichMovieWithMetadata(movieData.title) : {};
        return {
          ...movie,
          ...(shouldEnrich ? enrichedMetadata : {}),
          ...movieData
        };
      }
      return movie;
    }));

    setCollection(prev => ({
      ...prev,
      movies: updatedMovies,
      updatedAt: new Date()
    }));
  };

  const removeMovie = (movieId: string) => {
    setCollection(prev => ({
      ...prev,
      movies: prev.movies.filter(movie => movie.id !== movieId),
      updatedAt: new Date()
    }));
  };

  const updateShelfImage = (imageUrl: string) => {
    setCollection(prev => ({
      ...prev,
      shelfImage: imageUrl,
      updatedAt: new Date()
    }));
  };

  const clearCollection = () => {
    setCollection({
      id: 'default',
      name: 'My Collection',
      movies: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  return {
    collection,
    addMovie,
    updateMovie,
    removeMovie,
    updateShelfImage,
    clearCollection
  };
};