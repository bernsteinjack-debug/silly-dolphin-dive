import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Camera, Share2, Search, Edit2, Trash2, Calendar, Tag, Star, Clock, Award, DollarSign, Film, Globe, Users, PlayCircle, Disc, CheckSquare, Square, X, ArrowUp, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Movie } from '@/types/collection';
import TitleEntryModal from '@/components/TitleEntryModal';
import MovieDetailModal from '@/components/MovieDetailModal';
import { formatRuntime, formatBoxOffice, getGenreColor, getRatingColor, formatCastList, getMovieAge } from '@/services/movieMetadataService';

interface CatalogViewProps {
  movies: Movie[];
  onTakeNewPhoto: () => void;
  onShare: () => void;
  onEditMovie: (movieId: string, movieData: {
    title: string;
    releaseYear?: number;
    genre?: string;
    director?: string;
    runtime?: number;
    rating?: string;
    format?: string;
    personalRating?: number;
    notes?: string;
    poster?: string;
  }) => void;
  onDeleteMovie: (movieId: string) => void;
  onDeleteMultipleMovies: (movieIds: string[]) => void;
}

const CatalogView: React.FC<CatalogViewProps> = ({
  movies,
  onTakeNewPhoto,
  onShare,
  onEditMovie,
  onDeleteMovie,
  onDeleteMultipleMovies
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set());

  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const filteredMovies = movies
    .filter(movie =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  // Bulk selection helper functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMovieIds(new Set());
  };

  const toggleMovieSelection = (movieId: string) => {
    const newSelection = new Set(selectedMovieIds);
    if (newSelection.has(movieId)) {
      newSelection.delete(movieId);
    } else {
      newSelection.add(movieId);
    }
    setSelectedMovieIds(newSelection);
  };

  const selectAllMovies = () => {
    const allMovieIds = new Set(filteredMovies.map(movie => movie.id));
    setSelectedMovieIds(allMovieIds);
  };

  const deselectAllMovies = () => {
    setSelectedMovieIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedMovieIds.size > 0) {
      onDeleteMultipleMovies(Array.from(selectedMovieIds));
      setSelectedMovieIds(new Set());
      setIsSelectionMode(false);
    }
  };

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
        
        {/* Navigation Links */}
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/about"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
          >
            <Info className="w-4 h-4" />
            About
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
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

        <div className="flex justify-between items-center">
          {/* Bulk selection controls */}
          {isSelectionMode && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllMovies}
                className="text-xs sm:text-sm"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAllMovies}
                className="text-xs sm:text-sm"
              >
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedMovieIds.size === 0}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Delete ({selectedMovieIds.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectionMode}
                className="text-xs sm:text-sm"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
          
          {!isSelectionMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectionMode}
              className="text-xs sm:text-sm"
            >
              <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Select Multiple
            </Button>
          )}

          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onTakeNewPhoto}
              className="flex items-center gap-2 flex-1 sm:flex-none"
              disabled={isSelectionMode}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add More Movies</span>
              <span className="sm:hidden">Add Movies</span>
            </Button>
            <Button
              onClick={onShare}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              disabled={isSelectionMode}
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
                className={`flex items-center py-2 sm:py-3 px-3 sm:px-4 hover:bg-gray-50 transition-colors rounded-lg group ${
                  isSelectionMode && selectedMovieIds.has(movie.id) ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                {/* Selection checkbox */}
                {isSelectionMode && (
                  <div className="flex-shrink-0 mr-2 sm:mr-3">
                    <button
                      onClick={() => toggleMovieSelection(movie.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {selectedMovieIds.has(movie.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
                
                <span className="text-xs sm:text-sm text-gray-500 w-8 sm:w-12 flex-shrink-0 font-mono">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                
                {/* Movie Poster */}
                <div className="flex-shrink-0 mr-3 sm:mr-4">
                  {movie.poster ? (
                    <>
                      <img
                        src={movie.poster}
                        alt={`${movie.title} poster`}
                        className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedMovie(movie);
                          setShowDetailModal(true);
                        }}
                        onError={(e) => {
                          // Show placeholder if image fails to load
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      {/* Hidden placeholder that shows on error */}
                      <div
                        className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow items-center justify-center hidden"
                        onClick={() => {
                          setSelectedMovie(movie);
                          setShowDetailModal(true);
                        }}
                      >
                        <Film className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                      </div>
                    </>
                  ) : (
                    /* Poster Placeholder for movies without poster URLs */
                    <div
                      className="w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow flex items-center justify-center"
                      onClick={() => {
                        setSelectedMovie(movie);
                        setShowDetailModal(true);
                      }}
                    >
                      <Film className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <Link
                    to={`/movie/${movie.id}`}
                    className="font-medium text-gray-900 text-sm sm:text-lg hover:text-blue-600 transition-colors block"
                  >
                    {movie.title}
                  </Link>
                  
                  {/* Primary metadata row */}
                  <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-gray-500 flex-wrap">
                    {movie.releaseYear && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{movie.releaseYear}</span>
                      </div>
                    )}
                    {movie.genre && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getGenreColor(movie.genre)}`}>
                          {movie.genre}
                        </span>
                      </div>
                    )}
                    {movie.runtime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatRuntime(movie.runtime)}</span>
                      </div>
                    )}
                    {movie.rating && (
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${getRatingColor(movie.rating)}`}>
                          {movie.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Secondary metadata row */}
                  <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-gray-500 flex-wrap">
                    {movie.director && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Dir:</span>
                        <span>{movie.director}</span>
                      </div>
                    )}
                    {movie.imdbRating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{movie.imdbRating}/10</span>
                      </div>
                    )}
                    {movie.studio && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">•</span>
                        <span>{movie.studio}</span>
                      </div>
                    )}
                    {movie.format && (
                      <div className="flex items-center gap-1">
                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">{movie.format}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional metadata row */}
                  {(movie.boxOffice || movie.awards || movie.personalRating) && (
                    <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-gray-500 flex-wrap">
                      {movie.boxOffice && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{formatBoxOffice(movie.boxOffice)}</span>
                        </div>
                      )}
                      {movie.awards && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-yellow-600" />
                          <span className="truncate max-w-32">{movie.awards}</span>
                        </div>
                      )}
                      {movie.personalRating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">{'★'.repeat(movie.personalRating)}</span>
                          <span className="text-gray-400">{'☆'.repeat(5 - movie.personalRating)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Extended metadata row */}
                  {(movie.country || movie.language || movie.cast) && (
                    <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm text-gray-500 flex-wrap">
                      {movie.country && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>{movie.country}</span>
                        </div>
                      )}
                      {movie.language && movie.language !== 'English' && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">Lang:</span>
                          <span>{movie.language}</span>
                        </div>
                      )}
                      {movie.cast && movie.cast.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="truncate max-w-48">
                            {formatCastList(movie.cast, 2)}
                          </span>
                        </div>
                      )}
                      {movie.releaseYear && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">•</span>
                          <span className="text-xs italic">{getMovieAge(movie.releaseYear)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Plot summary for larger screens */}
                  {movie.plot && (
                    <div className="mt-2 text-xs text-gray-600 hidden sm:block">
                      <p className="line-clamp-2">{movie.plot}</p>
                    </div>
                  )}
                </div>
                
                {!isSelectionMode && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMovie(movie);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteMovie(movie.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p>Created with Snap Your Shelf</p>
      </div>

      {/* Return to Top Button */}
      {movies.length > 0 && (
        <div className="flex justify-center pb-6">
          <Button
            onClick={scrollToTop}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-300"
          >
            <ArrowUp className="w-4 h-4" />
            Return to Top
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <TitleEntryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMovie(null);
        }}
        onSave={(movieData) => {
          if (editingMovie) {
            onEditMovie(editingMovie.id, movieData);
          }
          setShowEditModal(false);
          setEditingMovie(null);
        }}
        spineId=""
        initialData={editingMovie ? {
          title: editingMovie.title,
          releaseYear: editingMovie.releaseYear,
          genre: editingMovie.genre,
          director: editingMovie.director,
          runtime: editingMovie.runtime,
          rating: editingMovie.rating,
          format: editingMovie.format,
          personalRating: editingMovie.personalRating,
          notes: editingMovie.notes
        } : undefined}
        mode="edit"
      />

      {/* Movie Detail Modal */}
      <MovieDetailModal
        isOpen={showDetailModal}
        movie={selectedMovie}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMovie(null);
        }}
      />
    </div>
  );
};

export default CatalogView;