import React, { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, Star, Calendar, Tag, Eye, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Movie } from '@/types/collection';

interface CatalogViewProps {
  movies: Movie[];
  onMovieSelect?: (movie: Movie) => void;
  onMovieEdit?: (movie: Movie) => void;
}

type SortOption = 'title' | 'dateAdded' | 'rating';
type FilterOption = 'all' | 'recent' | 'favorites';

const CatalogView: React.FC<CatalogViewProps> = ({
  movies,
  onMovieSelect,
  onMovieEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Mock genres for demonstration - in real app, these would come from movie data
  const genres = ['all', 'action', 'comedy', 'drama', 'horror', 'sci-fi', 'thriller'];

  const filteredAndSortedMovies = useMemo(() => {
    let filtered = movies.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply filters
    switch (filterBy) {
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(movie => new Date(movie.addedAt) > oneWeekAgo);
        break;
      case 'favorites':
        // In a real app, you'd have a favorites property
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'dateAdded':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'rating':
          // Mock rating sort - in real app, you'd have rating data
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [movies, searchTerm, sortBy, filterBy]);

  const stats = useMemo(() => ({
    total: movies.length,
    recentlyAdded: movies.filter(movie => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(movie.addedAt) > oneWeekAgo;
    }).length,
    genres: genres.length - 1 // Exclude 'all'
  }), [movies]);

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight group-hover:text-blue-600 transition-colors">
            {movie.title}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMovieSelect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMovieSelect(movie);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {onMovieEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMovieEdit(movie);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            Added {new Date(movie.addedAt).toLocaleDateString()}
          </div>
          
          {/* Mock additional details */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              Action
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              4.5
            </Badge>
          </div>
          
          {movie.spinePosition && (
            <div className="text-xs text-gray-400">
              Shelf position: {Math.round(movie.spinePosition.x)}%, {Math.round(movie.spinePosition.y)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const MovieListItem = ({ movie }: { movie: Movie }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(movie.addedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                4.5
              </span>
              <Badge variant="secondary" className="text-xs">Action</Badge>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMovieSelect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMovieSelect(movie);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {onMovieEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMovieEdit(movie);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Movie Catalog</h1>
          <p className="text-gray-600">Browse and manage your movie collection</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Movies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.recentlyAdded}</div>
              <div className="text-sm text-gray-500">Added This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.genres}</div>
              <div className="text-sm text-gray-500">Genres</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="dateAdded">Date Added</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Grid className="w-4 h-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-gray-500">
              {filteredAndSortedMovies.length} of {movies.length} movies
            </div>
          </div>

          <TabsContent value="grid" className="mt-6">
            {filteredAndSortedMovies.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No movies found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            {filteredAndSortedMovies.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No movies found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedMovies.map((movie) => (
                  <MovieListItem key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CatalogView;