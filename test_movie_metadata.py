import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_enrich_endpoint():
    """Tests the /movies/enrich endpoint."""
    time.sleep(5)  # Wait for server to start
    params = {"title": "Inception"}
    response = requests.get(f"{BASE_URL}/api/v1/movies/enrich", params=params)
    
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
    except json.JSONDecodeError:
        print(f"Response Text: {response.text}")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "title" in data
        assert "release_year" in data

if __name__ == "__main__":
    test_enrich_endpoint()