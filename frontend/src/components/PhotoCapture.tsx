import React, { useState, useRef } from 'react';
import { Camera, Upload, Plus, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SpineDetection } from '@/types/collection';
import { extractTitlesFromImage, DetectedTitle } from '@/services/ocrService';

interface PhotoCaptureProps {
  onPhotoCapture: (imageUrl: string, detections: SpineDetection[], detectedTitles?: DetectedTitle[]) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoCapture }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<SpineDetection[]>([]);
  const [detectedTitles, setDetectedTitles] = useState<DetectedTitle[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate spine detection by generating random spine positions
  const simulateSpineDetection = (imageUrl: string): SpineDetection[] => {
    const mockDetections: SpineDetection[] = [];
    const numSpines = Math.floor(Math.random() * 8) + 4; // 4-12 spines

    for (let i = 0; i < numSpines; i++) {
      mockDetections.push({
        id: `spine-${i}`,
        x: Math.random() * 80 + 5, // 5-85% from left
        y: Math.random() * 60 + 20, // 20-80% from top
        width: 3 + Math.random() * 4, // 3-7% width
        height: 15 + Math.random() * 10, // 15-25% height
        confidence: 0.7 + Math.random() * 0.3 // 70-100% confidence
      });
    }

    return mockDetections;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setCapturedImage(imageUrl);
        
        // Simulate processing delay for spine detection
        setTimeout(async () => {
          const mockDetections = simulateSpineDetection(imageUrl);
          setDetections(mockDetections);
          
          // Start OCR processing
          setIsProcessingOCR(true);
          try {
            const titles = await extractTitlesFromImage(imageUrl, mockDetections);
            setDetectedTitles(titles);
            setOcrComplete(true);
          } catch (error) {
            console.error('OCR processing failed:', error);
          } finally {
            setIsProcessingOCR(false);
          }
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // For demo purposes, we'll use the file input
    // In a real app, this would access the device camera
    fileInputRef.current?.click();
  };

  const handleProceedWithPhoto = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage, detections, detectedTitles);
    }
  };

  const handleManualAddSpine = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!capturedImage) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newSpine: SpineDetection = {
      id: `manual-${Date.now()}`,
      x,
      y,
      width: 4,
      height: 20,
      confidence: 1.0
    };

    setDetections(prev => [...prev, newSpine]);
  };

  const getSpineTitle = (spineId: string): string | null => {
    const detectedTitle = detectedTitles.find(dt => dt.spineId === spineId);
    return detectedTitle ? detectedTitle.title : null;
  };

  const getSpineConfidence = (spineId: string): number => {
    const detectedTitle = detectedTitles.find(dt => dt.spineId === spineId);
    return detectedTitle ? detectedTitle.confidence : 0;
  };

  if (!capturedImage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <Camera className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="text-2xl font-bold">Capture Your Shelf</h2>
          <p className="text-gray-600 max-w-md">
            Take a photo of your Blu-ray/DVD shelf to get started. We'll automatically detect the spines for quick cataloging.
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
          {isProcessingOCR ? 'Identifying Titles...' : ocrComplete ? 'Titles Identified!' : 'Spine Detection Complete'}
        </h2>
        <p className="text-gray-600">
          {isProcessingOCR ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading movie titles from spines...
            </span>
          ) : ocrComplete ? (
            `Found ${detectedTitles.length} titles out of ${detections.length} spines. Review and add to your catalog.`
          ) : (
            `${detections.length} spines detected. Processing titles...`
          )}
        </p>
      </div>

      <Card className="relative overflow-hidden">
        <div 
          className="relative cursor-crosshair"
          onClick={handleManualAddSpine}
        >
          <img 
            src={capturedImage} 
            alt="Captured shelf" 
            className="w-full h-auto max-h-96 object-contain"
          />
          
          {/* Spine detection overlays */}
          {detections.map((detection) => {
            const detectedTitle = getSpineTitle(detection.id);
            const confidence = getSpineConfidence(detection.id);
            const hasTitle = detectedTitle !== null;
            
            return (
              <div
                key={detection.id}
                className={`absolute border-2 transition-colors ${
                  hasTitle
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-blue-500 bg-blue-500/20'
                }`}
                style={{
                  left: `${detection.x}%`,
                  top: `${detection.y}%`,
                  width: `${detection.width}%`,
                  height: `${detection.height}%`,
                }}
              >
                {/* Title overlay */}
                {hasTitle && (
                  <div className="absolute -top-8 left-0 right-0 bg-black/80 text-white text-xs px-2 py-1 rounded text-center">
                    <div className="font-medium">{detectedTitle}</div>
                    <div className="text-xs opacity-75">{Math.round(confidence * 100)}%</div>
                  </div>
                )}
                
                {/* Action button */}
                <div className={`absolute -top-2 -right-2 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ${
                  hasTitle
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                  {hasTitle ? <Zap className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => setCapturedImage(null)}>
          Retake Photo
        </Button>
        <Button onClick={handleProceedWithPhoto} disabled={detections.length === 0}>
          Continue with {detections.length} Spines
        </Button>
      </div>
    </div>
  );
};

export default PhotoCapture;