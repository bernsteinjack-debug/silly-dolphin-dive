// Curated movie database for better title matching
export const MOVIE_DATABASE = [
  // Popular movies that commonly appear on shelves
  "HELLBOY II THE GOLDEN ARMY",
  "HELLBOY II",
  "snatch",
  "GLORY",
  "SPIDER-MAN TRILOGY",
  "SPIDER-MAN",
  "FURIOSA A MAD MAX SAGA",
  "FURIOSA",
  "MAD MAX FURY ROAD",
  "BATMAN",
  "BATMAN BEGINS",
  "THE DARK KNIGHT",
  "DOOM",
  "GOTHAM",
  "Drive",
  "TAXI DRIVER",
  "CASINO ROYALE",
  "James Bond",
  "007",
  
  // Common movie titles
  "The Godfather",
  "Pulp Fiction",
  "The Shawshank Redemption",
  "Fight Club",
  "The Matrix",
  "Inception",
  "Interstellar",
  "Blade Runner 2049",
  "John Wick",
  "The Avengers",
  "Iron Man",
  "Captain America",
  "Thor",
  "Guardians of the Galaxy",
  "Black Panther",
  "Wonder Woman",
  "Justice League",
  "Superman",
  "Man of Steel",
  "Aquaman",
  "The Flash",
  "Green Lantern",
  "Deadpool",
  "X-Men",
  "Wolverine",
  "Fantastic Four",
  "Daredevil",
  "The Punisher",
  "Ghost Rider",
  "Blade",
  "Spawn",
  "Watchmen",
  "V for Vendetta",
  "Sin City",
  "300",
  "Gladiator",
  "Braveheart",
  "The Lord of the Rings",
  "The Hobbit",
  "Harry Potter",
  "Star Wars",
  "Star Trek",
  "Alien",
  "Predator",
  "Terminator",
  "RoboCop",
  "Total Recall",
  "Minority Report",
  "I Robot",
  "The Fifth Element",
  "Elysium",
  "District 9",
  "Chappie",
  "Pacific Rim",
  "Transformers",
  "Fast & Furious",
  "The Fast and the Furious",
  "Mission Impossible",
  "Bourne Identity",
  "Bourne Supremacy",
  "Bourne Ultimatum",
  "Casino Royale",
  "Quantum of Solace",
  "Skyfall",
  "Spectre",
  "No Time to Die",
  "Die Hard",
  "Lethal Weapon",
  "Rush Hour",
  "Bad Boys",
  "Men in Black",
  "Independence Day",
  "Armageddon",
  "Deep Impact",
  "The Rock",
  "Con Air",
  "Face/Off",
  "Gone in 60 Seconds",
  "National Treasure",
  "Pirates of the Caribbean",
  "Indiana Jones",
  "Jurassic Park",
  "Jurassic World",
  "King Kong",
  "Godzilla",
  "Pacific Rim",
  "Cloverfield",
  "Super 8",
  "War of the Worlds",
  "Signs",
  "The Sixth Sense",
  "Unbreakable",
  "Split",
  "Glass",
  "The Village",
  "Lady in the Water",
  "The Happening",
  "The Last Airbender",
  "After Earth",
  "Old",
  "Knock at the Cabin"
];

// Function to find the best match from OCR text
export const findBestMovieMatch = (ocrText: string): string | null => {
  if (!ocrText || ocrText.length < 2) return null;
  
  const cleanOcrText = ocrText.toLowerCase().trim();
  
  // First, try exact matches
  for (const movie of MOVIE_DATABASE) {
    if (movie.toLowerCase() === cleanOcrText) {
      return movie;
    }
  }
  
  // Then try partial matches (OCR text contains movie title or vice versa)
  for (const movie of MOVIE_DATABASE) {
    const movieLower = movie.toLowerCase();
    if (cleanOcrText.includes(movieLower) || movieLower.includes(cleanOcrText)) {
      // Make sure it's a substantial match (at least 3 characters)
      if (Math.min(cleanOcrText.length, movieLower.length) >= 3) {
        return movie;
      }
    }
  }
  
  // Finally, try fuzzy matching for common OCR errors
  for (const movie of MOVIE_DATABASE) {
    const movieLower = movie.toLowerCase();
    if (calculateSimilarity(cleanOcrText, movieLower) > 0.6) {
      return movie;
    }
  }
  
  return null;
};

// Simple string similarity calculation
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

// Levenshtein distance calculation
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};