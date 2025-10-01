import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from bson import ObjectId

from ..core.database import db
from ..models.movie_metadata import (
    MovieMetadata, MovieMetadataCreate, MatchCandidate, 
    MatchCache, MovieMatchRequest, MovieMatchResponse,
    ExternalMovieData
)
from .fuzzy_matching import FuzzyMatchingEngine
from .external_api_gateway import ExternalAPIGateway


logger = logging.getLogger(__name__)


class MovieMatchingService:
    """Main service for movie title matching"""
    
    def __init__(self):
        self.fuzzy_engine = FuzzyMatchingEngine()
        self.api_gateway = ExternalAPIGateway()
        self.cache_ttl_hours = 24
        
    async def match_movie_title(self, request: MovieMatchRequest) -> MovieMatchResponse:
        """Main method to match a movie title"""
        start_time = time.time()
        
        try:
            # Check cache first
            cached_result = await self._get_cached_match(request.title)
            if cached_result:
                query_time = (time.time() - start_time) * 1000
                return MovieMatchResponse(
                    data=cached_result.matches,
                    cached=True,
                    query_time_ms=query_time
                )
            
            # Search local database first
            local_matches = await self._search_local_database(request.title, request.year)
            
            # If we have good local matches, return them
            if local_matches and local_matches[0].confidence_score >= 0.9:
                await self._cache_match_result(request.title, local_matches)
                query_time = (time.time() - start_time) * 1000
                return MovieMatchResponse(
                    data=local_matches,
                    cached=False,
                    query_time_ms=query_time
                )
            
            # Search external APIs
            external_matches = await self._search_external_apis(request.title, request.year)
            
            # Combine local and external matches
            all_matches = self._combine_matches(local_matches, external_matches)
            
            # Store new movies in database
            await self._store_new_movies(external_matches)
            
            # Cache the result
            await self._cache_match_result(request.title, all_matches)
            
            query_time = (time.time() - start_time) * 1000
            return MovieMatchResponse(
                data=all_matches,
                cached=False,
                query_time_ms=query_time
            )
            
        except Exception as e:
            logger.error(f"Error matching movie title '{request.title}': {e}")
            query_time = (time.time() - start_time) * 1000
            return MovieMatchResponse(
                data=[],
                cached=False,
                query_time_ms=query_time
            )
    
    async def _get_cached_match(self, query: str) -> Optional[MatchCache]:
        """Get cached match result if available and not expired"""
        try:
            normalized_query = self.fuzzy_engine.normalize_title(query)
            
            cache_doc = await db.database.match_cache.find_one({
                "normalized_query": normalized_query,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if cache_doc:
                logger.info(f"Found cached result for query: {query}")
                return MatchCache(**cache_doc)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting cached match for '{query}': {e}")
            return None
    
    async def _search_local_database(self, query: str, year: Optional[int] = None) -> List[MatchCandidate]:
        """Search local movie database"""
        try:
            # Get all movies from local database
            movies_cursor = db.database.movie_metadata.find({})
            movies = await movies_cursor.to_list(length=None)
            
            if not movies:
                return []
            
            # Convert to format expected by fuzzy engine
            candidates = []
            for movie in movies:
                candidates.append({
                    'title': movie.get('title', ''),
                    'release_year': movie.get('release_year'),
                    'normalized_title': movie.get('normalized_title', ''),
                    '_id': movie.get('_id'),
                    'tmdb_id': movie.get('tmdb_id'),
                    'imdb_id': movie.get('imdb_id'),
                    'genres': movie.get('genres', []),
                    'director': movie.get('director'),
                    'cast': movie.get('cast', []),
                    'plot': movie.get('plot'),
                    'poster_url': movie.get('poster_url'),
                    'ratings': movie.get('ratings', {}),
                    'runtime': movie.get('runtime'),
                    'rating': movie.get('rating'),
                    'studio': movie.get('studio'),
                    'format': movie.get('format'),
                    'language': movie.get('language'),
                    'awards': movie.get('awards'),
                    'box_office': movie.get('box_office'),
                    'country': movie.get('country')
                })
            
            # Use fuzzy matching to find best matches
            matches = self.fuzzy_engine.find_matches(query, candidates, limit=10)
            
            # Convert to MatchCandidate objects
            match_candidates = []
            for candidate, score, match_type in matches:
                movie_metadata = MovieMetadata(
                    id=str(candidate['_id']),
                    tmdb_id=candidate.get('tmdb_id'),
                    imdb_id=candidate.get('imdb_id'),
                    title=candidate['title'],
                    normalized_title=candidate.get('normalized_title', ''),
                    release_year=candidate.get('release_year'),
                    genres=candidate.get('genres', []),
                    director=candidate.get('director'),
                    cast=candidate.get('cast', []),
                    plot=candidate.get('plot'),
                    poster_url=candidate.get('poster_url'),
                    ratings=candidate.get('ratings', {}),
                    runtime=candidate.get('runtime'),
                    rating=candidate.get('rating'),
                    studio=candidate.get('studio'),
                    format=candidate.get('format'),
                    language=candidate.get('language'),
                    awards=candidate.get('awards'),
                    box_office=candidate.get('box_office'),
                    country=candidate.get('country')
                )
                
                match_candidates.append(MatchCandidate(
                    movie=movie_metadata,
                    confidence_score=score,
                    match_type=match_type
                ))
            
            logger.info(f"Found {len(match_candidates)} local matches for query: {query}")
            return match_candidates
            
        except Exception as e:
            logger.error(f"Error searching local database for '{query}': {e}")
            return []
    
    async def _search_external_apis(self, query: str, year: Optional[int] = None) -> List[MatchCandidate]:
        """Search external APIs for movie matches"""
        try:
            # Search all external sources
            external_movies = await self.api_gateway.search_all_sources(query, year)
            
            if not external_movies:
                return []
            
            # Convert external data to candidates for fuzzy matching
            candidates = []
            for movie in external_movies:
                candidates.append({
                    'title': movie.title,
                    'release_year': movie.release_year,
                    'tmdb_id': movie.tmdb_id,
                    'imdb_id': movie.imdb_id,
                    'genres': movie.genres,
                    'director': movie.director,
                    'cast': movie.cast,
                    'plot': movie.plot,
                    'poster_url': movie.poster_url,
                    'ratings': movie.ratings,
                    'runtime': movie.runtime,
                    'rating': movie.rating,
                    'studio': movie.studio,
                    'awards': movie.awards,
                    'box_office': movie.box_office,
                    'country': movie.country,
                    'source': movie.source
                })
            
            # Use fuzzy matching to score the external results
            matches = self.fuzzy_engine.find_matches(query, candidates, limit=10)
            
            # Convert to MatchCandidate objects
            match_candidates = []
            for candidate, score, match_type in matches:
                movie_metadata = MovieMetadata(
                    tmdb_id=candidate.get('tmdb_id'),
                    imdb_id=candidate.get('imdb_id'),
                    title=candidate['title'],
                    normalized_title=self.fuzzy_engine.normalize_title(candidate['title']),
                    release_year=candidate.get('release_year'),
                    genres=candidate.get('genres', []),
                    director=candidate.get('director'),
                    cast=candidate.get('cast', []),
                    plot=candidate.get('plot'),
                    poster_url=candidate.get('poster_url'),
                    ratings=candidate.get('ratings', {}),
                    runtime=candidate.get('runtime'),
                    rating=candidate.get('rating'),
                    studio=candidate.get('studio'),
                    format="Blu-ray",  # Default format
                    language="English",  # Default language
                    awards=candidate.get('awards'),
                    box_office=candidate.get('box_office'),
                    country=candidate.get('country')
                )
                
                match_candidates.append(MatchCandidate(
                    movie=movie_metadata,
                    confidence_score=score,
                    match_type=match_type
                ))
            
            logger.info(f"Found {len(match_candidates)} external matches for query: {query}")
            return match_candidates
            
        except Exception as e:
            logger.error(f"Error searching external APIs for '{query}': {e}")
            return []
    
    def _combine_matches(self, local_matches: List[MatchCandidate], 
                        external_matches: List[MatchCandidate]) -> List[MatchCandidate]:
        """Combine and deduplicate local and external matches"""
        try:
            all_matches = []
            seen_titles = set()
            
            # Add local matches first (they have IDs and are already in our database)
            for match in local_matches:
                title_key = f"{match.movie.title.lower()}_{match.movie.release_year}"
                if title_key not in seen_titles:
                    all_matches.append(match)
                    seen_titles.add(title_key)
            
            # Add external matches that aren't duplicates
            for match in external_matches:
                title_key = f"{match.movie.title.lower()}_{match.movie.release_year}"
                if title_key not in seen_titles:
                    all_matches.append(match)
                    seen_titles.add(title_key)
            
            # Sort by confidence score
            all_matches.sort(key=lambda x: x.confidence_score, reverse=True)
            
            # Return top 10 matches
            return all_matches[:10]
            
        except Exception as e:
            logger.error(f"Error combining matches: {e}")
            return local_matches + external_matches
    
    async def _store_new_movies(self, external_matches: List[MatchCandidate]):
        """Store new movies from external APIs in local database"""
        try:
            for match in external_matches:
                movie = match.movie
                
                # Check if movie already exists (by TMDB ID or IMDB ID)
                existing_query = {}
                if movie.tmdb_id:
                    existing_query["tmdb_id"] = movie.tmdb_id
                elif movie.imdb_id:
                    existing_query["imdb_id"] = movie.imdb_id
                else:
                    # Check by normalized title and year
                    existing_query = {
                        "normalized_title": movie.normalized_title,
                        "release_year": movie.release_year
                    }
                
                existing_movie = await db.database.movie_metadata.find_one(existing_query)
                
                if not existing_movie:
                    # Create new movie document
                    movie_doc = {
                        "tmdb_id": movie.tmdb_id,
                        "imdb_id": movie.imdb_id,
                        "title": movie.title,
                        "normalized_title": movie.normalized_title,
                        "release_year": movie.release_year,
                        "genres": movie.genres,
                        "director": movie.director,
                        "cast": movie.cast,
                        "plot": movie.plot,
                        "poster_url": movie.poster_url,
                        "ratings": movie.ratings,
                        "runtime": movie.runtime,
                        "rating": movie.rating,
                        "studio": movie.studio,
                        "format": movie.format,
                        "language": movie.language,
                        "awards": movie.awards,
                        "box_office": movie.box_office,
                        "country": movie.country,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    
                    result = await db.database.movie_metadata.insert_one(movie_doc)
                    movie.id = str(result.inserted_id)
                    logger.info(f"Stored new movie: {movie.title}")
                else:
                    movie.id = str(existing_movie["_id"])
                    
        except Exception as e:
            logger.error(f"Error storing new movies: {e}")
    
    async def _cache_match_result(self, query: str, matches: List[MatchCandidate]):
        """Cache match result for future queries"""
        try:
            normalized_query = self.fuzzy_engine.normalize_title(query)
            expires_at = datetime.utcnow() + timedelta(hours=self.cache_ttl_hours)
            
            cache_doc = {
                "query": query,
                "normalized_query": normalized_query,
                "matches": [match.dict() for match in matches],
                "expires_at": expires_at,
                "created_at": datetime.utcnow()
            }
            
            # Upsert cache entry
            await db.database.match_cache.update_one(
                {"normalized_query": normalized_query},
                {"$set": cache_doc},
                upsert=True
            )
            
            logger.info(f"Cached match result for query: {query}")
            
        except Exception as e:
            logger.error(f"Error caching match result for '{query}': {e}")
    
    async def clear_expired_cache(self):
        """Clear expired cache entries"""
        try:
            result = await db.database.match_cache.delete_many({
                "expires_at": {"$lt": datetime.utcnow()}
            })
            
            logger.info(f"Cleared {result.deleted_count} expired cache entries")
            
        except Exception as e:
            logger.error(f"Error clearing expired cache: {e}")
    
    async def get_movie_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """Get movie title suggestions for autocomplete"""
        try:
            # Get movies from local database
            movies_cursor = db.database.movie_metadata.find(
                {"title": {"$regex": query, "$options": "i"}},
                {"title": 1}
            ).limit(limit)
            
            movies = await movies_cursor.to_list(length=None)
            suggestions = [movie["title"] for movie in movies]
            
            # If we don't have enough suggestions, use fuzzy matching
            if len(suggestions) < limit:
                all_movies_cursor = db.database.movie_metadata.find({}, {"title": 1})
                all_movies = await all_movies_cursor.to_list(length=None)
                
                candidates = [{"title": movie["title"]} for movie in all_movies]
                fuzzy_suggestions = self.fuzzy_engine.suggest_corrections(query, candidates, limit)
                
                # Add fuzzy suggestions that aren't already in the list
                for suggestion in fuzzy_suggestions:
                    if suggestion not in suggestions and len(suggestions) < limit:
                        suggestions.append(suggestion)
            
            return suggestions[:limit]
            
        except Exception as e:
            logger.error(f"Error getting movie suggestions for '{query}': {e}")
            return []