import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CatalogView from '@/components/CatalogView';
import { useCollection } from '@/hooks/useCollection';
import { Movie } from '@/types/collection';

const Catalog = () => {
  const navigate = useNavigate();
  const { collection } = useCollection();

  const handleMovieSelect = (movie: Movie) => {
    // In a real app, this would navigate to a movie detail page
    console.log('Selected movie:', movie);
  };

  const handleMovieEdit = (movie: Movie) => {
    // In a real app, this would open an edit modal
    console.log('Edit movie:', movie);
  };

  const handleAddMovies = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Collection
              </Button>
            </div>
            <Button
              onClick={handleAddMovies}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Movies
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {collection.movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold">No Movies in Catalog</h2>
              <p className="text-gray-600 max-w-md">
                Start building your catalog by adding movies to your collection first.
              </p>
            </div>
            <Button onClick={handleAddMovies} size="lg" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Your First Movies
            </Button>
          </div>
        ) : (
          <CatalogView
            movies={collection.movies}
            onMovieSelect={handleMovieSelect}
            onMovieEdit={handleMovieEdit}
          />
        )}
      </div>
    </div>
  );
};

export default Catalog;