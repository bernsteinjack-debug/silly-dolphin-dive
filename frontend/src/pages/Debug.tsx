import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StorageQuota {
  quota: number;
  usage: number;
  available: number;
}

interface StorageAnalysis {
  localStorageSize: number;
  keys: Array<{
    key: string;
    size: number;
    isTarget: boolean;
  }>;
  totalSize: number;
}

const Debug: React.FC = () => {
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [analysis, setAnalysis] = useState<StorageAnalysis | null>(null);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageSize = (storage: Storage): number => {
    let total = 0;
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    return total * 2; // UTF-16 encoding
  };

  const getStorageQuota = async (): Promise<StorageQuota | null> => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        };
      }
    } catch (e) {
      console.error('Storage API not supported:', e);
    }
    return null;
  };

  const analyzeStorage = async () => {
    setLoading(true);
    
    // Get quota information
    const quotaInfo = await getStorageQuota();
    setQuota(quotaInfo);

    // Analyze localStorage
    const keys = Object.keys(localStorage);
    const keyAnalysis = keys.map(key => {
      const value = localStorage.getItem(key) || '';
      const size = (key.length + value.length) * 2; // UTF-16
      return {
        key,
        size,
        isTarget: key === 'snap-your-shelf-collection'
      };
    });

    const totalSize = keyAnalysis.reduce((sum, item) => sum + item.size, 0);
    
    setAnalysis({
      localStorageSize: getStorageSize(localStorage),
      keys: keyAnalysis,
      totalSize
    });

    setLoading(false);
  };

  const analyzeCollectionData = () => {
    const collectionDataRaw = localStorage.getItem('snap-your-shelf-collection');
    
    if (!collectionDataRaw) {
      setCollectionData({ error: 'No collection data found in localStorage' });
      return;
    }

    try {
      const parsed = JSON.parse(collectionDataRaw);
      const dataSize = collectionDataRaw.length * 2; // UTF-16
      
      setCollectionData({
        size: dataSize,
        rawLength: collectionDataRaw.length,
        movieCount: Array.isArray(parsed) ? parsed.length : 'N/A',
        avgMovieSize: Array.isArray(parsed) && parsed.length > 0 ? dataSize / parsed.length : 0,
        sampleMovie: Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null,
        data: parsed
      });
    } catch (e) {
      setCollectionData({ error: `Error parsing collection data: ${e.message}` });
    }
  };

  const simulateAddToCatalogue = () => {
    // Create a sample movie object
    const sampleMovie = {
      id: Date.now(),
      title: "Test Movie " + Math.random().toString(36).substr(2, 9),
      year: 2023,
      genre: "Action",
      director: "Test Director",
      cast: ["Actor 1", "Actor 2", "Actor 3"],
      plot: "This is a test movie plot that contains a reasonable amount of text to simulate real movie metadata. ".repeat(5),
      poster: "data:image/jpeg;base64," + "A".repeat(1000), // Simulate base64 image data
      imdbRating: "8.5",
      runtime: "120 min",
      language: "English",
      country: "USA",
      awards: "Test awards and nominations",
      metascore: "85",
      imdbID: "tt" + Math.random().toString().substr(2, 7),
      type: "movie",
      dvdRelease: "2023-01-01",
      boxOffice: "$100,000,000",
      production: "Test Studio",
      website: "https://testmovie.com",
      response: "True",
      addedDate: new Date().toISOString(),
      userNotes: "Test user notes for this movie entry"
    };

    const movieSize = JSON.stringify(sampleMovie).length * 2; // UTF-16
    
    // Get current collection
    let currentCollection = [];
    const existingData = localStorage.getItem('snap-your-shelf-collection');
    if (existingData) {
      try {
        currentCollection = JSON.parse(existingData);
      } catch (e) {
        setSimulationResults(`Error parsing existing collection: ${e.message}`);
        return;
      }
    }

    const initialSize = JSON.stringify(currentCollection).length * 2;
    
    // Try to add movies until quota exceeded
    let testCollection = [...currentCollection];
    let addedCount = 0;
    let quotaExceeded = false;
    let errorMessage = '';

    try {
      for (let i = 0; i < 100; i++) { // Try to add up to 100 movies
        const newMovie = { ...sampleMovie, id: Date.now() + i, title: sampleMovie.title + i };
        testCollection.push(newMovie);
        
        const testData = JSON.stringify(testCollection);
        
        // Try to store it
        try {
          localStorage.setItem('test-collection', testData);
          localStorage.removeItem('test-collection'); // Clean up
          addedCount++;
        } catch (e) {
          quotaExceeded = true;
          errorMessage = e.message;
          break;
        }
      }
    } catch (e) {
      errorMessage = e.message;
    }

    let results = `Sample Movie Size: ${formatBytes(movieSize)}\n`;
    results += `Current Collection Size: ${formatBytes(initialSize)}\n`;
    results += `Current Movie Count: ${currentCollection.length}\n\n`;

    if (quotaExceeded) {
      results += `❌ QUOTA EXCEEDED after adding ${addedCount} movies\n`;
      results += `Error: ${errorMessage}\n`;
      results += `Estimated Max Movies: ${currentCollection.length + addedCount}`;
    } else {
      results += `✅ Successfully added ${addedCount} test movies\n`;
      results += `No quota limit reached in test`;
    }

    setSimulationResults(results);
  };

  const testQuotaLimit = async () => {
    try {
      const testKey = 'quota-test';
      let testData = 'A'.repeat(1024); // Start with 1KB
      let totalSize = 0;
      let success = true;

      while (success && totalSize < 50 * 1024 * 1024) { // Max 50MB test
        try {
          localStorage.setItem(testKey, testData);
          totalSize += testData.length * 2; // UTF-16
          testData += 'A'.repeat(1024); // Add another 1KB
        } catch (e) {
          success = false;
          alert(`localStorage Quota Limit Reached!\nError: ${e.message}\nApproximate Limit: ${formatBytes(totalSize)}`);
          
          // Clean up
          try {
            localStorage.removeItem(testKey);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
      }

      if (success) {
        alert(`Test completed without hitting quota limit. Tested up to: ${formatBytes(totalSize)}`);
        localStorage.removeItem(testKey);
      }

    } catch (e) {
      alert(`Error during quota test: ${e.message}`);
    }
  };

  useEffect(() => {
    analyzeStorage();
    analyzeCollectionData();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">localStorage Debug Inspector</h1>
        <Button onClick={analyzeStorage} disabled={loading}>
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Storage Quota Information */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Quota Information</CardTitle>
        </CardHeader>
        <CardContent>
          {quota ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Quota:</span>
                <Badge variant="outline">{formatBytes(quota.quota)}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Used:</span>
                <Badge variant="outline">{formatBytes(quota.usage)} ({((quota.usage / quota.quota) * 100).toFixed(2)}%)</Badge>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <Badge variant="outline">{formatBytes(quota.available)}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(quota.usage / quota.quota) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <p>Storage quota information not available</p>
          )}
        </CardContent>
      </Card>

      {/* localStorage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>localStorage Analysis</CardTitle>
          <CardDescription>Current localStorage usage breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {analysis ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Total Size:</span>
                  <Badge className="ml-2">{formatBytes(analysis.totalSize)}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Number of Keys:</span>
                  <Badge className="ml-2">{analysis.keys.length}</Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">localStorage Keys:</h4>
                {analysis.keys.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className={item.isTarget ? 'font-bold text-red-600' : ''}>
                      {item.key} {item.isTarget && '← TARGET KEY'}
                    </span>
                    <Badge variant={item.isTarget ? 'destructive' : 'secondary'}>
                      {formatBytes(item.size)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>Loading analysis...</p>
          )}
        </CardContent>
      </Card>

      {/* Collection Data Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Snap Your Shelf Collection Data</CardTitle>
          <CardDescription>Analysis of the movie collection data</CardDescription>
        </CardHeader>
        <CardContent>
          {collectionData ? (
            collectionData.error ? (
              <Alert>
                <AlertDescription>{collectionData.error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Data Size:</span>
                    <Badge className="ml-2">{formatBytes(collectionData.size)}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Movie Count:</span>
                    <Badge className="ml-2">{collectionData.movieCount}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Raw Length:</span>
                    <Badge className="ml-2">{collectionData.rawLength.toLocaleString()} chars</Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Avg Movie Size:</span>
                    <Badge className="ml-2">{formatBytes(collectionData.avgMovieSize)}</Badge>
                  </div>
                </div>
                
                {collectionData.sampleMovie && (
                  <div>
                    <h4 className="font-semibold mb-2">Sample Movie Keys:</h4>
                    <div className="text-sm bg-gray-100 p-2 rounded">
                      {Object.keys(collectionData.sampleMovie).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <p>Loading collection data...</p>
          )}
        </CardContent>
      </Card>

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Quota Testing</CardTitle>
          <CardDescription>Test localStorage limits and simulate adding movies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={simulateAddToCatalogue}>
              Simulate Add to Catalogue
            </Button>
            <Button onClick={testQuotaLimit} variant="outline">
              Test Quota Limit
            </Button>
          </div>
          
          {simulationResults && (
            <div className="bg-gray-100 p-4 rounded whitespace-pre-line text-sm">
              {simulationResults}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Debug;