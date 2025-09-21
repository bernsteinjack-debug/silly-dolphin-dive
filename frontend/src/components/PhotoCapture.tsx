import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Edit2, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SpineDetection } from '@/types/collection';
import { extractTitlesFromImage, DetectedTitle } from '@/services/ocrService';
import { MOVIE_DATABASE } from '@/services/movieDatabase';

interface PhotoCaptureProps {
  onPhotoCapture: (imageUrl: string, detections: SpineDetection[], detectedTitles?: DetectedTitle[]) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoCapture }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedTitles, setDetectedTitles] = useState<DetectedTitle[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitleValue, setNewTitleValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
        setOcrError(null);
        
        setIsProcessingOCR(true);
        setOcrComplete(false);
        
        try {
          console.log('Starting OCR processing for uploaded image...');
          const titles = await extractTitlesFromImage(imageUrl, []);
          console.log('OCR processing complete. Found titles:', titles);
          setDetectedTitles(titles);
          setOcrComplete(true);
        } catch (error) {
          console.error('OCR processing failed:', error);
          setOcrError('Failed to process image. Please try again.');
        } finally {
          setIsProcessingOCR(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const handleEditTitle = (index: number) => {
    setEditingIndex(index);
    setEditValue(detectedTitles[index].title);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const updatedTitles = [...detectedTitles];
      updatedTitles[editingIndex] = {
        ...updatedTitles[editingIndex],
        title: editValue.trim(),
        confidence: 1.0,
        isManuallyEdited: true
      };
      setDetectedTitles(updatedTitles);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleRemoveTitle = (index: number) => {
    const updatedTitles = detectedTitles.filter((_, i) => i !== index);
    setDetectedTitles(updatedTitles);
  };

  const handleAddNewTitle = () => {
    setIsAddingNew(true);
    setNewTitleValue('');
    setSuggestions([]);
  };

  const handleNewTitleInput = (value: string) => {
    setNewTitleValue(value);
    
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

  const handleSaveNewTitle = (title?: string) => {
    const titleToAdd = title || newTitleValue.trim();
    if (titleToAdd && !detectedTitles.some(t => t.title === titleToAdd)) {
      const newTitle: DetectedTitle = {
        spineId: `manual-${Date.now()}`,
        title: titleToAdd,
        confidence: 1.0,
        isManuallyEdited: true
      };
      setDetectedTitles(prev => [...prev, newTitle]);
    }
    setIsAddingNew(false);
    setNewTitleValue('');
    setSuggestions([]);
  };

  const handleCancelNewTitle = () => {
    setIsAddingNew(false);
    setNewTitleValue('');
    setSuggestions([]);
  };

  const handleProceedWithPhoto = () => {
    if (capturedImage && detectedTitles.length > 0) {
      const mockDetections: SpineDetection[] = detectedTitles.map((title, index) => ({
        id: `detected-${index}`,
        x: 10,
        y: 10 + (index * 10),
        width: 80,
        height: 8,
        confidence: title.confidence
      }));

      onPhotoCapture(capturedImage, mockDetections, detectedTitles);
    }
  };

  const handleRetryOCR = async () => {
    if (!capturedImage) return;
    
    setIsProcessingOCR(true);
    setOcrComplete(false);
    setOcrError(null);
    
    try {
      const titles = await extractTitlesFromImage(capturedImage, []);
      setDetectedTitles(titles);
      setOcrComplete(true);
    } catch (error) {
      console.error('OCR retry failed:', error);
      setOcrError('Failed to process image. Please try again.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  if (!capturedImage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <Camera className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="text-2xl font-bold">Capture Your Shelf</h2>
          <p className="text-gray-600 max-w-md">
            Take a photo of your Blu-ray/DVD shelf to get started. We'll automatically detect and identify the movie titles.
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
        <h2 className="text-2xl font-bold mb-2">
          {isProcessingOCR ? 'Identifying Titles...' : 
           ocrError ? 'Processing Failed' :
           ocrComplete ? 'Titles Identified!' : 'Processing Image...'}
        </h2>
        <p className="text-gray-600">
          {isProcessingOCR ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading movie titles from your shelf image...
            </span>
          ) : ocrError ? (
            <span className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              {ocrError}
            </span>
          ) : ocrComplete ? (
            <span className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Found {detectedTitles.length} movie titles. Edit any incorrect titles below.
            </span>
          ) : (
            'Processing your shelf image...'
          )}
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

        {/* Detected Titles */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Detected Titles ({detectedTitles.length})
            </h3>
            {ocrComplete && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddNewTitle}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Title
              </Button>
            )}
          </div>
          
          {isProcessingOCR ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : ocrError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 mb-4">{ocrError}</p>
              <Button onClick={handleRetryOCR} variant="outline">
                Try Again
              </Button>
            </div>
          ) : detectedTitles.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {detectedTitles.map((title, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                  {editingIndex === index ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveEdit} className="p-1">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="p-1">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium">{title.title}</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(title.confidence * 100)}%
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditTitle(index)}
                        className="p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleRemoveTitle(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              
              {/* Add New Title Input */}
              {isAddingNew && (
                <div className="bg-blue-50 p-3 rounded border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={newTitleValue}
                      onChange={(e) => handleNewTitleInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveNewTitle()}
                      placeholder="Enter movie title..."
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSaveNewTitle()} className="p-1">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelNewTitle} className="p-1">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Suggestions for new title */}
                  {suggestions.length > 0 && (
                    <div className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSaveNewTitle(suggestion)}
                          className="w-full text-left px-2 py-1 hover:bg-blue-100 text-sm rounded"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
           </div>
          ) : ocrComplete ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No movie titles were detected in this image.</p>
              <Button onClick={handleRetryOCR} variant="outline">
                Try Again
              </Button>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => setCapturedImage(null)}>
          Retake Photo
        </Button>
        <Button 
          onClick={handleProceedWithPhoto} 
          disabled={detectedTitles.length === 0 || isProcessingOCR}
        >
          Continue with {detectedTitles.length} Titles
        </Button>
      </div>
    </div>
  );
};

export default PhotoCapture;