import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MOVIE_GENRES, MOVIE_RATINGS, MOVIE_FORMATS, COMMON_LANGUAGES } from '@/types/collection';

interface TitleEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movieData: {
    title: string;
    releaseYear?: number;
    genre?: string;
    director?: string;
    runtime?: number;
    rating?: string;
    format?: string;
    personalRating?: number;
    notes?: string;
  }) => void;
  spineId: string;
  initialData?: {
    title?: string;
    releaseYear?: number;
    genre?: string;
    director?: string;
    runtime?: number;
    rating?: string;
    format?: string;
    personalRating?: number;
    notes?: string;
  };
  mode?: 'add' | 'edit';
}

const TitleEntryModal: React.FC<TitleEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  spineId,
  initialData,
  mode = 'add'
}) => {
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [director, setDirector] = useState('');
  const [runtime, setRuntime] = useState<string>('');
  const [rating, setRating] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [personalRating, setPersonalRating] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setReleaseYear(initialData?.releaseYear?.toString() || '');
      setGenre(initialData?.genre || '');
      setDirector(initialData?.director || '');
      setRuntime(initialData?.runtime?.toString() || '');
      setRating(initialData?.rating || '');
      setFormat(initialData?.format || '');
      setPersonalRating(initialData?.personalRating?.toString() || '');
      setNotes(initialData?.notes || '');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const movieData = {
        title: title.trim(),
        releaseYear: releaseYear ? parseInt(releaseYear, 10) : undefined,
        genre: genre || undefined,
        director: director.trim() || undefined,
        runtime: runtime ? parseInt(runtime, 10) : undefined,
        rating: rating || undefined,
        format: format || undefined,
        personalRating: personalRating ? parseInt(personalRating, 10) : undefined,
        notes: notes.trim() || undefined,
      };
      onSave(movieData);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {mode === 'edit' ? 'Edit Movie' : 'Add Movie Title'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                Movie Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter movie title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-lg py-3"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="releaseYear" className="text-sm font-medium">
                  Release Year
                </Label>
                <Input
                  id="releaseYear"
                  type="number"
                  placeholder="e.g. 2023"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  className="py-2"
                />
              </div>

              <div>
                <Label htmlFor="runtime" className="text-sm font-medium">
                  Runtime (minutes)
                </Label>
                <Input
                  id="runtime"
                  type="number"
                  placeholder="e.g. 120"
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  min="1"
                  max="600"
                  className="py-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="director" className="text-sm font-medium">
                Director
              </Label>
              <Input
                id="director"
                type="text"
                placeholder="e.g. Christopher Nolan"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="genre" className="text-sm font-medium">
                  Genre
                </Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="Select genre..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVIE_GENRES.map((genreOption) => (
                      <SelectItem key={genreOption} value={genreOption}>
                        {genreOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating" className="text-sm font-medium">
                  MPAA Rating
                </Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="Select rating..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVIE_RATINGS.map((ratingOption) => (
                      <SelectItem key={ratingOption} value={ratingOption}>
                        {ratingOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format" className="text-sm font-medium">
                  Format
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="Select format..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVIE_FORMATS.map((formatOption) => (
                      <SelectItem key={formatOption} value={formatOption}>
                        {formatOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="personalRating" className="text-sm font-medium">
                  Personal Rating (1-5 stars)
                </Label>
                <Select value={personalRating} onValueChange={setPersonalRating}>
                  <SelectTrigger className="py-2">
                    <SelectValue placeholder="Rate this movie..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <SelectItem key={star} value={star.toString()}>
                        {'★'.repeat(star)} ({star} star{star !== 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any personal notes about this movie..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              {mode === 'edit' ? 'Save Changes' : 'Add to Catalog'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TitleEntryModal;