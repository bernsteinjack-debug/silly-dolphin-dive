#!/usr/bin/env python3
"""
Test script to validate Heat movie metadata enrichment
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.metadata_enrichment import get_movie_metadata, enrich_movie_data

def test_heat_metadata():
    """Test Heat movie metadata lookup and enrichment"""
    print("=== TESTING HEAT MOVIE METADATA ===\n")
    
    # Test different variations of "Heat" title
    test_titles = [
        "Heat",
        "HEAT", 
        "heat",
        "Heat (1995)",
        "HEAT 1995"
    ]
    
    for title in test_titles:
        print(f"Testing title: '{title}'")
        metadata = get_movie_metadata(title)
        
        if metadata:
            print(f"✅ Found metadata:")
            print(f"   Title: {metadata['title']}")
            print(f"   Year: {metadata['release_year']}")
            print(f"   Genre: {metadata['genre']}")
            print(f"   Director: {metadata['director']}")
            print(f"   Format: {metadata['format']}")
        else:
            print(f"❌ No metadata found")
        print()
    
    # Test enrichment function
    print("=== TESTING ENRICHMENT FUNCTION ===\n")
    
    test_movie_data = {
        "title": "Heat",
        "format": None  # Should be enriched
    }
    
    print(f"Input data: {test_movie_data}")
    enriched = enrich_movie_data(test_movie_data)
    print(f"Enriched data:")
    print(f"   Title: {enriched.get('title')}")
    print(f"   Year: {enriched.get('release_year')}")
    print(f"   Genre: {enriched.get('genre')}")
    print(f"   Director: {enriched.get('director')}")
    print(f"   Format: {enriched.get('format')}")
    print(f"   IMDB Rating: {enriched.get('imdb_rating')}")
    
    # Verify the fix
    if enriched.get('release_year') == 1995 and enriched.get('genre') == 'Crime':
        print("\n🎉 SUCCESS: Heat metadata is now working correctly!")
        return True
    else:
        print("\n❌ FAILURE: Heat metadata is still not working")
        return False

if __name__ == "__main__":
    success = test_heat_metadata()
    sys.exit(0 if success else 1)