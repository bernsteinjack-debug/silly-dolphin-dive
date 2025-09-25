import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Star, Calendar, Clock, User, Film, Award, DollarSign, Globe } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import TitleEntryModal from '@/components/TitleEntryModal';
import { showSuccess } from '@/utils/toast';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { collection, updateMovie } = useCollection();
  const [showEditModal, setShowEditModal] = useState(false);
  
  const movie = collection.movies.find(m => m.id === id);

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Movie Not Found</h1>
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const handleEditMovie = (movieData: {
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
  }) => {
    updateMovie(movie.id, movieData);
    showSuccess('Movie updated!');
    setShowEditModal(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Catalog
          </Link>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Movie
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* Poster */}
              <div className="md:w-1/3 bg-gray-200 flex items-center justify-center p-8">
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-64 h-96 bg-gray-300 rounded-lg flex items-center justify-center">
                    <Film className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Movie Details */}
              <div className="md:w-2/3 p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{movie.title}</h1>
                
                {/* Personal Rating */}
                {movie.personalRating && (
                  <div className="flex items-center mb-4">
                    <span className="text-sm font-medium text-gray-700 mr-2">Your Rating:</span>
                    <div className="flex">
                      {renderStars(movie.personalRating)}
                    </div>
                  </div>
                )}

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {movie.releaseYear && (
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-700">{movie.releaseYear}</span>
                    </div>
                  )}
                  
                  {movie.runtime && (
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-700">{movie.runtime} minutes</span>
                    </div>
                  )}
                  
                  {movie.director && (
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-700">{movie.director}</span>
                    </div>
                  )}
                  
                  {movie.rating && (
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-gray-500 mr-2" />
                      <span className="text-gray-700">{movie.rating}</span>
                    </div>
                  )}
                </div>

                {/* Genre */}
                {movie.genre && (
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {movie.genre}
                    </span>
                  </div>
                )}

                {/* Format */}
                {movie.format && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700 mr-2">Format:</span>
                    <span className="text-gray-600">{movie.format}</span>
                  </div>
                )}

                {/* Personal Notes */}
                {movie.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Notes</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{movie.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Extended Details */}
            {(movie.cast || movie.plot || movie.awards || movie.boxOffice || movie.country || movie.studio || movie.language || movie.imdbRating) && (
              <div className="border-t border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {movie.cast && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Cast</h3>
                      <p className="text-gray-700">{movie.cast}</p>
                    </div>
                  )}
                  
                  {movie.studio && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Studio</h3>
                      <p className="text-gray-700">{movie.studio}</p>
                    </div>
                  )}
                  
                  {movie.language && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Language</h3>
                      <p className="text-gray-700">{movie.language}</p>
                    </div>
                  )}
                  
                  {movie.country && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Country</h3>
                      <p className="text-gray-700">{movie.country}</p>
                    </div>
                  )}
                  
                  {movie.imdbRating && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">IMDB Rating</h3>
                      <p className="text-gray-700">{movie.imdbRating}/10</p>
                    </div>
                  )}
                  
                  {movie.boxOffice && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Box Office</h3>
                      <p className="text-gray-700">{movie.boxOffice}</p>
                    </div>
                  )}
                </div>
                
                {movie.plot && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Plot</h3>
                    <p className="text-gray-700 leading-relaxed">{movie.plot}</p>
                  </div>
                )}
                
                {movie.awards && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Awards</h3>
                    <p className="text-gray-700">{movie.awards}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        <TitleEntryModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditMovie}
          spineId=""
          initialData={{
            title: movie.title,
            releaseYear: movie.releaseYear,
            genre: movie.genre,
            director: movie.director,
            runtime: movie.runtime,
            rating: movie.rating,
            format: movie.format,
            personalRating: movie.personalRating,
            notes: movie.notes
          }}
          mode="edit"
        />
      </div>
    </div>
  );
};

export default MovieDetail;