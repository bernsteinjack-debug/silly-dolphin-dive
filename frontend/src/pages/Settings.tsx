import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Upload, Trash2, Camera, Database } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { showSuccess, showError } from '@/utils/toast';

const Settings = () => {
  const { collection, clearCollection } = useCollection();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(collection, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `movie-collection-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      showSuccess('Collection exported successfully!');
    } catch (error) {
      showError('Failed to export collection');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        // Here you would implement the import logic
        // For now, just show a success message
        showSuccess('Import feature coming soon!');
      } catch (error) {
        showError('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const handleClearCollection = () => {
    clearCollection();
    setShowClearConfirm(false);
    showSuccess('Collection cleared successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            to="/" 
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Catalog
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your collection and app preferences</p>
          </div>

          {/* Collection Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Collection Statistics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{collection.movies.length}</div>
                <div className="text-sm text-gray-600">Total Movies</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {collection.shelfImage ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600">Shelf Photos</div>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Data Management
            </h2>
            
            <div className="space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Download className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Export Collection</h3>
                    <p className="text-sm text-gray-600">Download your collection as JSON</p>
                  </div>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={collection.movies.length === 0}
                >
                  Export
                </button>
              </div>

              {/* Import Data */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Upload className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Import Collection</h3>
                    <p className="text-sm text-gray-600">Upload a previously exported collection</p>
                  </div>
                </div>
                <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Clear Collection */}
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center">
                  <Trash2 className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Clear Collection</h3>
                    <p className="text-sm text-gray-600">Remove all movies and data</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={collection.movies.length === 0}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* App Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">App Information</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium">December 2024</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Used:</span>
                <span className="font-medium">
                  {(JSON.stringify(collection).length / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear Collection</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clear your entire collection? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCollection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;