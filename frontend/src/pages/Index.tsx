import React, { useState, useEffect } from 'react';
import PhotoCapture from '@/components/PhotoCapture';
import CatalogView from '@/components/CatalogView';
import TitleEntryModal from '@/components/TitleEntryModal';
import ShareModal from '@/components/ShareModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useCollection } from '@/hooks/useCollection';
import { SpineDetection } from '@/types/collection';
import { DetectedTitle } from '@/services/hybridVisionService';
import { showSuccess } from '@/utils/toast';

type AppState = 'capture' | 'catalog' | 'adding';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('capture');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<SpineDetection[]>([]);
  const [detectedTitles, setDetectedTitles] = useState<DetectedTitle[]>([]);
  const [selectedSpine, setSelectedSpine] = useState<string | null>(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<{ id: string; title: string } | null>(null);
  
  const { collection, addMovie, updateMovie, removeMovie, updateShelfImage, clearCollection } = useCollection();

  // Automatically switch to catalog view if there are movies (only on initial load)
  useEffect(() => {
    if (collection.movies.length > 0 && appState === 'capture') {
      setAppState('catalog');
    }
  }, [collection.movies.length]); // Removed appState dependency to prevent blocking manual navigation

  const handlePhotoCapture = (imageUrl: string, spineDetections: SpineDetection[], titles: DetectedTitle[] = []) => {
    setCurrentImage(imageUrl);
    setDetections(spineDetections);
    setDetectedTitles(titles);
    updateShelfImage(imageUrl);
    
    // Automatically add all detected titles to the collection with metadata
    titles.forEach((detectedTitle, index) => {
      const spine = spineDetections[index];
      const spinePosition = spine ? { x: spine.x, y: spine.y } : undefined;
      
      // Create movie data with metadata if available
      const movieData = {
        title: detectedTitle.title,
        ...(detectedTitle.metadata && {
          releaseYear: detectedTitle.metadata.releaseYear,
          genre: detectedTitle.metadata.genre,
          director: detectedTitle.metadata.director,
          runtime: detectedTitle.metadata.runtime,
          rating: detectedTitle.metadata.rating,
          imdbRating: detectedTitle.metadata.imdbRating,
          studio: detectedTitle.metadata.studio,
          format: detectedTitle.metadata.format,
          language: detectedTitle.metadata.language,
          cast: detectedTitle.metadata.cast,
          plot: detectedTitle.metadata.plot,
          awards: detectedTitle.metadata.awards,
          boxOffice: detectedTitle.metadata.boxOffice,
          country: detectedTitle.metadata.country,
          poster: detectedTitle.metadata.poster
        })
      };
      
      addMovie(movieData, spinePosition);
    });
    
    // Show success message
    if (titles.length > 0) {
      showSuccess(`Added ${titles.length} movies to your catalog!`);
    }
    
    // Go directly to catalog view
    setAppState('catalog');
  };

  const handleSpineClick = (spineId: string) => {
    // Check if this spine has a detected title
    const detectedTitle = detectedTitles.find(dt => dt.spineId === spineId);
    
    if (detectedTitle) {
      // Automatically add the detected title
      const spine = detections.find(d => d.id === spineId);
      const spinePosition = spine ? { x: spine.x, y: spine.y } : undefined;
      
      // Create movie data with metadata if available
      const movieData = {
        title: detectedTitle.title,
        ...(detectedTitle.metadata && {
          releaseYear: detectedTitle.metadata.releaseYear,
          genre: detectedTitle.metadata.genre,
          director: detectedTitle.metadata.director,
          runtime: detectedTitle.metadata.runtime,
          rating: detectedTitle.metadata.rating,
          imdbRating: detectedTitle.metadata.imdbRating,
          studio: detectedTitle.metadata.studio,
          format: detectedTitle.metadata.format,
          language: detectedTitle.metadata.language,
          cast: detectedTitle.metadata.cast,
          plot: detectedTitle.metadata.plot,
          awards: detectedTitle.metadata.awards,
          boxOffice: detectedTitle.metadata.boxOffice,
          country: detectedTitle.metadata.country,
          poster: detectedTitle.metadata.poster
        })
      };
      
      addMovie(movieData, spinePosition);
      
      // Remove the spine from detections since it's now cataloged
      setDetections(prev => prev.filter(d => d.id !== spineId));
      setDetectedTitles(prev => prev.filter(dt => dt.spineId !== spineId));
      
      showSuccess(`Added "${detectedTitle.title}" to your catalog!`);
    } else {
      // No detected title, show manual entry modal
      setSelectedSpine(spineId);
      setShowTitleModal(true);
    }
  };

  const handleTitleSave = (movieData: {
    title: string;
    releaseYear?: number;
    genre?: string;
    director?: string;
    runtime?: number;
    rating?: string;
    format?: string;
    personalRating?: number;
    notes?: string;
  }) => {
    if (selectedSpine) {
      const spine = detections.find(d => d.id === selectedSpine);
      const spinePosition = spine ? { x: spine.x, y: spine.y } : undefined;
      
      addMovie(movieData, spinePosition);
      
      // Remove the spine from detections since it's now cataloged
      setDetections(prev => prev.filter(d => d.id !== selectedSpine));
      setDetectedTitles(prev => prev.filter(dt => dt.spineId !== selectedSpine));
      
      showSuccess(`Added "${movieData.title}" to your catalog!`);
    }
    setSelectedSpine(null);
  };

  const handleFinishAdding = () => {
    setAppState('catalog');
    setCurrentImage(null);
    setDetections([]);
    setDetectedTitles([]);
  };

  const handleTakeNewPhoto = () => {
    setAppState('capture');
    setCurrentImage(null);
    setDetections([]);
    setDetectedTitles([]);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleEditMovie = (movieId: string, movieData: {
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
    updateMovie(movieId, movieData);
    showSuccess('Movie updated!');
  };

  const handleDeleteMovie = (movieId: string) => {
    const movie = collection.movies.find(m => m.id === movieId);
    if (movie) {
      setMovieToDelete({ id: movieId, title: movie.title });
      setShowConfirmDialog(true);
    }
  };

  const handleDeleteMultipleMovies = (movieIds: string[]) => {
    if (movieIds.length === 0) return;
    
    const movieTitles = movieIds
      .map(id => collection.movies.find(m => m.id === id)?.title)
      .filter(Boolean);
    
    setMovieToDelete({
      id: movieIds.join(','), // Store multiple IDs as comma-separated string
      title: `${movieIds.length} movies (${movieTitles.slice(0, 3).join(', ')}${movieIds.length > 3 ? '...' : ''})`
    });
    setShowConfirmDialog(true);
  };

  const confirmDeleteMovie = () => {
    if (movieToDelete) {
      const movieIds = movieToDelete.id.split(',');
      
      if (movieIds.length === 1) {
        // Single movie deletion
        removeMovie(movieToDelete.id);
        showSuccess('Movie deleted from catalog!');
      } else {
        // Multiple movie deletion
        movieIds.forEach(id => removeMovie(id));
        showSuccess(`${movieIds.length} movies deleted from catalog!`);
      }
      
      setMovieToDelete(null);
      setShowConfirmDialog(false);
    }
  };

  const cancelDeleteMovie = () => {
    setMovieToDelete(null);
    setShowConfirmDialog(false);
  };


  // Show photo capture if no movies or user wants to add more
  if (appState === 'capture') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Snap Your Shelf</h1>
            <p className="text-base sm:text-lg text-gray-600 px-2">
              Transform your physical collection into a digital catalog
            </p>
          </div>
          <PhotoCapture onPhotoCapture={handlePhotoCapture} />
          
          {/* Navigation and Demo Buttons */}
          <div className="text-center mt-8 space-y-4">
            {/* View Catalog Link - only show if user has movies */}
            {collection.movies.length > 0 && (
              <div>
                <button
                  onClick={() => setAppState('catalog')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Movie Catalogue ({collection.movies.length} movies)
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    );
  }

  // Show spine detection and title entry
  if (appState === 'adding' && currentImage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Your Movies</h2>
            <p className="text-gray-600">
              Tap the [+] icons to add titles. {detections.length} spines remaining.
            </p>
          </div>

          <div className="relative mb-6">
            <img 
              src={currentImage} 
              alt="Your shelf" 
              className="w-full h-auto max-h-96 object-contain mx-auto rounded-lg shadow-lg"
            />
            
            {/* Spine detection overlays */}
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-pointer hover:bg-blue-500/30 transition-colors rounded"
                style={{
                  left: `${detection.x}%`,
                  top: `${detection.y}%`,
                  width: `${detection.width}%`,
                  height: `${detection.height}%`,
                }}
                onClick={() => handleSpineClick(detection.id)}
              >
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg">
                  +
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleTakeNewPhoto}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Take New Photo
            </button>
            <button
              onClick={handleFinishAdding}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Catalog ({collection.movies.length} movies)
            </button>
          </div>
        </div>

        <TitleEntryModal
          isOpen={showTitleModal}
          onClose={() => setShowTitleModal(false)}
          onSave={handleTitleSave}
          spineId={selectedSpine || ''}
        />
      </div>
    );
  }

  // Show catalog view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <CatalogView
          movies={collection.movies}
          onTakeNewPhoto={handleTakeNewPhoto}
          onShare={handleShare}
          onEditMovie={handleEditMovie}
          onDeleteMovie={handleDeleteMovie}
          onDeleteMultipleMovies={handleDeleteMultipleMovies}
        />
        
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          movies={collection.movies}
        />
        
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title="Delete Movie"
          message={`Are you sure you want to delete "${movieToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteMovie}
          onCancel={cancelDeleteMovie}
        />
      </div>
    </div>
  );
};

export default Index;