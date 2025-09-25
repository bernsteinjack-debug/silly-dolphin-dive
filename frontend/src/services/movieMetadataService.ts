// Comprehensive movie metadata service with rich information
export interface MovieMetadata {
  title: string;
  releaseYear: number;
  genre: string;
  director: string;
  runtime: number;
  rating: string;
  imdbRating: number;
  studio: string;
  format: string;
  language: string;
  cast: string[];
  plot: string;
  awards?: string;
  boxOffice?: string;
  country: string;
  poster?: string;
}

// Comprehensive movie database with rich metadata
export const MOVIE_METADATA_DATABASE: Record<string, MovieMetadata> = {
  "HELLBOY II THE GOLDEN ARMY": {
    title: "Hellboy II: The Golden Army",
    releaseYear: 2008,
    genre: "Action",
    director: "Guillermo del Toro",
    runtime: 120,
    rating: "PG-13",
    imdbRating: 7.0,
    studio: "Universal Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Ron Perlman", "Selma Blair", "Doug Jones", "Jeffrey Tambor"],
    plot: "The mythical world starts a rebellion against humanity in order to rule the Earth, so Hellboy and his team must save the world from the rebellious creatures.",
    awards: "Nominated for 1 Oscar",
    boxOffice: "$168.3M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/oCXGNjO7p3hyLnZi85ry3CWcUHh.jpg"
  },
  "HELLBOY II": {
    title: "Hellboy II: The Golden Army",
    releaseYear: 2008,
    genre: "Action",
    director: "Guillermo del Toro",
    runtime: 120,
    rating: "PG-13",
    imdbRating: 7.0,
    studio: "Universal Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Ron Perlman", "Selma Blair", "Doug Jones", "Jeffrey Tambor"],
    plot: "The mythical world starts a rebellion against humanity in order to rule the Earth, so Hellboy and his team must save the world from the rebellious creatures.",
    awards: "Nominated for 1 Oscar",
    boxOffice: "$168.3M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/oCXGNjO7p3hyLnZi85ry3CWcUHh.jpg"
  },
  "snatch": {
    title: "Snatch",
    releaseYear: 2000,
    genre: "Crime",
    director: "Guy Ritchie",
    runtime: 104,
    rating: "R",
    imdbRating: 8.2,
    studio: "Columbia Pictures",
    format: "DVD",
    language: "English",
    cast: ["Jason Statham", "Brad Pitt", "Benicio Del Toro", "Dennis Farina"],
    plot: "Unscrupulous boxing promoters, violent bookmakers, a Russian gangster, incompetent amateur robbers and supposedly Jewish jewelers fight to track down a priceless stolen diamond.",
    boxOffice: "$83.6M",
    country: "UK",
    poster: "https://image.tmdb.org/t/p/w500/56mOJth6DJ6JhgoE2jtpilVqJO.jpg"
  },
  "GLORY": {
    title: "Glory",
    releaseYear: 1989,
    genre: "Drama",
    director: "Edward Zwick",
    runtime: 122,
    rating: "R",
    imdbRating: 7.8,
    studio: "TriStar Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Matthew Broderick", "Denzel Washington", "Cary Elwes", "Morgan Freeman"],
    plot: "Robert Gould Shaw leads the U.S. Civil War's first all-black volunteer company, fighting prejudices from both his own Union Army and the Confederates.",
    awards: "Won 3 Oscars",
    boxOffice: "$26.8M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/7bA4FqSD9Iu0GlWoWdpHkNXdTkV.jpg"
  },
  "SPIDER-MAN TRILOGY": {
    title: "Spider-Man Trilogy",
    releaseYear: 2002,
    genre: "Action",
    director: "Sam Raimi",
    runtime: 363,
    rating: "PG-13",
    imdbRating: 7.3,
    studio: "Sony Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Tobey Maguire", "Kirsten Dunst", "James Franco", "Willem Dafoe"],
    plot: "The complete trilogy following Peter Parker's journey from high school student to the web-slinging superhero Spider-Man.",
    boxOffice: "$2.5B",
    country: "USA"
  },
  "SPIDER-MAN": {
    title: "Spider-Man",
    releaseYear: 2002,
    genre: "Action",
    director: "Sam Raimi",
    runtime: 121,
    rating: "PG-13",
    imdbRating: 7.4,
    studio: "Sony Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Tobey Maguire", "Kirsten Dunst", "Willem Dafoe", "James Franco"],
    plot: "After being bitten by a genetically-modified spider, a shy teenager gains spider-like abilities that he uses to fight injustice as a masked superhero.",
    boxOffice: "$825M",
    country: "USA"
  },
  "FURIOSA A MAD MAX SAGA": {
    title: "Furiosa: A Mad Max Saga",
    releaseYear: 2024,
    genre: "Action",
    director: "George Miller",
    runtime: 148,
    rating: "R",
    imdbRating: 7.7,
    studio: "Warner Bros.",
    format: "4K UHD",
    language: "English",
    cast: ["Anya Taylor-Joy", "Chris Hemsworth", "Tom Burke", "Alyla Browne"],
    plot: "The origin story of renegade warrior Furiosa before her encounter and teamup with Mad Max.",
    boxOffice: "$173.6M",
    country: "Australia"
  },
  "FURIOSA": {
    title: "Furiosa: A Mad Max Saga",
    releaseYear: 2024,
    genre: "Action",
    director: "George Miller",
    runtime: 148,
    rating: "R",
    imdbRating: 7.7,
    studio: "Warner Bros.",
    format: "4K UHD",
    language: "English",
    cast: ["Anya Taylor-Joy", "Chris Hemsworth", "Tom Burke", "Alyla Browne"],
    plot: "The origin story of renegade warrior Furiosa before her encounter and teamup with Mad Max.",
    boxOffice: "$173.6M",
    country: "Australia"
  },
  "MAD MAX FURY ROAD": {
    title: "Mad Max: Fury Road",
    releaseYear: 2015,
    genre: "Action",
    director: "George Miller",
    runtime: 120,
    rating: "R",
    imdbRating: 8.1,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult", "Hugh Keays-Byrne"],
    plot: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.",
    awards: "Won 6 Oscars",
    boxOffice: "$378.9M",
    country: "Australia"
  },
  "BATMAN": {
    title: "Batman",
    releaseYear: 1989,
    genre: "Action",
    director: "Tim Burton",
    runtime: 126,
    rating: "PG-13",
    imdbRating: 7.5,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["Michael Keaton", "Jack Nicholson", "Kim Basinger", "Robert Wuhl"],
    plot: "The Dark Knight of Gotham City begins his war on crime with his first major enemy being Jack Napier, a criminal who becomes the clownishly homicidal Joker.",
    boxOffice: "$411.3M",
    country: "USA"
  },
  "BATMAN BEGINS": {
    title: "Batman Begins",
    releaseYear: 2005,
    genre: "Action",
    director: "Christopher Nolan",
    runtime: 140,
    rating: "PG-13",
    imdbRating: 8.2,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["Christian Bale", "Michael Caine", "Liam Neeson", "Katie Holmes"],
    plot: "After training with his mentor, Batman begins his fight to free crime-ridden Gotham City from corruption.",
    boxOffice: "$373.7M",
    country: "USA"
  },
  "THE DARK KNIGHT": {
    title: "The Dark Knight",
    releaseYear: 2008,
    genre: "Action",
    director: "Christopher Nolan",
    runtime: 152,
    rating: "PG-13",
    imdbRating: 9.0,
    studio: "Warner Bros.",
    format: "4K UHD",
    language: "English",
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
    plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
    awards: "Won 2 Oscars",
    boxOffice: "$1.005B",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
  },
  "DOOM": {
    title: "Doom",
    releaseYear: 2005,
    genre: "Action",
    director: "Andrzej Bartkowiak",
    runtime: 105,
    rating: "R",
    imdbRating: 5.2,
    studio: "Universal Pictures",
    format: "DVD",
    language: "English",
    cast: ["Dwayne Johnson", "Karl Urban", "Rosamund Pike", "Razaaq Adoti"],
    plot: "Space Marines are sent to investigate strange events at a research facility on Mars but find themselves at the mercy of genetically enhanced killing machines.",
    boxOffice: "$58.7M",
    country: "USA"
  },
  "GOTHAM": {
    title: "Gotham",
    releaseYear: 2014,
    genre: "Crime",
    director: "Bruno Heller",
    runtime: 2640,
    rating: "TV-14",
    imdbRating: 7.8,
    studio: "Warner Bros. Television",
    format: "Blu-ray",
    language: "English",
    cast: ["Ben McKenzie", "Donal Logue", "David Mazouz", "Sean Pertwee"],
    plot: "The story behind Detective James Gordon's rise to prominence in Gotham City in the years before Batman's arrival.",
    country: "USA"
  },
  "Drive": {
    title: "Drive",
    releaseYear: 2011,
    genre: "Crime",
    director: "Nicolas Winding Refn",
    runtime: 100,
    rating: "R",
    imdbRating: 7.8,
    studio: "FilmDistrict",
    format: "Blu-ray",
    language: "English",
    cast: ["Ryan Gosling", "Carey Mulligan", "Bryan Cranston", "Albert Brooks"],
    plot: "A mysterious Hollywood stuntman and mechanic moonlights as a getaway driver and finds himself in trouble when he helps out his neighbor.",
    awards: "Won Best Director at Cannes",
    boxOffice: "$78.4M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/602vevIURmpDfzbnv5Ubi6wIkQm.jpg"
  },
  "TAXI DRIVER": {
    title: "Taxi Driver",
    releaseYear: 1976,
    genre: "Crime",
    director: "Martin Scorsese",
    runtime: 114,
    rating: "R",
    imdbRating: 8.2,
    studio: "Columbia Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Robert De Niro", "Jodie Foster", "Cybill Shepherd", "Harvey Keitel"],
    plot: "A mentally unstable veteran works as a nighttime taxi driver in New York City, where the perceived decadence and sleaze fuels his urge for violent action.",
    awards: "Nominated for 4 Oscars",
    boxOffice: "$28.3M",
    country: "USA"
  },
  "CASINO ROYALE": {
    title: "Casino Royale",
    releaseYear: 2006,
    genre: "Action",
    director: "Martin Campbell",
    runtime: 144,
    rating: "PG-13",
    imdbRating: 8.0,
    studio: "Sony Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Daniel Craig", "Eva Green", "Mads Mikkelsen", "Judi Dench"],
    plot: "After earning 00 status and a licence to kill, secret agent James Bond sets out on his first mission as 007.",
    boxOffice: "$616.5M",
    country: "UK",
    poster: "https://image.tmdb.org/t/p/w500/zlWBxz2pTA9p45kUTrI8AQiKYh8.jpg"
  },
  "James Bond": {
    title: "James Bond Collection",
    releaseYear: 1962,
    genre: "Action",
    director: "Various",
    runtime: 3000,
    rating: "PG-13",
    imdbRating: 7.5,
    studio: "MGM",
    format: "Blu-ray",
    language: "English",
    cast: ["Sean Connery", "Roger Moore", "Pierce Brosnan", "Daniel Craig"],
    plot: "The complete collection of James Bond films featuring the world's most famous secret agent.",
    boxOffice: "$7.1B",
    country: "UK"
  },
  "007": {
    title: "007 Collection",
    releaseYear: 1962,
    genre: "Action",
    director: "Various",
    runtime: 3000,
    rating: "PG-13",
    imdbRating: 7.5,
    studio: "MGM",
    format: "Blu-ray",
    language: "English",
    cast: ["Sean Connery", "Roger Moore", "Pierce Brosnan", "Daniel Craig"],
    plot: "The complete collection of 007 James Bond films.",
    boxOffice: "$7.1B",
    country: "UK"
  },
  "ROCKY": {
    title: "Rocky",
    releaseYear: 1976,
    genre: "Drama",
    director: "John G. Avildsen",
    runtime: 120,
    rating: "PG",
    imdbRating: 8.1,
    studio: "United Artists",
    format: "Blu-ray",
    language: "English",
    cast: ["Sylvester Stallone", "Talia Shire", "Burt Young", "Carl Weathers"],
    plot: "A small-time Philadelphia boxer gets a supremely rare chance to fight the world heavyweight champion in a bout in which he strives to go the distance for his self-respect.",
    awards: "Won 3 Oscars including Best Picture",
    boxOffice: "$225M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/cqxg1CihGR5ge0i7wYXr4Rdeppu.jpg"
  },
  "THE SOCIAL NETWORK": {
    title: "The Social Network",
    releaseYear: 2010,
    genre: "Drama",
    director: "David Fincher",
    runtime: 120,
    rating: "PG-13",
    imdbRating: 7.7,
    studio: "Columbia Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake", "Rooney Mara"],
    plot: "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea.",
    awards: "Won 3 Oscars",
    boxOffice: "$224.9M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg"
  },
  "THE BOURNE IDENTITY": {
    title: "The Bourne Identity",
    releaseYear: 2002,
    genre: "Action",
    director: "Doug Liman",
    runtime: 119,
    rating: "PG-13",
    imdbRating: 7.9,
    studio: "Universal Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Matt Damon", "Franka Potente", "Chris Cooper", "Clive Owen"],
    plot: "A man is picked up by a fishing boat, bullet-riddled and suffering from amnesia, before racing to elude assassins and attempting to regain his memory.",
    boxOffice: "$214.0M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/bXQIL36VQdzJ69lcjQR1WQzJqQR.jpg"
  },
  "PLATOON": {
    title: "Platoon",
    releaseYear: 1986,
    genre: "War",
    director: "Oliver Stone",
    runtime: 120,
    rating: "R",
    imdbRating: 8.1,
    studio: "Orion Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Charlie Sheen", "Tom Berenger", "Willem Dafoe", "Forest Whitaker"],
    plot: "A young soldier in Vietnam faces a moral crisis when confronted with the horrors of war and the duality of man.",
    awards: "Won 4 Oscars including Best Picture",
    boxOffice: "$138.5M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/m3mmFkPQKvPZq5exmh0bDuXlD9T.jpg"
  },
  "UNFORGIVEN": {
    title: "Unforgiven",
    releaseYear: 1992,
    genre: "Western",
    director: "Clint Eastwood",
    runtime: 131,
    rating: "R",
    imdbRating: 8.2,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["Clint Eastwood", "Gene Hackman", "Morgan Freeman", "Richard Harris"],
    plot: "Retired Old West gunslinger William Munny reluctantly takes on one last job, with the help of his old partner Ned Logan and a young man, The Schofield Kid.",
    awards: "Won 4 Oscars including Best Picture",
    boxOffice: "$159.2M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/sonW1WS8ZbwiuOVGjfKHq4wDiJl.jpg"
  },
  "GLADIATOR": {
    title: "Gladiator",
    releaseYear: 2000,
    genre: "Action",
    director: "Ridley Scott",
    runtime: 155,
    rating: "R",
    imdbRating: 8.5,
    studio: "DreamWorks",
    format: "4K UHD",
    language: "English",
    cast: ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen", "Oliver Reed"],
    plot: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    awards: "Won 5 Oscars including Best Picture",
    boxOffice: "$460.5M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg"
  },
  "WATCHMEN": {
    title: "Watchmen",
    releaseYear: 2009,
    genre: "Action",
    director: "Zack Snyder",
    runtime: 162,
    rating: "R",
    imdbRating: 7.6,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["Jackie Earle Haley", "Patrick Wilson", "Carla Gugino", "Malin Akerman"],
    plot: "In 1985 where former superheroes exist, the murder of a colleague sends active vigilante Rorschach into his own sprawling investigation.",
    boxOffice: "$185.3M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"
  },
  "NO TIME TO DIE": {
    title: "No Time to Die",
    releaseYear: 2021,
    genre: "Action",
    director: "Cary Joji Fukunaga",
    runtime: 163,
    rating: "PG-13",
    imdbRating: 7.3,
    studio: "MGM",
    format: "4K UHD",
    language: "English",
    cast: ["Daniel Craig", "Rami Malek", "Léa Seydoux", "Lashana Lynch"],
    plot: "James Bond has left active service. His peace is short-lived when Felix Leiter, an old friend from the CIA, turns up asking for help.",
    boxOffice: "$774.2M",
    country: "UK",
    poster: "https://image.tmdb.org/t/p/w500/iUgygt3fscRoKWCV1d0C7FbM9TP.jpg"
  },
  "THE SUICIDE SQUAD": {
    title: "The Suicide Squad",
    releaseYear: 2021,
    genre: "Action",
    director: "James Gunn",
    runtime: 132,
    rating: "R",
    imdbRating: 7.2,
    studio: "Warner Bros.",
    format: "4K UHD",
    language: "English",
    cast: ["Margot Robbie", "Idris Elba", "John Cena", "Joel Kinnaman"],
    plot: "Supervillains Harley Quinn, Bloodsport, Peacemaker and a collection of nutty cons at Belle Reve prison join the super-secret, super-shady Task Force X.",
    boxOffice: "$168.7M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/kb4s0ML0iVZlG6wAKbbs9NAm6X.jpg"
  },
  "OBI-WAN KENOBI": {
    title: "Obi-Wan Kenobi",
    releaseYear: 2022,
    genre: "Sci-Fi",
    director: "Deborah Chow",
    runtime: 360,
    rating: "TV-14",
    imdbRating: 7.1,
    studio: "Disney+",
    format: "Blu-ray",
    language: "English",
    cast: ["Ewan McGregor", "Hayden Christensen", "Moses Ingram", "Joel Edgerton"],
    plot: "Jedi Master Obi-Wan Kenobi watches over young Luke Skywalker and evades the Empire's elite Jedi hunters during his exile on the desert planet Tatooine.",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/qJRB789ceLryrLvOKrZqLKr2CGf.jpg"
  },
  "OCEAN'S ELEVEN": {
    title: "Ocean's Eleven",
    releaseYear: 2001,
    genre: "Crime",
    director: "Steven Soderbergh",
    runtime: 116,
    rating: "PG-13",
    imdbRating: 7.7,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["George Clooney", "Brad Pitt", "Matt Damon", "Andy Garcia"],
    plot: "Danny Ocean and his ten accomplices plan to rob three Las Vegas casinos simultaneously.",
    boxOffice: "$450.7M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/hQQCdZrsHtZyR6NbKH2YyCqd2fR.jpg"
  },
  "CONTAGION": {
    title: "Contagion",
    releaseYear: 2011,
    genre: "Thriller",
    director: "Steven Soderbergh",
    runtime: 106,
    rating: "PG-13",
    imdbRating: 6.8,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["Marion Cotillard", "Matt Damon", "Laurence Fishburne", "Jude Law"],
    plot: "Healthcare professionals, government officials and everyday people find themselves in the midst of a pandemic as the CDC works to find a cure.",
    boxOffice: "$135.5M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/4E0e92YbF60Qh7e1oGiSjKfrJjb.jpg"
  },
  "BARBIE": {
    title: "Barbie",
    releaseYear: 2023,
    genre: "Comedy",
    director: "Greta Gerwig",
    runtime: 114,
    rating: "PG-13",
    imdbRating: 6.9,
    studio: "Warner Bros.",
    format: "4K UHD",
    language: "English",
    cast: ["Margot Robbie", "Ryan Gosling", "America Ferrera", "Kate McKinnon"],
    plot: "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.",
    boxOffice: "$1.446B",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg"
  },
  "2001: A SPACE ODYSSEY": {
    title: "2001: A Space Odyssey",
    releaseYear: 1968,
    genre: "Sci-Fi",
    director: "Stanley Kubrick",
    runtime: 149,
    rating: "G",
    imdbRating: 8.3,
    studio: "MGM",
    format: "4K UHD",
    language: "English",
    cast: ["Keir Dullea", "Gary Lockwood", "William Sylvester", "Daniel Richter"],
    plot: "After discovering a mysterious artifact buried beneath the Lunar surface, mankind sets off on a quest to find its origins with help from intelligent supercomputer H.A.L. 9000.",
    awards: "Won 1 Oscar for Best Visual Effects",
    boxOffice: "$146M",
    country: "UK",
    poster: "https://image.tmdb.org/t/p/w500/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg"
  },
  "BEVERLY HILLS COP": {
    title: "Beverly Hills Cop",
    releaseYear: 1984,
    genre: "Action",
    director: "Martin Brest",
    runtime: 105,
    rating: "R",
    imdbRating: 7.4,
    studio: "Paramount Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Eddie Murphy", "Judge Reinhold", "John Ashton", "Lisa Eilbacher"],
    plot: "A freewheeling Detroit cop pursuing a murder investigation finds himself dealing with the very different culture of Beverly Hills.",
    boxOffice: "$234.8M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/eBJWbKoVoiLnQ6q4cZ8qXMbzNKr.jpg"
  },
  "THE DEPARTED": {
    title: "The Departed",
    releaseYear: 2006,
    genre: "Crime",
    director: "Martin Scorsese",
    runtime: 151,
    rating: "R",
    imdbRating: 8.5,
    studio: "Warner Bros.",
    format: "Blu-ray",
    language: "English",
    cast: ["Leonardo DiCaprio", "Matt Damon", "Jack Nicholson", "Mark Wahlberg"],
    plot: "An undercover cop and a police informant play a cat and mouse game with each other as they attempt to find out each other's identity.",
    awards: "Won 4 Oscars including Best Picture",
    boxOffice: "$291.5M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Qblg61T.jpg"
  },
  "KING KONG": {
    title: "King Kong",
    releaseYear: 2005,
    genre: "Adventure",
    director: "Peter Jackson",
    runtime: 187,
    rating: "PG-13",
    imdbRating: 7.2,
    studio: "Universal Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Naomi Watts", "Jack Black", "Adrien Brody", "Thomas Kretschmann"],
    plot: "A greedy film producer assembles a team of moviemakers and sets out for the infamous Skull Island, where they find more than just cannibalistic natives.",
    awards: "Won 3 Oscars for Technical Achievement",
    boxOffice: "$562.4M",
    country: "New Zealand",
    poster: "https://image.tmdb.org/t/p/w500/sKliKlTdu5zPhzk7YLuTW4E3IAm.jpg"
  },
  "FARGO": {
    title: "Fargo",
    releaseYear: 1996,
    genre: "Crime",
    director: "Joel Coen",
    runtime: 98,
    rating: "R",
    imdbRating: 8.1,
    studio: "Gramercy Pictures",
    format: "Blu-ray",
    language: "English",
    cast: ["Frances McDormand", "William H. Macy", "Steve Buscemi", "Peter Stormare"],
    plot: "Minnesota car salesman Jerry Lundegaard's inept crime falls apart due to his and his henchmen's bungling and the persistent police work of the quite pregnant Marge Gunderson.",
    awards: "Won 2 Oscars including Best Original Screenplay",
    boxOffice: "$60.6M",
    country: "USA",
    poster: "https://image.tmdb.org/t/p/w500/rt7cpEr1uP6RTZykBFhBTcRaKvG.jpg"
  }
};

