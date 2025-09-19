import React, { useState } from 'react';
import PhotoCapture from '@/components/PhotoCapture';
import CatalogView from '@/components/CatalogView';
import TitleEntryModal from '@/components/TitleEntryModal';
import ShareModal from '@/components/ShareModal';
import { useCollection } from '@/hooks/useCollection';
import { SpineDetection } from '@/types/collection';
import { DetectedTitle } from '@/services/ocrService';
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
  
  const { collection, addMovie, updateShelfImage } = useCollection();

  const handlePhotoCapture = (imageUrl: string, spineDetections: SpineDetection[], titles: DetectedTitle[] = []) => {
    setCurrentImage(imageUrl);
    setDetections(spineDetections);
    setDetectedTitles(titles);
    updateShelfImage(imageUrl);
    setAppState('adding');
  };

  const handleSpineClick = (spineId: string) => {
    // Check if this spine has a detected title
    const detectedTitle = detectedTitles.find(dt => dt.spineId === spineId);
    
    if (detectedTitle) {
      // Automatically add the detected title
      const spine = detections.find(d => d.id === spineId);
      const spinePosition = spine ? { x: spine.x, y: spine.y } : undefined;
      
      addMovie(detectedTitle.title, spinePosition);
      
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

  const handleTitleSave = (title: string) => {
    if (selectedSpine) {
      const spine = detections.find(d => d.id === selectedSpine);
      const spinePosition = spine ? { x: spine.x, y: spine.y } : undefined;
      
      addMovie(title, spinePosition);
      
      // Remove the spine from detections since it's now cataloged
      setDetections(prev => prev.filter(d => d.id !== selectedSpine));
      setDetectedTitles(prev => prev.filter(dt => dt.spineId !== selectedSpine));
      
      showSuccess(`Added "${title}" to your catalog!`);
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

  // Show photo capture if no movies or user wants to add more
  if (appState === 'capture') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Snap Your Shelf</h1>
            <p className="text-lg text-gray-600">
              Transform your physical collection into a digital catalog
            </p>
          </div>
          <PhotoCapture onPhotoCapture={handlePhotoCapture} />
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
      <div className="container mx-auto px-4 py-8">
        <CatalogView
          movies={collection.movies}
          onTakeNewPhoto={handleTakeNewPhoto}
          onShare={handleShare}
        />
        
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          movies={collection.movies}
        />
      </div>
    </div>
  );
};

export default Index;