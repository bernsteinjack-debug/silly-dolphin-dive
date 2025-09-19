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

  const generateCatalogImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sortedMovies = [...movies].sort((a, b) => a.title.localeCompare(b.title));
    
    // Calculate grid dimensions
    const cols = 3;
    const rows = Math.ceil(sortedMovies.length / cols);
    const cellWidth = 240;
    const cellHeight = 60;
    const padding = 40;
    const headerHeight = 120;
    const footerHeight = 60;
    
    // Set canvas size
    canvas.width = (cols * cellWidth) + (padding * 2);
    canvas.height = headerHeight + (rows * cellHeight) + footerHeight + (padding * 2);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('My Movie Catalog', canvas.width / 2, 60);

    // Subtitle
    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${movies.length} Movies`, canvas.width / 2, 90);

    // Movies grid
    ctx.textAlign = 'left';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#374151';

    sortedMovies.forEach((movie, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + (col * cellWidth);
      const y = headerHeight + padding + (row * cellHeight) + 25;

      // Movie title with proper text wrapping
      const maxWidth = cellWidth - 20;
      const words = movie.title.split(' ');
      let line = '';
      let lineY = y;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, lineY);
          line = words[n] + ' ';
          lineY += 20;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, lineY);

      // Add subtle separator line
      if (index < sortedMovies.length - 1 && (index + 1) % cols !== 0) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + cellWidth - 10, y - 15);
        ctx.lineTo(x + cellWidth - 10, y + 15);
        ctx.stroke();
      }
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Created with Snap Your Shelf', canvas.width / 2, canvas.height - 30);

    // Add subtle border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  };

  const downloadImage = () => {
    generateCatalogImage();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'my-movie-catalog.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const shareImage = async () => {
    generateCatalogImage();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'my-movie-catalog.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My Movie Catalog',
              text: `Check out my collection of ${movies.length} movies!`,
              files: [file]
            });
            return;
          }
        }

        // Fallback: download the image
        downloadImage();
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error sharing:', error);
      downloadImage();
    }
  };

  React.useEffect(() => {
    if (isOpen && movies.length > 0) {
      // Small delay to ensure canvas is rendered
      setTimeout(generateCatalogImage, 100);
    }
  }, [isOpen, movies]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Your Catalog</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-gray-600">
            Your catalog will be exported as a clean, shareable image perfect for social media.
          </p>
          
          <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-96 border rounded"
              style={{ display: 'block' }}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={downloadImage} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Image
            </Button>
            <Button onClick={shareImage} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Share2 className="w-4 h-4" />
              Share Catalog
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;