// Function to get metadata for a movie title
export const getMovieMetadata = (title: string): MovieMetadata | null => {
  // Try exact match first
  if (MOVIE_METADATA_DATABASE[title]) {
    return MOVIE_METADATA_DATABASE[title];
  }
  
  // Try case-insensitive match
  const titleLower = title.toLowerCase();
  for (const [key, metadata] of Object.entries(MOVIE_METADATA_DATABASE)) {
    if (key.toLowerCase() === titleLower) {
      return metadata;
    }
  }
  
  // Try partial match
  for (const [key, metadata] of Object.entries(MOVIE_METADATA_DATABASE)) {
    if (key.toLowerCase().includes(titleLower) || titleLower.includes(key.toLowerCase())) {
      return metadata;
    }
  }
  
  return null;
};

// Function to enrich a movie with metadata
export const enrichMovieWithMetadata = (movieTitle: string): Partial<MovieMetadata> => {
  const metadata = getMovieMetadata(movieTitle);
  if (metadata) {
    return metadata;
  }
  
  // Return basic defaults if no metadata found
  return {
    title: movieTitle,
    format: "Blu-ray",
    language: "English"
  };
};

// Function to format runtime for display
export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

// Function to format box office for display
export const formatBoxOffice = (boxOffice: string): string => {
  return boxOffice.replace(/\$(\d+(?:\.\d+)?)([MBK])/g, (match, num, suffix) => {
    const suffixMap: Record<string, string> = {
      'K': ' thousand',
      'M': ' million',
      'B': ' billion'
    };
    return `$${num}${suffixMap[suffix] || suffix}`;
  });
};

