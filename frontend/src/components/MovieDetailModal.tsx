import React from 'react';
import { X, Calendar, Tag, Clock, Star, Award, DollarSign, Globe, Users, Film, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/collection';
import { formatRuntime, formatBoxOffice } from '@/services/movieMetadataService';

interface MovieDetailModalProps {
  isOpen: boolean;
  movie: Movie | null;
  onClose: () => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  isOpen,
  movie,
  onClose
}) => {
  if (!isOpen || !movie) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 pr-4">{movie.title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Movie Poster and Main Content */}
          <div className="flex gap-6 mb-6">
            {/* Movie Poster */}
            {movie.poster && (
              <div className="flex-shrink-0">
                <img 
                  src={movie.poster} 
                  alt={`${movie.title} poster`}
                  className="w-48 h-64 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {movie.releaseYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Year</div>
                      <div className="font-medium">{movie.releaseYear}</div>
                    </div>
                  </div>
                )}
                
                {movie.runtime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Runtime</div>
                      <div className="font-medium">{formatRuntime(movie.runtime)}</div>
                    </div>
                  </div>
                )}
                
                {movie.rating && (
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Rating</div>
                      <div className="font-medium px-2 py-1 bg-gray-100 rounded text-sm">{movie.rating}</div>
                    </div>
                  </div>
                )}
                
                {movie.format && (
                  <div className="flex items-center gap-2">
                    <Disc className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Format</div>
                      <div className="font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{movie.format}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Genre and Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {movie.genre && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Genre</div>
                      <div className="font-medium">{movie.genre}</div>
                    </div>
                  </div>
                )}
                
                {movie.director && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Director</div>
                      <div className="font-medium">{movie.director}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ratings and Studio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {movie.imdbRating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <div>
                      <div className="text-xs text-gray-500">IMDB Rating</div>
                      <div className="font-medium">{movie.imdbRating}/10</div>
                    </div>
                  </div>
                )}
                
                {movie.studio && (
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Studio</div>
                      <div className="font-medium">{movie.studio}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Rating */}
              {movie.personalRating && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">Personal Rating</div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">{'★'.repeat(movie.personalRating)}</span>
                    <span className="text-gray-400">{'☆'.repeat(5 - movie.personalRating)}</span>
                    <span className="text-sm text-gray-600 ml-2">({movie.personalRating}/5)</span>
                  </div>
                </div>
              )}

              {/* Financial Info */}
              {movie.boxOffice && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="text-xs text-gray-500">Box Office</div>
                    <div className="font-medium text-green-600">{formatBoxOffice(movie.boxOffice)}</div>
                  </div>
                </div>
              )}

              {/* Awards */}
              {movie.awards && (
                <div className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-yellow-600 mt-1" />
                  <div>
                    <div className="text-xs text-gray-500">Awards</div>
                    <div className="font-medium text-yellow-700">{movie.awards}</div>
                  </div>
                </div>
              )}

              {/* Country and Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {movie.country && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Country</div>
                      <div className="font-medium">{movie.country}</div>
                    </div>
                  </div>
                )}
                
                {movie.language && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Language</div>
                      <div className="font-medium">{movie.language}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cast */}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Cast</div>
                  <div className="flex flex-wrap gap-2">
                    {movie.cast.map((actor, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 rounded-full text-sm font-medium"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Plot */}
              {movie.plot && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Plot</div>
                  <div className="text-gray-700 leading-relaxed">{movie.plot}</div>
                </div>
              )}

              {/* Notes */}
              {movie.notes && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Personal Notes</div>
                  <div className="text-gray-700 bg-blue-50 p-3 rounded-lg">{movie.notes}</div>
                </div>
              )}

              {/* Added Date */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Added to collection on {movie.addedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;