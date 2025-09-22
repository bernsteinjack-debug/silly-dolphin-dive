import React, { useState } from 'react';
import { Plus, Camera, Share2, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovies = movies
    .filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] space-y-4 sm:space-y-6 px-4">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Digital Shelf</h2>
          <p className="text-gray-600 max-w-sm sm:max-w-md text-base sm:text-lg">
            Take a photo of your shelf to start building your catalog
          </p>
        </div>
        <Button
          onClick={onTakeNewPhoto}
          size="lg"
          className="flex items-center gap-2 sm:gap-3 bg-blue-600 hover:bg-blue-700 text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 w-full max-w-xs sm:w-auto"
        >
          <Camera className="w-5 h-5" />
          Snap Your Shelf
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-3 sm:px-0">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">My Movie Catalog</h1>
        <p className="text-lg sm:text-xl text-gray-600">{movies.length} movies in your collection</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex justify-end">
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onTakeNewPhoto}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add More Movies</span>
              <span className="sm:hidden">Add Movies</span>
            </Button>
            <Button
              onClick={onShare}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Catalog</span>
              <span className="sm:hidden">Share</span>
            </Button>
          </div>
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
      <div id="catalog-content" className="bg-white rounded-lg p-4 sm:p-8 shadow-sm">
        {filteredMovies.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg">No movies match your search</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMovies.map((movie, index) => (
              <div
                key={movie.id}
                className="flex items-center py-2 sm:py-3 px-3 sm:px-4 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <span className="text-xs sm:text-sm text-gray-500 w-8 sm:w-12 flex-shrink-0 font-mono">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <h3 className="font-medium text-gray-900 text-sm sm:text-lg">
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