// Function to get genre color for display
export const getGenreColor = (genre: string): string => {
  const genreColors: Record<string, string> = {
    'Action': 'bg-red-100 text-red-700',
    'Adventure': 'bg-orange-100 text-orange-700',
    'Comedy': 'bg-yellow-100 text-yellow-700',
    'Crime': 'bg-gray-100 text-gray-700',
    'Drama': 'bg-blue-100 text-blue-700',
    'Fantasy': 'bg-purple-100 text-purple-700',
    'Horror': 'bg-red-100 text-red-800',
    'Romance': 'bg-pink-100 text-pink-700',
    'Sci-Fi': 'bg-indigo-100 text-indigo-700',
    'Thriller': 'bg-gray-100 text-gray-800',
    'War': 'bg-red-100 text-red-800',
    'Western': 'bg-amber-100 text-amber-700'
  };
  return genreColors[genre] || 'bg-gray-100 text-gray-700';
};

// Function to get rating color for display
export const getRatingColor = (rating: string): string => {
  const ratingColors: Record<string, string> = {
    'G': 'bg-green-100 text-green-700',
    'PG': 'bg-blue-100 text-blue-700',
    'PG-13': 'bg-yellow-100 text-yellow-700',
    'R': 'bg-red-100 text-red-700',
    'NC-17': 'bg-red-100 text-red-800',
    'TV-14': 'bg-purple-100 text-purple-700',
    'TV-MA': 'bg-red-100 text-red-700'
  };
  return ratingColors[rating] || 'bg-gray-100 text-gray-700';
};

// Function to format cast list for display
export const formatCastList = (cast: string[], maxLength: number = 2): string => {
  if (!cast || cast.length === 0) return '';
  
  if (cast.length <= maxLength) {
    return cast.join(', ');
  }
  
  return `${cast.slice(0, maxLength).join(', ')} +${cast.length - maxLength} more`;
};

// Function to get decade from year
export const getDecade = (year: number): string => {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
};

// Function to calculate movie age
export const getMovieAge = (year: number): string => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age === 0) return 'This year';
  if (age === 1) return '1 year ago';
  if (age < 10) return `${age} years ago`;
  if (age < 20) return `${age} years ago`;
  if (age < 30) return `${age} years ago (${getDecade(year)})`;
  return `${age} years ago (Classic ${getDecade(year)})`;
};