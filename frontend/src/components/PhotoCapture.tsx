import React, { useState, useRef } from 'react';
import { Camera, Upload, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SpineDetection } from '@/types/collection';
import { MOVIE_DATABASE } from '@/services/movieDatabase';

interface PhotoCaptureProps {
  onPhotoCapture: (imageUrl: string, detections: SpineDetection[], detectedTitles?: any[]) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoCapture }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [manualTitles, setManualTitles] = useState<string[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const handleTitleInput = (value: string) => {
    setCurrentTitle(value);
    
    if (value.length > 1) {
      // Filter movie database for suggestions
      const filtered = MOVIE_DATABASE
        .filter(movie => 
          movie.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().split(' ').some(word => 
            word.length > 2 && movie.toLowerCase().includes(word)
          )
        )
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const addTitle = (title: string) => {
    if (title.trim() && !manualTitles.includes(title.trim())) {
      setManualTitles(prev => [...prev, title.trim()]);
      setCurrentTitle('');
      setSuggestions([]);
    }
  };

  const removeTitle = (index: number) => {
    setManualTitles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTitle.trim()) {
      addTitle(currentTitle);
    }
  };

  const handleProceedWithPhoto = () => {
    if (capturedImage && manualTitles.length > 0) {
      // Create mock spine detections for the manually entered titles
      const mockDetections: SpineDetection[] = manualTitles.map((title, index) => ({
        id: `manual-${index}`,
        x: 10,
        y: 10 + (index * 10),
        width: 80,
        height: 8,
        confidence: 1.0
      }));

      // Create mock detected titles
      const mockDetectedTitles = manualTitles.map((title, index) => ({
        spineId: `manual-${index}`,
        title,
        confidence: 1.0
      }));

      onPhotoCapture(capturedImage, mockDetections, mockDetectedTitles);
    }
  };

  if (!capturedImage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <Camera className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="text-2xl font-bold">Capture Your Shelf</h2>
          <p className="text-gray-600 max-w-md">
            Take a photo of your Blu-ray/DVD shelf to get started. You'll then manually enter the titles you can see.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleCameraCapture} size="lg" className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Take Photo
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Image
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          capture="environment"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Add Your Movie Titles</h2>
        <p className="text-gray-600">
          Look at your shelf photo and manually enter the movie titles you can see.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Photo Display */}
        <Card className="overflow-hidden">
          <img 
            src={capturedImage} 
            alt="Your movie shelf" 
            className="w-full h-auto max-h-96 object-contain"
          />
        </Card>

        {/* Title Entry */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Movie Title</label>
            <div className="relative">
              <Input
                value={currentTitle}
                onChange={(e) => handleTitleInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a movie title..."
                className="pr-10"
              />
              <Button
                size="sm"
                onClick={() => addTitle(currentTitle)}
                disabled={!currentTitle.trim()}
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="border rounded-md bg-white shadow-sm max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => addTitle(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Added Titles */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Added Titles ({manualTitles.length})</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {manualTitles.map((title, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{title}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTitle(index)}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {manualTitles.length === 0 && (
                <p className="text-sm text-gray-500 italic">No titles added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => setCapturedImage(null)}>
          Retake Photo
        </Button>
        <Button 
          onClick={handleProceedWithPhoto} 
          disabled={manualTitles.length === 0}
        >
          Continue with {manualTitles.length} Titles
        </Button>
      </div>
    </div>
  );
};

export default PhotoCapture;