import React, { useState } from 'react';
import { Grid, List, Plus, Camera, Share2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Movie } from '@/types/collection';

interface CatalogViewProps {
  movies: Movie[];
  onTakeNewPhoto: () => void;
  onShare: () => void;
}

const CatalogView: React.FC<CatalogViewProps> = ({
  movies,
  onTakeNewPhoto,
  onShare
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovies = movies
    .filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Camera className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Your Digital Shelf</h2>
          <p className="text-gray-600 max-w-md text-lg">
            Take a photo of your shelf to start building your catalog
          </p>
        </div>
        <Button 
          onClick={onTakeNewPhoto} 
          size="lg" 
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
        >
          <Camera className="w-5 h-5" />
          Snap Your Shelf
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">My Movie Catalog</h1>
        <p className="text-xl text-gray-600">{movies.length} movies in your collection</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onTakeNewPhoto} 
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add More Movies
          </Button>
          <Button 
            onClick={onShare} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Share2 className="w-4 h-4" />
            Share Catalog
          </Button>
        </div>
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-center">
          <p className="text-gray-600">
            Showing {filteredMovies.length} of {movies.length} movies
          </p>
        </div>
      )}

      {/* Movie Catalog */}
      <div id="catalog-content" className="bg-white rounded-lg p-8 shadow-sm">
        {filteredMovies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No movies match your search</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white"
              >
                <h3 className="font-medium text-gray-900 text-center leading-tight text-sm">
                  {movie.title}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMovies.map((movie, index) => (
              <div
                key={movie.id}
                className="flex items-center py-3 px-4 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <span className="text-sm text-gray-500 w-12 flex-shrink-0 font-mono">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <h3 className="font-medium text-gray-900 text-lg">
                  {movie.title}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p>Created with Snap Your Shelf</p>
      </div>
    </div>
  );
};

export default CatalogView;