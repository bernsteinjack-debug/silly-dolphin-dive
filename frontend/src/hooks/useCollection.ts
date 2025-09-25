import { useState, useEffect } from 'react';
import { Movie, Collection, SpineDetection } from '@/types/collection';
import { enrichMovieWithMetadata } from '@/services/movieMetadataService';

const STORAGE_KEY = 'snap-your-shelf-collection';

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
        parsed.movies = parsed.movies.map((movie: any) => {
          const movieWithDates = {
            ...movie,
            addedAt: new Date(movie.addedAt)
          };
          
          // Check if movie lacks metadata (only has basic fields)
          const hasMetadata = movie.releaseYear || movie.genre || movie.director || movie.runtime || movie.imdbRating;
          
          if (!hasMetadata && movie.title) {
            // Enrich with metadata from database
            const enrichedMetadata = enrichMovieWithMetadata(movie.title);
            return {
              ...enrichedMetadata,
              ...movieWithDates // Keep original data and dates
            };
          }
          
          return movieWithDates;
        });
        
        setCollection(parsed);
      } catch (error) {
        console.error('Error loading collection from storage:', error);
      }
    }
  }, []);

  // Save collection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  }, [collection]);

  const addMovie = (movieData: {
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
  }, spinePosition?: { x: number; y: number }) => {
    // Enrich with metadata from database if not already provided
    const enrichedMetadata = enrichMovieWithMetadata(movieData.title);
    
    const newMovie: Movie = {
      id: `movie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // First apply enriched metadata, then override with provided data
      ...enrichedMetadata,
      ...movieData,
      addedAt: new Date(),
      spinePosition
    };

    setCollection(prev => ({
      ...prev,
      movies: [...prev.movies, newMovie],
      updatedAt: new Date()
    }));

    return newMovie;
  };

  const updateMovie = (movieId: string, movieData: {
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
    setCollection(prev => ({
      ...prev,
      movies: prev.movies.map(movie => {
        if (movie.id === movieId) {
          // If title changed, enrich with new metadata
          const shouldEnrich = movie.title !== movieData.title;
          const enrichedMetadata = shouldEnrich ? enrichMovieWithMetadata(movieData.title) : {};
          
          return {
            ...movie,
            // Apply enriched metadata first if title changed
            ...(shouldEnrich ? enrichedMetadata : {}),
            // Then apply the provided updates
            ...movieData
          };
        }
        return movie;
      }),
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