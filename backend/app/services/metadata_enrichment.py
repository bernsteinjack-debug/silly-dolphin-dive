import logging
from typing import Optional, Dict, Any, List
import re
from .external_api_gateway import fetch_movie_details

# Configure logging
logger = logging.getLogger(__name__)

# Movie metadata database based on frontend's movieMetadataService
MOVIE_METADATA_DATABASE = {
    "The Godfather": {
        "director": "Francis Ford Coppola",
        "year": 1972,
        "genre": "Crime, Drama",
        "summary": "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son."
    },
    "Prestige": {
        "director": "Christopher Nolan",
        "year": 2006,
        "genre": "Drama, Mystery, Sci-Fi",
        "summary": "After a tragic accident, two stage magicians engage in a battle to create the ultimate illusion while sacrificing everything they have to outwit each other."
    },
    "Spectre": {
        "director": "Sam Mendes",
        "year": 2015,
        "genre": "Action, Adventure, Thriller",
        "summary": "A cryptic message from James Bond's past sends him on a trail to uncover a sinister organization. While M battles political forces to keep the secret service alive, Bond peels back the layers of deceit to reveal the terrible truth behind SPECTRE."
    },
    "Oppenheimer": {
        "director": "Christopher Nolan",
        "year": 2023,
        "genre": "Biography, Drama, History",
        "summary": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb."
    },
    "HELLBOY II THE GOLDEN ARMY": {
        "title": "Hellboy II: The Golden Army",
        "release_year": 2008,
        "genre": "Action",
        "director": "Guillermo del Toro",
        "runtime": 120,
        "rating": "PG-13",
        "imdb_rating": 7.0,
        "studio": "Universal Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Ron Perlman", "Selma Blair", "Doug Jones", "Jeffrey Tambor"],
        "plot": "The mythical world starts a rebellion against humanity in order to rule the Earth, so Hellboy and his team must save the world from the rebellious creatures.",
        "awards": "Nominated for 1 Oscar",
        "box_office": "$168.3M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/oCXGNjO7p3hyLnZi85ry3CWcUHh.jpg"
    },
    "HELLBOY II": {
        "title": "Hellboy II: The Golden Army",
        "release_year": 2008,
        "genre": "Action",
        "director": "Guillermo del Toro",
        "runtime": 120,
        "rating": "PG-13",
        "imdb_rating": 7.0,
        "studio": "Universal Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Ron Perlman", "Selma Blair", "Doug Jones", "Jeffrey Tambor"],
        "plot": "The mythical world starts a rebellion against humanity in order to rule the Earth, so Hellboy and his team must save the world from the rebellious creatures.",
        "awards": "Nominated for 1 Oscar",
        "box_office": "$168.3M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/oCXGNjO7p3hyLnZi85ry3CWcUHh.jpg"
    },
    "SNATCH": {
        "title": "Snatch",
        "release_year": 2000,
        "genre": "Crime",
        "director": "Guy Ritchie",
        "runtime": 104,
        "rating": "R",
        "imdb_rating": 8.2,
        "studio": "Columbia Pictures",
        "format": "DVD",
        "language": "English",
        "cast": ["Jason Statham", "Brad Pitt", "Benicio Del Toro", "Dennis Farina"],
        "plot": "Unscrupulous boxing promoters, violent bookmakers, a Russian gangster, incompetent amateur robbers and supposedly Jewish jewelers fight to track down a priceless stolen diamond.",
        "box_office": "$83.6M",
        "country": "UK",
        "poster_url": "https://image.tmdb.org/t/p/w500/56mOJth6DJ6JhgoE2jtpilVqJO.jpg"
    },
    "GLORY": {
        "title": "Glory",
        "release_year": 1989,
        "genre": "Drama",
        "director": "Edward Zwick",
        "runtime": 122,
        "rating": "R",
        "imdb_rating": 7.8,
        "studio": "TriStar Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Matthew Broderick", "Denzel Washington", "Cary Elwes", "Morgan Freeman"],
        "plot": "Robert Gould Shaw leads the U.S. Civil War's first all-black volunteer company, fighting prejudices from both his own Union Army and the Confederates.",
        "awards": "Won 3 Oscars",
        "box_office": "$26.8M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/7bA4FqSD9Iu0GlWoWdpHkNXdTkV.jpg"
    },
    "SPIDER-MAN TRILOGY": {
        "title": "Spider-Man Trilogy",
        "release_year": 2002,
        "genre": "Action",
        "director": "Sam Raimi",
        "runtime": 363,
        "rating": "PG-13",
        "imdb_rating": 7.3,
        "studio": "Sony Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Tobey Maguire", "Kirsten Dunst", "James Franco", "Willem Dafoe"],
        "plot": "The complete trilogy following Peter Parker's journey from high school student to the web-slinging superhero Spider-Man.",
        "box_office": "$2.5B",
        "country": "USA"
    },
    "SPIDER-MAN": {
        "title": "Spider-Man",
        "release_year": 2002,
        "genre": "Action",
        "director": "Sam Raimi",
        "runtime": 121,
        "rating": "PG-13",
        "imdb_rating": 7.4,
        "studio": "Sony Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Tobey Maguire", "Kirsten Dunst", "Willem Dafoe", "James Franco"],
        "plot": "After being bitten by a genetically-modified spider, a shy teenager gains spider-like abilities that he uses to fight injustice as a masked superhero.",
        "box_office": "$825M",
        "country": "USA"
    },
    "FURIOSA A MAD MAX SAGA": {
        "title": "Furiosa: A Mad Max Saga",
        "release_year": 2024,
        "genre": "Action",
        "director": "George Miller",
        "runtime": 148,
        "rating": "R",
        "imdb_rating": 7.7,
        "studio": "Warner Bros.",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Anya Taylor-Joy", "Chris Hemsworth", "Tom Burke", "Alyla Browne"],
        "plot": "The origin story of renegade warrior Furiosa before her encounter and teamup with Mad Max.",
        "box_office": "$173.6M",
        "country": "Australia"
    },
    "FURIOSA": {
        "title": "Furiosa: A Mad Max Saga",
        "release_year": 2024,
        "genre": "Action",
        "director": "George Miller",
        "runtime": 148,
        "rating": "R",
        "imdb_rating": 7.7,
        "studio": "Warner Bros.",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Anya Taylor-Joy", "Chris Hemsworth", "Tom Burke", "Alyla Browne"],
        "plot": "The origin story of renegade warrior Furiosa before her encounter and teamup with Mad Max.",
        "box_office": "$173.6M",
        "country": "Australia"
    },
    "MAD MAX FURY ROAD": {
        "title": "Mad Max: Fury Road",
        "release_year": 2015,
        "genre": "Action",
        "director": "George Miller",
        "runtime": 120,
        "rating": "R",
        "imdb_rating": 8.1,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Tom Hardy", "Charlize Theron", "Nicholas Hoult", "Hugh Keays-Byrne"],
        "plot": "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.",
        "awards": "Won 6 Oscars",
        "box_office": "$378.9M",
        "country": "Australia"
    },
    "BATMAN": {
        "title": "Batman",
        "release_year": 1989,
        "genre": "Action",
        "director": "Tim Burton",
        "runtime": 126,
        "rating": "PG-13",
        "imdb_rating": 7.5,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Michael Keaton", "Jack Nicholson", "Kim Basinger", "Robert Wuhl"],
        "plot": "The Dark Knight of Gotham City begins his war on crime with his first major enemy being Jack Napier, a criminal who becomes the clownishly homicidal Joker.",
        "box_office": "$411.3M",
        "country": "USA"
    },
    "BATMAN BEGINS": {
        "title": "Batman Begins",
        "release_year": 2005,
        "genre": "Action",
        "director": "Christopher Nolan",
        "runtime": 140,
        "rating": "PG-13",
        "imdb_rating": 8.2,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Christian Bale", "Michael Caine", "Liam Neeson", "Katie Holmes"],
        "plot": "After training with his mentor, Batman begins his fight to free crime-ridden Gotham City from corruption.",
        "box_office": "$373.7M",
        "country": "USA"
    },
    "THE DARK KNIGHT": {
        "title": "The Dark Knight",
        "release_year": 2008,
        "genre": "Action",
        "director": "Christopher Nolan",
        "runtime": 152,
        "rating": "PG-13",
        "imdb_rating": 9.0,
        "studio": "Warner Bros.",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
        "plot": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
        "awards": "Won 2 Oscars",
        "box_office": "$1.005B",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    "DOOM": {
        "title": "Doom",
        "release_year": 2005,
        "genre": "Action",
        "director": "Andrzej Bartkowiak",
        "runtime": 105,
        "rating": "R",
        "imdb_rating": 5.2,
        "studio": "Universal Pictures",
        "format": "DVD",
        "language": "English",
        "cast": ["Dwayne Johnson", "Karl Urban", "Rosamund Pike", "Razaaq Adoti"],
        "plot": "Space Marines are sent to investigate strange events at a research facility on Mars but find themselves at the mercy of genetically enhanced killing machines.",
        "box_office": "$58.7M",
        "country": "USA"
    },
    "GOTHAM": {
        "title": "Gotham",
        "release_year": 2014,
        "genre": "Crime",
        "director": "Bruno Heller",
        "runtime": 2640,
        "rating": "TV-14",
        "imdb_rating": 7.8,
        "studio": "Warner Bros. Television",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Ben McKenzie", "Donal Logue", "David Mazouz", "Sean Pertwee"],
        "plot": "The story behind Detective James Gordon's rise to prominence in Gotham City in the years before Batman's arrival.",
        "country": "USA"
    },
    "DRIVE": {
        "title": "Drive",
        "release_year": 2011,
        "genre": "Crime",
        "director": "Nicolas Winding Refn",
        "runtime": 100,
        "rating": "R",
        "imdb_rating": 7.8,
        "studio": "FilmDistrict",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Ryan Gosling", "Carey Mulligan", "Bryan Cranston", "Albert Brooks"],
        "plot": "A mysterious Hollywood stuntman and mechanic moonlights as a getaway driver and finds himself in trouble when he helps out his neighbor.",
        "awards": "Won Best Director at Cannes",
        "box_office": "$78.4M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/602vevIURmpDfzbnv5Ubi6wIkQm.jpg"
    },
    "TAXI DRIVER": {
        "title": "Taxi Driver",
        "release_year": 1976,
        "genre": "Crime",
        "director": "Martin Scorsese",
        "runtime": 114,
        "rating": "R",
        "imdb_rating": 8.2,
        "studio": "Columbia Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Robert De Niro", "Jodie Foster", "Cybill Shepherd", "Harvey Keitel"],
        "plot": "A mentally unstable veteran works as a nighttime taxi driver in New York City, where the perceived decadence and sleaze fuels his urge for violent action.",
        "awards": "Nominated for 4 Oscars",
        "box_office": "$28.3M",
        "country": "USA"
    },
    "CASINO ROYALE": {
        "title": "Casino Royale",
        "release_year": 2006,
        "genre": "Action",
        "director": "Martin Campbell",
        "runtime": 144,
        "rating": "PG-13",
        "imdb_rating": 8.0,
        "studio": "Sony Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Daniel Craig", "Eva Green", "Mads Mikkelsen", "Judi Dench"],
        "plot": "After earning 00 status and a licence to kill, secret agent James Bond sets out on his first mission as 007.",
        "box_office": "$616.5M",
        "country": "UK",
        "poster_url": "https://image.tmdb.org/t/p/w500/zlWBxz2pTA9p45kUTrI8AQiKYh8.jpg"
    },
    "JAMES BOND": {
        "title": "James Bond Collection",
        "release_year": 1962,
        "genre": "Action",
        "director": "Various",
        "runtime": 3000,
        "rating": "PG-13",
        "imdb_rating": 7.5,
        "studio": "MGM",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Sean Connery", "Roger Moore", "Pierce Brosnan", "Daniel Craig"],
        "plot": "The complete collection of James Bond films featuring the world's most famous secret agent.",
        "box_office": "$7.1B",
        "country": "UK"
    },
    "007": {
        "title": "007 Collection",
        "release_year": 1962,
        "genre": "Action",
        "director": "Various",
        "runtime": 3000,
        "rating": "PG-13",
        "imdb_rating": 7.5,
        "studio": "MGM",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Sean Connery", "Roger Moore", "Pierce Brosnan", "Daniel Craig"],
        "plot": "The complete collection of 007 James Bond films.",
        "box_office": "$7.1B",
        "country": "UK"
    },
    "ROCKY": {
        "title": "Rocky",
        "release_year": 1976,
        "genre": "Drama",
        "director": "John G. Avildsen",
        "runtime": 120,
        "rating": "PG",
        "imdb_rating": 8.1,
        "studio": "United Artists",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Sylvester Stallone", "Talia Shire", "Burt Young", "Carl Weathers"],
        "plot": "A small-time Philadelphia boxer gets a supremely rare chance to fight the world heavyweight champion in a bout in which he strives to go the distance for his self-respect.",
        "awards": "Won 3 Oscars including Best Picture",
        "box_office": "$225M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/cqxg1CihGR5ge0i7wYXr4Rdeppu.jpg"
    },
    "THE SOCIAL NETWORK": {
        "title": "The Social Network",
        "release_year": 2010,
        "genre": "Drama",
        "director": "David Fincher",
        "runtime": 120,
        "rating": "PG-13",
        "imdb_rating": 7.7,
        "studio": "Columbia Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake", "Rooney Mara"],
        "plot": "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea.",
        "awards": "Won 3 Oscars",
        "box_office": "$224.9M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg"
    },
    "THE BOURNE IDENTITY": {
        "title": "The Bourne Identity",
        "release_year": 2002,
        "genre": "Action",
        "director": "Doug Liman",
        "runtime": 119,
        "rating": "PG-13",
        "imdb_rating": 7.9,
        "studio": "Universal Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Matt Damon", "Franka Potente", "Chris Cooper", "Clive Owen"],
        "plot": "A man is picked up by a fishing boat, bullet-riddled and suffering from amnesia, before racing to elude assassins and attempting to regain his memory.",
        "box_office": "$214.0M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/bXQIL36VQdzJ69lcjQR1WQzJqQR.jpg"
    },
    "PLATOON": {
        "title": "Platoon",
        "release_year": 1986,
        "genre": "War",
        "director": "Oliver Stone",
        "runtime": 120,
        "rating": "R",
        "imdb_rating": 8.1,
        "studio": "Orion Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Charlie Sheen", "Tom Berenger", "Willem Dafoe", "Forest Whitaker"],
        "plot": "A young soldier in Vietnam faces a moral crisis when confronted with the horrors of war and the duality of man.",
        "awards": "Won 4 Oscars including Best Picture",
        "box_office": "$138.5M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/m3mmFkPQKvPZq5exmh0bDuXlD9T.jpg"
    },
    "UNFORGIVEN": {
        "title": "Unforgiven",
        "release_year": 1992,
        "genre": "Western",
        "director": "Clint Eastwood",
        "runtime": 131,
        "rating": "R",
        "imdb_rating": 8.2,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Clint Eastwood", "Gene Hackman", "Morgan Freeman", "Richard Harris"],
        "plot": "Retired Old West gunslinger William Munny reluctantly takes on one last job, with the help of his old partner Ned Logan and a young man, The Schofield Kid.",
        "awards": "Won 4 Oscars including Best Picture",
        "box_office": "$159.2M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/sonW1WS8ZbwiuOVGjfKHq4wDiJl.jpg"
    },
    "GLADIATOR": {
        "title": "Gladiator",
        "release_year": 2000,
        "genre": "Action",
        "director": "Ridley Scott",
        "runtime": 155,
        "rating": "R",
        "imdb_rating": 8.5,
        "studio": "DreamWorks",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen", "Oliver Reed"],
        "plot": "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
        "awards": "Won 5 Oscars including Best Picture",
        "box_office": "$460.5M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg"
    },
    "WATCHMEN": {
        "title": "Watchmen",
        "release_year": 2009,
        "genre": "Action",
        "director": "Zack Snyder",
        "runtime": 162,
        "rating": "R",
        "imdb_rating": 7.6,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Jackie Earle Haley", "Patrick Wilson", "Carla Gugino", "Malin Akerman"],
        "plot": "In 1985 where former superheroes exist, the murder of a colleague sends active vigilante Rorschach into his own sprawling investigation.",
        "box_office": "$185.3M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"
    },
    "NO TIME TO DIE": {
        "title": "No Time to Die",
        "release_year": 2021,
        "genre": "Action",
        "director": "Cary Joji Fukunaga",
        "runtime": 163,
        "rating": "PG-13",
        "imdb_rating": 7.3,
        "studio": "MGM",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Daniel Craig", "Rami Malek", "Léa Seydoux", "Lashana Lynch"],
        "plot": "James Bond has left active service. His peace is short-lived when Felix Leiter, an old friend from the CIA, turns up asking for help.",
        "box_office": "$774.2M",
        "country": "UK",
        "poster_url": "https://image.tmdb.org/t/p/w500/iUgygt3fscRoKWCV1d0C7FbM9TP.jpg"
    },
    "THE SUICIDE SQUAD": {
        "title": "The Suicide Squad",
        "release_year": 2021,
        "genre": "Action",
        "director": "James Gunn",
        "runtime": 132,
        "rating": "R",
        "imdb_rating": 7.2,
        "studio": "Warner Bros.",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Margot Robbie", "Idris Elba", "John Cena", "Joel Kinnaman"],
        "plot": "Supervillains Harley Quinn, Bloodsport, Peacemaker and a collection of nutty cons at Belle Reve prison join the super-secret, super-shady Task Force X.",
        "box_office": "$168.7M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/kb4s0ML0iVZlG6wAKbbs9NAm6X.jpg"
    },
    "OBI-WAN KENOBI": {
        "title": "Obi-Wan Kenobi",
        "release_year": 2022,
        "genre": "Sci-Fi",
        "director": "Deborah Chow",
        "runtime": 360,
        "rating": "TV-14",
        "imdb_rating": 7.1,
        "studio": "Disney+",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Ewan McGregor", "Hayden Christensen", "Moses Ingram", "Joel Edgerton"],
        "plot": "Jedi Master Obi-Wan Kenobi watches over young Luke Skywalker and evades the Empire's elite Jedi hunters during his exile on the desert planet Tatooine.",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/qJRB789ceLryrLvOKrZqLKr2CGf.jpg"
    },
    "OCEAN'S ELEVEN": {
        "title": "Ocean's Eleven",
        "release_year": 2001,
        "genre": "Crime",
        "director": "Steven Soderbergh",
        "runtime": 116,
        "rating": "PG-13",
        "imdb_rating": 7.7,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["George Clooney", "Brad Pitt", "Matt Damon", "Andy Garcia"],
        "plot": "Danny Ocean and his ten accomplices plan to rob three Las Vegas casinos simultaneously.",
        "box_office": "$450.7M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/hQQCdZrsHtZyR6NbKH2YyCqd2fR.jpg"
    },
    "CONTAGION": {
        "title": "Contagion",
        "release_year": 2011,
        "genre": "Thriller",
        "director": "Steven Soderbergh",
        "runtime": 106,
        "rating": "PG-13",
        "imdb_rating": 6.8,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Marion Cotillard", "Matt Damon", "Laurence Fishburne", "Jude Law"],
        "plot": "Healthcare professionals, government officials and everyday people find themselves in the midst of a pandemic as the CDC works to find a cure.",
        "box_office": "$135.5M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/4E0e92YbF60Qh7e1oGiSjKfrJjb.jpg"
    },
    "BARBIE": {
        "title": "Barbie",
        "release_year": 2023,
        "genre": "Comedy",
        "director": "Greta Gerwig",
        "runtime": 114,
        "rating": "PG-13",
        "imdb_rating": 6.9,
        "studio": "Warner Bros.",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Margot Robbie", "Ryan Gosling", "America Ferrera", "Kate McKinnon"],
        "plot": "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.",
        "box_office": "$1.446B",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg"
    },
    "2001: A SPACE ODYSSEY": {
        "title": "2001: A Space Odyssey",
        "release_year": 1968,
        "genre": "Sci-Fi",
        "director": "Stanley Kubrick",
        "runtime": 149,
        "rating": "G",
        "imdb_rating": 8.3,
        "studio": "MGM",
        "format": "4K UHD",
        "language": "English",
        "cast": ["Keir Dullea", "Gary Lockwood", "William Sylvester", "Daniel Richter"],
        "plot": "After discovering a mysterious artifact buried beneath the Lunar surface, mankind sets off on a quest to find its origins with help from intelligent supercomputer H.A.L. 9000.",
        "awards": "Won 1 Oscar for Best Visual Effects",
        "box_office": "$146M",
        "country": "UK",
        "poster_url": "https://image.tmdb.org/t/p/w500/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg"
    },
    "BEVERLY HILLS COP": {
        "title": "Beverly Hills Cop",
        "release_year": 1984,
        "genre": "Action",
        "director": "Martin Brest",
        "runtime": 105,
        "rating": "R",
        "imdb_rating": 7.4,
        "studio": "Paramount Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Eddie Murphy", "Judge Reinhold", "John Ashton", "Lisa Eilbacher"],
        "plot": "A freewheeling Detroit cop pursuing a murder investigation finds himself dealing with the very different culture of Beverly Hills.",
        "box_office": "$234.8M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/eBJWbKoVoiLnQ6q4cZ8qXMbzNKr.jpg"
    },
    "THE DEPARTED": {
        "title": "The Departed",
        "release_year": 2006,
        "genre": "Crime",
        "director": "Martin Scorsese",
        "runtime": 151,
        "rating": "R",
        "imdb_rating": 8.5,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Leonardo DiCaprio", "Matt Damon", "Jack Nicholson", "Mark Wahlberg"],
        "plot": "An undercover cop and a police informant play a cat and mouse game with each other as they attempt to find out each other's identity.",
        "awards": "Won 4 Oscars including Best Picture",
        "box_office": "$291.5M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/nT97ifVT2J1yMQmeq20Qblg61T.jpg"
    },
    "FARGO": {
        "title": "Fargo",
        "release_year": 1996,
        "genre": "Crime",
        "director": "Joel Coen",
        "runtime": 98,
        "rating": "R",
        "imdb_rating": 8.1,
        "studio": "Gramercy Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Frances McDormand", "William H. Macy", "Steve Buscemi", "Peter Stormare"],
        "plot": "Minnesota car salesman Jerry Lundegaard's inept crime falls apart due to his and his henchmen's bungling and the persistent police work of the quite pregnant Marge Gunderson.",
        "awards": "Won 2 Oscars including Best Original Screenplay",
        "box_office": "$60.6M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/rt7cpEr1uP6RTZykBFhBTcRaKvG.jpg"
    },
    "BRAVEHEART": {
        "title": "Braveheart",
        "release_year": 1995,
        "genre": "Drama",
        "director": "Mel Gibson",
        "runtime": 178,
        "rating": "R",
        "imdb_rating": 8.3,
        "studio": "Paramount Pictures",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Mel Gibson", "Sophie Marceau", "Patrick McGoohan", "Catherine McCormack"],
        "plot": "Scottish warrior William Wallace leads his countrymen in a rebellion to free his homeland from the tyranny of King Edward I of England.",
        "awards": "Won 5 Oscars including Best Picture",
        "box_office": "$213.2M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/or1gBugydmjToAEq7OZY0owwFk.jpg"
    },
    "EDGE OF TOMORROW LIVE. DIE. REPEAT.": {
        "title": "Edge of Tomorrow",
        "release_year": 2014,
        "genre": "Sci-Fi",
        "director": "Doug Liman",
        "runtime": 113,
        "rating": "PG-13",
        "imdb_rating": 7.9,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Tom Cruise", "Emily Blunt", "Bill Paxton", "Brendan Gleeson"],
        "plot": "A soldier fighting aliens gets to relive the same day over and over again, the day restarting every time he dies.",
        "awards": "Nominated for 1 BAFTA",
        "box_office": "$370.5M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/tpoVEYvm6qcXueZrQYJNRLXL88s.jpg"
    },
    "HEAT": {
        "title": "Heat",
        "release_year": 1995,
        "genre": "Crime",
        "director": "Michael Mann",
        "runtime": 170,
        "rating": "R",
        "imdb_rating": 8.3,
        "studio": "Warner Bros.",
        "format": "Blu-ray",
        "language": "English",
        "cast": ["Al Pacino", "Robert De Niro", "Val Kilmer", "Jon Voight"],
        "plot": "A group of high-end professional thieves start to feel the heat from the LAPD when they unknowingly leave a clue at their latest heist.",
        "awards": "Nominated for 1 Oscar",
        "box_office": "$187.4M",
        "country": "USA",
        "poster_url": "https://image.tmdb.org/t/p/w500/zMpJY5CJKUufG9OTw0In4eAFqPX.jpg"
    },
}


