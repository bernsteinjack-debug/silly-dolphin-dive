import React, { useState } from 'react';
import PhotoCapture from '@/components/PhotoCapture';
import CollectionView from '@/components/CollectionView';
import TitleEntryModal from '@/components/TitleEntryModal';
import ShareModal from '@/components/ShareModal';
import { useCollection } from '@/hooks/useCollection';
import { SpineDetection } from '@/types/collection';
import { showSuccess } from '@/utils/toast';

type AppState = 'capture' | 'catalog' | 'collection';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('collection');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<SpineDetection[]>([]);
  const [selectedSpine, setSelectedSpine] = useState<string | null>(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const { collection, addMovie, updateShelfImage } = useCollection();

  const handlePhotoCapture = (imageUrl: string, spineDetections: SpineDetection[]) => {
    setCurrentImage(imageUrl);
    setDetections(spineDetections);
    updateShelfImage(imageUrl);
    setAppState('catalog');
  };

  const handleSpineClick = (spineId: string) => {
    setSelectedSpine(spineId);
    setShowTitleModal(true);
  };

  const handleTitleSave = (title: string) => {
    if (selectedSpine) {
      const spine = detections.find(d => d.id === selectedSpine);
      const spinePosition = spine ? { x: spine.x, y: spine.y } : undefined;
      
      addMovie(title, spinePosition);
      
      // Remove the spine from detections since it's now cataloged
      setDetections(prev => prev.filter(d => d.id !== selectedSpine));
      
      showSuccess(`Added "${title}" to your collection!`);
    }
    setSelectedSpine(null);
  };

  const handleFinishCataloging = () => {
    setAppState('collection');
    setCurrentImage(null);
    setDetections([]);
  };

  const handleAddMore = () => {
    setAppState('capture');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  // Determine which state to show
  if (appState === 'capture' || (appState === 'collection' && collection.movies.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PhotoCapture onPhotoCapture={handlePhotoCapture} />
      </div>
    );
  }

  if (appState === 'catalog' && currentImage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Add Your Movies</h2>
            <p className="text-gray-600">
              Tap the [+] icons to add titles. {detections.length} spines remaining.
            </p>
          </div>

          <div className="relative">
            <img 
              src={currentImage} 
              alt="Captured shelf" 
              className="w-full h-auto max-h-96 object-contain mx-auto rounded-lg"
            />
            
            {/* Spine detection overlays */}
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-pointer hover:bg-blue-500/30 transition-colors"
                style={{
                  left: `${detection.x}%`,
                  top: `${detection.y}%`,
                  width: `${detection.width}%`,
                  height: `${detection.height}%`,
                }}
                onClick={() => handleSpineClick(detection.id)}
              >
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-blue-700 transition-colors">
                  +
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleFinishCataloging}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Finish & View Collection ({collection.movies.length} movies)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <CollectionView
        movies={collection.movies}
        onAddMore={handleAddMore}
        onShare={handleShare}
      />
      
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        movies={collection.movies}
      />
    </div>
  );
};

export default Index;