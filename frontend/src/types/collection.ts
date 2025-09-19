export interface Movie {
  id: string;
  title: string;
  addedAt: Date;
  spinePosition?: {
    x: number;
    y: number;
  };
}

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