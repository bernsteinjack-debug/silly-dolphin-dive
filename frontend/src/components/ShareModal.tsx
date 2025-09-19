import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { Movie } from '@/types/collection';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, movies }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCollectionImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = Math.max(600, movies.length * 30 + 200);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('My Movie Collection', canvas.width / 2, 60);

    // Subtitle
    ctx.font = '18px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${movies.length} Movies`, canvas.width / 2, 90);

    // Movies list
    ctx.textAlign = 'left';
    ctx.font = '16px Arial';
    ctx.fillStyle = '#374151';

    const sortedMovies = [...movies].sort((a, b) => a.title.localeCompare(b.title));
    
    sortedMovies.forEach((movie, index) => {
      const y = 140 + (index * 25);
      ctx.fillText(`• ${movie.title}`, 50, y);
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Created with Snap Your Shelf', canvas.width / 2, canvas.height - 30);
  };

  const downloadImage = () => {
    generateCollectionImage();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'my-movie-collection.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareImage = async () => {
    generateCollectionImage();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'my-movie-collection.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My Movie Collection',
              text: `Check out my collection of ${movies.length} movies!`,
              files: [file]
            });
            return;
          }
        }

        // Fallback: download the image
        downloadImage();
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing:', error);
      downloadImage();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      // Small delay to ensure canvas is rendered
      setTimeout(generateCollectionImage, 100);
    }
  }, [isOpen, movies]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Collection</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-96"
              style={{ display: 'block' }}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={downloadImage} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button onClick={shareImage} className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;