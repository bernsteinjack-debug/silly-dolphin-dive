import asyncio
import logging
from typing import List, Optional, Dict, Any
import requests
from datetime import datetime, timedelta
import json
import os
import httpx
from anthropic import Anthropic

from ..models.movie_metadata import ExternalMovieData


logger = logging.getLogger(__name__)


class ExternalAPIGateway:
    """Gateway for external movie APIs (TMDB and OMDB)"""
    
    def __init__(self):
        # API configuration - these should be set via environment variables
        self.tmdb_api_key = "your_tmdb_api_key_here"  # Replace with actual key
        self.omdb_api_key = "your_omdb_api_key_here"  # Replace with actual key
        
        self.tmdb_base_url = "https://api.themoviedb.org/3"
        self.omdb_base_url = "http://www.omdbapi.com"
        
        # Rate limiting
        self.tmdb_requests_per_second = 40  # TMDB allows 40 requests per 10 seconds
        self.omdb_requests_per_second = 1000  # OMDB allows 1000 requests per day
        
        # Request timeout
        self.timeout = 10
        
        # Cache for API responses (simple in-memory cache)
        self._cache = {}
        self._cache_ttl = timedelta(hours=24)
        
        # Initialize Anthropic client
        self.anthropic_client = None
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_api_key and anthropic_api_key != "your-anthropic-api-key":
            try:
                self.anthropic_client = Anthropic(api_key=anthropic_api_key)
                logger.info("Anthropic client initialized successfully in gateway")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client in gateway: {e}")
        else:
            logger.warning("Anthropic API key not found or not set in gateway")

    def _get_cache_key(self, api: str, endpoint: str, params: Dict[str, Any]) -> str:
        """Generate cache key for API requests"""
        params_str = json.dumps(params, sort_keys=True)
        return f"{api}:{endpoint}:{params_str}"
    
    def _is_cache_valid(self, cache_entry: Dict[str, Any]) -> bool:
        """Check if cache entry is still valid"""
        if not cache_entry:
            return False
        
        cached_at = cache_entry.get('cached_at')
        if not cached_at:
            return False
        
        return datetime.utcnow() - cached_at < self._cache_ttl
    
    async def call_anthropic_vision_api(self, base64_image: str, prompt: str) -> Optional[Dict[str, Any]]:
        """Call the Anthropic Vision API."""
        if not self.anthropic_client:
            logger.error("Anthropic client not initialized in gateway.")
            return None

        try:
            logger.info("Calling Anthropic Vision API via gateway.")
            message = await asyncio.to_thread(
                self.anthropic_client.messages.create,
                model="claude-3-5-sonnet-20240620",
                max_tokens=8000,
                temperature=0,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": base64_image,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )
            logger.info("Successfully received response from Anthropic Vision API.")
            return message.dict()
        except httpx.HTTPStatusError as e:
            logger.error(f"Anthropic API request failed with status {e.response.status_code}: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"An unexpected error occurred during Anthropic API call: {e}")
            return None

    async def search_tmdb(self, query: str, year: Optional[int] = None) -> List[ExternalMovieData]:
        """Search for movies using TMDB API"""
        try:
            # Prepare search parameters
            params = {
                'api_key': self.tmdb_api_key,
                'query': query,
                'include_adult': 'false'
            }
            
            if year:
                params['year'] = year
            
            # Check cache first
            cache_key = self._get_cache_key('tmdb', 'search', params)
            if cache_key in self._cache and self._is_cache_valid(self._cache[cache_key]):
                logger.info(f"Returning cached TMDB results for query: {query}")
                return self._cache[cache_key]['data']
            
            # Make API request
            url = f"{self.tmdb_base_url}/search/movie"
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            for movie in data.get('results', []):
                # Get additional details for each movie
                movie_details = await self._get_tmdb_movie_details(movie['id'])
                if movie_details:
                    results.append(movie_details)
            
            # Cache the results
            self._cache[cache_key] = {
                'data': results,
                'cached_at': datetime.utcnow()
            }
            
            logger.info(f"Found {len(results)} TMDB results for query: {query}")
            return results
            
        except requests.exceptions.RequestException as e:
            logger.error(f"TMDB API request failed for query '{query}': {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in TMDB search for query '{query}': {e}")
            return []
    
    async def _get_tmdb_movie_details(self, tmdb_id: int) -> Optional[ExternalMovieData]:
        """Get detailed movie information from TMDB"""
        try:
            params = {
                'api_key': self.tmdb_api_key,
                'append_to_response': 'credits'
            }
            
            # Check cache first
            cache_key = self._get_cache_key('tmdb', 'details', {'id': tmdb_id})
            if cache_key in self._cache and self._is_cache_valid(self._cache[cache_key]):
                return self._cache[cache_key]['data']
            
            url = f"{self.tmdb_base_url}/movie/{tmdb_id}"
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract cast information
            cast = []
            if 'credits' in data and 'cast' in data['credits']:
                cast = [actor['name'] for actor in data['credits']['cast'][:10]]  # Top 10 cast members
            
            # Extract director information
            director = None
            if 'credits' in data and 'crew' in data['credits']:
                for crew_member in data['credits']['crew']:
                    if crew_member['job'] == 'Director':
                        director = crew_member['name']
                        break
            
            # Extract genres
            genres = [genre['name'] for genre in data.get('genres', [])]
            
            # Build poster URL
            poster_url = None
            if data.get('poster_path'):
                poster_url = f"https://image.tmdb.org/t/p/w500{data['poster_path']}"
            
            # Parse release year
            release_year = None
            if data.get('release_date'):
                try:
                    release_year = int(data['release_date'][:4])
                except (ValueError, TypeError):
                    pass
            
            movie_data = ExternalMovieData(
                source="tmdb",
                tmdb_id=str(tmdb_id),
                imdb_id=data.get('imdb_id'),
                title=data.get('title', ''),
                release_year=release_year,
                genres=genres,
                director=director,
                cast=cast,
                plot=data.get('overview'),
                poster_url=poster_url,
                ratings={'tmdb': data.get('vote_average', 0.0)},
                runtime=data.get('runtime'),
                country=data.get('production_countries', [{}]).get('name') if data.get('production_countries') else None,
                studio=data.get('production_companies', [{}]).get('name') if data.get('production_companies') else None
            )
            
            # Cache the result
            self._cache[cache_key] = {
                'data': movie_data,
                'cached_at': datetime.utcnow()
            }
            
            return movie_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"TMDB details request failed for ID {tmdb_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting TMDB details for ID {tmdb_id}: {e}")
            return None
    
    async def search_omdb(self, query: str, year: Optional[int] = None) -> List[ExternalMovieData]:
        """Search for movies using OMDB API"""
        try:
            # Prepare search parameters
            params = {
                'apikey': self.omdb_api_key,
                's': query,
                'type': 'movie'
            }
            
            if year:
                params['y'] = year
            
            # Check cache first
            cache_key = self._get_cache_key('omdb', 'search', params)
            if cache_key in self._cache and self._is_cache_valid(self._cache[cache_key]):
                logger.info(f"Returning cached OMDB results for query: {query}")
                return self._cache[cache_key]['data']
            
            # Make API request
            response = requests.get(self.omdb_base_url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            if data.get('Response') == 'True' and 'Search' in data:
                for movie in data['Search']:
                    # Get detailed information for each movie
                    movie_details = await self._get_omdb_movie_details(movie['imdbID'])
                    if movie_details:
                        results.append(movie_details)
            
            # Cache the results
            self._cache[cache_key] = {
                'data': results,
                'cached_at': datetime.utcnow()
            }
            
            logger.info(f"Found {len(results)} OMDB results for query: {query}")
            return results
            
        except requests.exceptions.RequestException as e:
            logger.error(f"OMDB API request failed for query '{query}': {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in OMDB search for query '{query}': {e}")
            return []
    
    async def _get_omdb_movie_details(self, imdb_id: str) -> Optional[ExternalMovieData]:
        """Get detailed movie information from OMDB"""
        try:
            params = {
                'apikey': self.omdb_api_key,
                'i': imdb_id,
                'plot': 'full'
            }
            
            # Check cache first
            cache_key = self._get_cache_key('omdb', 'details', {'imdb_id': imdb_id})
            if cache_key in self._cache and self._is_cache_valid(self._cache[cache_key]):
                return self._cache[cache_key]['data']
            
            response = requests.get(self.omdb_base_url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('Response') != 'True':
                return None
            
            # Parse cast
            cast = []
            if data.get('Actors'):
                cast = [actor.strip() for actor in data['Actors'].split(',')]
            
            # Parse genres
            genres = []
            if data.get('Genre'):
                genres = [genre.strip() for genre in data['Genre'].split(',')]
            
            # Parse ratings
            ratings = {}
            if data.get('imdbRating') and data['imdbRating'] != 'N/A':
                try:
                    ratings['imdb'] = float(data['imdbRating'])
                except ValueError:
                    pass
            
            # Parse runtime
            runtime = None
            if data.get('Runtime') and data['Runtime'] != 'N/A':
                try:
                    runtime = int(data['Runtime'].split())  # Extract number from "120 min"
                except (ValueError, IndexError):
                    pass
            
            # Parse release year
            release_year = None
            if data.get('Year') and data['Year'] != 'N/A':
                try:
                    release_year = int(data['Year'])
                except ValueError:
                    pass
            
            movie_data = ExternalMovieData(
                source="omdb",
                imdb_id=imdb_id,
                title=data.get('Title', ''),
                release_year=release_year,
                genres=genres,
                director=data.get('Director') if data.get('Director') != 'N/A' else None,
                cast=cast,
                plot=data.get('Plot') if data.get('Plot') != 'N/A' else None,
                poster_url=data.get('Poster') if data.get('Poster') != 'N/A' else None,
                ratings=ratings,
                runtime=runtime,
                rating=data.get('Rated') if data.get('Rated') != 'N/A' else None,
                awards=data.get('Awards') if data.get('Awards') != 'N/A' else None,
                box_office=data.get('BoxOffice') if data.get('BoxOffice') != 'N/A' else None,
                country=data.get('Country') if data.get('Country') != 'N/A' else None,
                studio=data.get('Production') if data.get('Production') != 'N/A' else None
            )
            
            # Cache the result
            self._cache[cache_key] = {
                'data': movie_data,
                'cached_at': datetime.utcnow()
            }
            
            return movie_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"OMDB details request failed for IMDB ID {imdb_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting OMDB details for IMDB ID {imdb_id}: {e}")
            return None
    
    async def search_all_sources(self, query: str, year: Optional[int] = None) -> List[ExternalMovieData]:
        """Search all available sources and combine results"""
        try:
            # Search both APIs concurrently
            tmdb_task = self.search_tmdb(query, year)
            omdb_task = self.search_omdb(query, year)
            
            tmdb_results, omdb_results = await asyncio.gather(tmdb_task, omdb_task, return_exceptions=True)
            
            # Handle exceptions
            if isinstance(tmdb_results, Exception):
                logger.error(f"TMDB search failed: {tmdb_results}")
                tmdb_results = []
            
            if isinstance(omdb_results, Exception):
                logger.error(f"OMDB search failed: {omdb_results}")
                omdb_results = []
            
            # Combine and deduplicate results
            all_results = []
            seen_titles = set()
            
            # Add TMDB results first (they tend to be more comprehensive)
            for result in tmdb_results:
                title_key = f"{result.title.lower()}_{result.release_year}"
                if title_key not in seen_titles:
                    all_results.append(result)
                    seen_titles.add(title_key)
            
            # Add OMDB results that aren't duplicates
            for result in omdb_results:
                title_key = f"{result.title.lower()}_{result.release_year}"
                if title_key not in seen_titles:
                    all_results.append(result)
                    seen_titles.add(title_key)
            
            logger.info(f"Combined search found {len(all_results)} unique results for query: {query}")
            return all_results
            
        except Exception as e:
            logger.error(f"Unexpected error in combined search for query '{query}': {e}")
            return []
    
    def clear_cache(self):
        """Clear the API response cache"""
        self._cache.clear()
        logger.info("API cache cleared")

# Singleton instance of the gateway
external_api_gateway = ExternalAPIGateway()

async def fetch_movie_details(title: str, year: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch movie details from all available external APIs.
    This function serves as the primary entry point for other services.
    """
    try:
        results = await external_api_gateway.search_all_sources(title, year)
        if not results:
            return None
        
        # For simplicity, return the first result, assuming it's the best match
        # In a more advanced implementation, you might merge data or rank results
        best_match = results
        
        # Convert ExternalMovieData to a dictionary
        return best_match.dict()
        
    except Exception as e:
        logger.error(f"Failed to fetch movie details for '{title}': {e}", exc_info=True)
        return None