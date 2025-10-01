import re
import string
from typing import List, Tuple, Dict, Any
from rapidfuzz.distance import Levenshtein as levenshtein_distance
from rapidfuzz import fuzz, process


class FuzzyMatchingEngine:
    """Advanced fuzzy matching engine for movie titles"""
    
    def __init__(self):
        self.min_confidence_threshold = 0.7
        self.exact_match_threshold = 0.95
        self.fuzzy_match_threshold = 0.8
        
    def normalize_title(self, title: str) -> str:
        """Normalize title for matching by removing special characters and converting to lowercase"""
        if not title:
            return ""
        
        # Convert to lowercase
        normalized = title.lower()
        
        # Remove common prefixes/suffixes that might cause issues
        prefixes_to_remove = ["the ", "a ", "an "]
        for prefix in prefixes_to_remove:
            if normalized.startswith(prefix):
                normalized = normalized[len(prefix):]
                break
        
        # Remove punctuation and special characters
        normalized = re.sub(r'[^\w\s]', '', normalized)
        
        # Normalize whitespace
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        # Remove common movie-related suffixes
        suffixes_to_remove = [
            " the movie", " film", " dvd", " blu ray", " bluray", " 4k", " uhd",
            " extended edition", " directors cut", " special edition", " remastered"
        ]
        for suffix in suffixes_to_remove:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)].strip()
        
        return normalized
    
    def extract_year_from_title(self, title: str) -> Tuple[str, int]:
        """Extract year from title if present"""
        # Look for 4-digit year in parentheses or at the end
        year_pattern = r'\b(19|20)\d{2}\b'
        matches = re.findall(year_pattern, title)
        
        if matches:
            year = int(matches[-1])  # Take the last year found
            # Remove year from title
            title_without_year = re.sub(r'\s*\(?' + str(year) + r'\)?\s*', '', title).strip()
            return title_without_year, year
        
        return title, None
    
    def calculate_similarity_score(self, query: str, candidate: str) -> float:
        """Calculate similarity score between two strings using multiple algorithms"""
        if not query or not candidate:
            return 0.0
        
        # Normalize both strings
        norm_query = self.normalize_title(query)
        norm_candidate = self.normalize_title(candidate)
        
        if norm_query == norm_candidate:
            return 1.0
        
        # Use multiple similarity algorithms and take the best score
        scores = []
        
        # 1. Levenshtein distance based score
        max_len = max(len(norm_query), len(norm_candidate))
        if max_len > 0:
            lev_score = 1 - (levenshtein_distance(norm_query, norm_candidate) / max_len)
            scores.append(lev_score)
        
        # 2. RapidFuzz ratio
        ratio_score = fuzz.ratio(norm_query, norm_candidate) / 100.0
        scores.append(ratio_score)
        
        # 3. RapidFuzz partial ratio (for substring matches)
        partial_score = fuzz.partial_ratio(norm_query, norm_candidate) / 100.0
        scores.append(partial_score)
        
        # 4. Token sort ratio (handles word order differences)
        token_sort_score = fuzz.token_sort_ratio(norm_query, norm_candidate) / 100.0
        scores.append(token_sort_score)
        
        # 5. Token set ratio (handles extra words)
        token_set_score = fuzz.token_set_ratio(norm_query, norm_candidate) / 100.0
        scores.append(token_set_score)
        
        # Return the maximum score
        return max(scores)
    
    def find_matches(self, query: str, candidates: List[Dict[str, Any]], 
                    limit: int = 10) -> List[Tuple[Dict[str, Any], float, str]]:
        """Find the best matches for a query from a list of candidates"""
        if not query or not candidates:
            return []
        
        # Extract year from query if present
        query_title, query_year = self.extract_year_from_title(query)
        
        matches = []
        
        for candidate in candidates:
            candidate_title = candidate.get('title', '')
            candidate_year = candidate.get('release_year')
            
            if not candidate_title:
                continue
            
            # Calculate base similarity score
            similarity_score = self.calculate_similarity_score(query_title, candidate_title)
            
            # Boost score if years match (when both are available)
            if query_year and candidate_year and query_year == candidate_year:
                similarity_score = min(1.0, similarity_score + 0.1)
            
            # Penalize if years are very different (when both are available)
            elif query_year and candidate_year and abs(query_year - candidate_year) > 2:
                similarity_score *= 0.9
            
            # Determine match type
            match_type = self._determine_match_type(similarity_score)
            
            # Only include matches above minimum threshold
            if similarity_score >= self.min_confidence_threshold:
                matches.append((candidate, similarity_score, match_type))
        
        # Sort by similarity score (descending) and return top matches
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches[:limit]
    
    def _determine_match_type(self, score: float) -> str:
        """Determine the type of match based on confidence score"""
        if score >= self.exact_match_threshold:
            return "EXACT"
        elif score >= self.fuzzy_match_threshold:
            return "FUZZY"
        else:
            return "PARTIAL"
    
    def find_best_match(self, query: str, candidates: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], float, str]:
        """Find the single best match for a query"""
        matches = self.find_matches(query, candidates, limit=1)
        if matches:
            return matches[0]
        return None, 0.0, "NONE"
    
    def batch_match(self, queries: List[str], candidates: List[Dict[str, Any]]) -> Dict[str, List[Tuple[Dict[str, Any], float, str]]]:
        """Perform batch matching for multiple queries"""
        results = {}
        for query in queries:
            results[query] = self.find_matches(query, candidates)
        return results
    
    def suggest_corrections(self, query: str, candidates: List[Dict[str, Any]], 
                          max_suggestions: int = 5) -> List[str]:
        """Suggest possible corrections for a query that didn't match well"""
        if not query or not candidates:
            return []
        
        # Get candidate titles
        candidate_titles = [c.get('title', '') for c in candidates if c.get('title')]
        
        # Use rapidfuzz to find close matches
        suggestions = process.extract(
            query, 
            candidate_titles, 
            scorer=fuzz.token_sort_ratio,
            limit=max_suggestions
        )
        
        # Return only the titles, not the scores
        return [suggestion[0] for suggestion in suggestions if suggestion[1] > 60]