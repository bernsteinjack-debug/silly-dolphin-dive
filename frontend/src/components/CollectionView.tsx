import React, { useState } from 'react';
import { Search, Grid, List, Share2, Plus, ArrowUpDown, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Movie } from '@/types/collection';
import { useNavigate } from 'react-router-dom';

interface CollectionViewProps {
  movies: Movie[];
  onAddMore: () => void;
  onShare: () => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({
  movies,
  onAddMore,
  onShare
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedMovies = movies
    .filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.title.localeCompare(b.title);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Grid className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold">No Movies Yet</h2>
          <p className="text-gray-600 max-w-md">
            Start building your digital collection by capturing a photo of your shelf.
          </p>
        </div>
        <Button onClick={onAddMore} size="lg" className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Your First Movies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Collection</h1>
          <p className="text-gray-600">{movies.length} movies cataloged</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/catalog')} className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            View Catalog
          </Button>
          <Button variant="outline" onClick={onAddMore} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add More
          </Button>
          <Button onClick={onShare} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share Collection
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search your collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSort}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {searchTerm && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredAndSortedMovies.length} of {movies.length} movies
          </Badge>
          {filteredAndSortedMovies.length === 0 && (
            <span className="text-gray-500">No movies match your search</span>
          )}
        </div>
      )}

      {/* Movie Collection */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedMovies.map((movie) => (
            <Card key={movie.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg leading-tight">{movie.title}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Added {new Date(movie.addedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedMovies.map((movie) => (
            <Card key={movie.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{movie.title}</h3>
                  <p className="text-sm text-gray-500">
                    Added {new Date(movie.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionView;