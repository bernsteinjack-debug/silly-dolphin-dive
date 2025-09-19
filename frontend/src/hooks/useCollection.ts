import { useState, useEffect } from 'react';
import { Movie, Collection, SpineDetection } from '@/types/collection';

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
        parsed.movies = parsed.movies.map((movie: any) => ({
          ...movie,
          addedAt: new Date(movie.addedAt)
        }));
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

  const addMovie = (title: string, spinePosition?: { x: number; y: number }) => {
    const newMovie: Movie = {
      id: `movie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
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
    removeMovie,
    updateShelfImage,
    clearCollection
  };
};