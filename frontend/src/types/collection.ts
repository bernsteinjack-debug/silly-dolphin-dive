export interface Movie {
  id: string;
  title: string;
  releaseYear?: number;
  genre?: string;
  director?: string;
  runtime?: number; // in minutes
  rating?: string; // G, PG, PG-13, R, NC-17, NR
  imdbRating?: number; // 1-10 scale
  studio?: string;
  format?: string; // DVD, Blu-ray, 4K UHD, Digital
  language?: string;
  subtitles?: string[];
  cast?: string[]; // main actors
  plot?: string;
  awards?: string;
  boxOffice?: string;
  country?: string;
  poster?: string; // URL to movie poster image
  personalRating?: number; // 1-5 stars personal rating
  watchedDate?: Date;
  purchaseDate?: Date;
  purchasePrice?: number;
  notes?: string;
  tags?: string[]; // custom user tags
  addedAt: Date;
  spinePosition?: {
    x: number;
    y: number;
  };
}

export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western'
] as const;

export const MOVIE_RATINGS = [
  'G',
  'PG',
  'PG-13',
  'R',
  'NC-17',
  'NR'
] as const;

export const MOVIE_FORMATS = [
  'DVD',
  'Blu-ray',
  '4K UHD',
  'Digital',
  'VHS',
  'LaserDisc'
] as const;

export const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Japanese',
  'Korean',
  'Mandarin',
  'Hindi',
  'Portuguese',
  'Russian',
  'Arabic'
] as const;

export type MovieGenre = typeof MOVIE_GENRES[number];
export type MovieRating = typeof MOVIE_RATINGS[number];
export type MovieFormat = typeof MOVIE_FORMATS[number];
export type MovieLanguage = typeof COMMON_LANGUAGES[number];

export interface Collection {
  id: string;
  name: string;
  movies: Movie[];
  shelfImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpineDetection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}