def normalize_title(title: str) -> str:
    """Normalize title for matching by removing special characters and converting to uppercase"""
    # Remove common punctuation and normalize spacing
    normalized = re.sub(r'[^\w\s]', '', title.upper())
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized


def get_movie_metadata(title: str, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Get metadata for a movie title with fuzzy matching, optionally filtering by year.
    """
    if not title:
        return None

    logger.info(f"Searching for metadata for title: {title} (Year: {year})")

    # If year is in title, parse it out
    year_match = re.search(r'\((\d{4})\)$', title)
    if year_match:
        year = int(year_match.group(1))
        title = title.replace(year_match.group(0), '').strip()

    # --- Local Database Search ---

    # Try exact match first
    if title in MOVIE_METADATA_DATABASE:
        logger.info(f"Found exact match for '{title}' in local database.")
        return MOVIE_METADATA_DATABASE[title]

    # Try case-insensitive match
    title_upper = title.upper()
    for key, metadata in MOVIE_METADATA_DATABASE.items():
        if key.upper() == title_upper:
            logger.info(f"Found case-insensitive match for '{title}' in local database.")
            return metadata

    # Try normalized matching
    normalized_input = normalize_title(title)
    for key, metadata in MOVIE_METADATA_DATABASE.items():
        normalized_key = normalize_title(key)
        if normalized_key == normalized_input:
            logger.info(f"Found normalized match for '{title}' in local database.")
            return metadata

    # Try partial matching
    for key, metadata in MOVIE_METADATA_DATABASE.items():
        normalized_key = normalize_title(key)
        if (normalized_input in normalized_key or
            normalized_key in normalized_input or
            any(word in normalized_key for word in normalized_input.split() if len(word) > 3)):
            logger.info(f"Found partial match for '{title}' in local database.")
            return metadata

    # --- External API Search ---
    
    logger.info(f"No local match for '{title}', fetching from external API.")
    try:
        details = fetch_movie_details(title, year)
        if details:
            logger.info(f"Successfully fetched details for '{title}' from external API.")
        else:
            logger.warning(f"No details found for '{title}' from external API.")
        return details
    except Exception as e:
        logger.error(f"Error fetching movie details for '{title}' from external API: {e}", exc_info=True)
        return None


def enrich_movie_data(movie_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enrich movie data with metadata from the database"""
    title = movie_data.get("title", "")
    if not title:
        return movie_data
    
    # Get metadata from database
    metadata = get_movie_metadata(title)
    if not metadata:
        # Return with basic defaults if no metadata found
        enriched_data = movie_data.copy()
        if not enriched_data.get("format"):
            enriched_data["format"] = "Blu-ray"
        if not enriched_data.get("language"):
            enriched_data["language"] = "English"
        return enriched_data
    
    # Create enriched data by merging existing data with metadata
    # Existing data takes precedence over metadata
    enriched_data = metadata.copy()
    
    # Override with existing user data (user data has priority)
    for key, value in movie_data.items():
        if value is not None and value != "":
            enriched_data[key] = value
    
    return enriched_data


def get_enrichment_suggestions(title: str) -> List[Dict[str, Any]]:
    """Get multiple metadata suggestions for a title"""
    if not title:
        return []
    
    suggestions = []
    normalized_input = normalize_title(title)
    
    # Find all potential matches
    for key, metadata in MOVIE_METADATA_DATABASE.items():
        normalized_key = normalize_title(key)
        
        # Calculate match score
        score = 0
        if normalized_key == normalized_input:
            score = 100
        elif normalized_input in normalized_key or normalized_key in normalized_input:
            score = 80
        elif any(word in normalized_key for word in normalized_input.split() if len(word) > 3):
            score = 60
        
        if score > 0:
            suggestion = metadata.copy()
            suggestion["match_score"] = score
            suggestions.append(suggestion)
    
    # Sort by match score and return top 5
    suggestions.sort(key=lambda x: x["match_score"], reverse=True)
    return suggestions[:5]


def format_runtime(minutes: int) -> str:
    """Format runtime for display"""
    if not minutes:
        return ""
    
    hours = minutes // 60
    mins = minutes % 60
    
    if hours == 0:
        return f"{mins}m"
    elif mins == 0:
        return f"{hours}h"
    else:
        return f"{hours}h {mins}m"


def get_genre_categories() -> List[str]:
    """Get all unique genres from the database"""
    genres = set()
    for metadata in MOVIE_METADATA_DATABASE.values():
        if metadata.get("genre"):
            genres.add(metadata["genre"])
    return sorted(list(genres))


def get_studios() -> List[str]:
    """Get all unique studios from the database"""
    studios = set()
    for metadata in MOVIE_METADATA_DATABASE.values():
        if metadata.get("studio"):
            studios.add(metadata["studio"])
    return sorted(list(studios))


def get_directors() -> List[str]:
    """Get all unique directors from the database"""
    directors = set()
    for metadata in MOVIE_METADATA_DATABASE.values():
        if metadata.get("director"):
            directors.add(metadata["director"])
    return sorted(list(directors))