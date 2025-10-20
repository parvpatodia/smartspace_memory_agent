"""
Test API endpoints with real data.
Run server first: python main.py
Then run: python test_api_endpoints.py
"""

import requests
import time

BASE_URL = "http://localhost:8000/api/memory"

print("=" * 60)
print("TESTING MEMORY API ENDPOINTS")
print("=" * 60)

# Test 1: Health check
print("\n1. Testing health check...")
response = requests.get(f"{BASE_URL}/health")
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}")

# Test 2: Get stats
print("\n2. Getting memory stats...")
response = requests.get(f"{BASE_URL}/stats")
stats = response.json()
print(f"   Total memories: {stats['total_object_memories']}")
print(f"   Tracked objects: {stats['tracked_objects']}")
print(f"   Object names: {stats['object_names']}")

# Test 3: Get tracked objects
print("\n3. Getting tracked objects...")
response = requests.get(f"{BASE_URL}/objects")
objects = response.json()
print(f"   Objects: {objects}")

# Test 4: Get memories for specific object
if stats['object_names']:
    obj_name = stats['object_names'][0]
    print(f"\n4. Getting memories for '{obj_name}'...")
    response = requests.get(f"{BASE_URL}/objects/{obj_name}?limit=3")
    memories = response.json()
    print(f"   Found {memories['total_memories']} memories")
    if memories['memories']:
        first_mem = memories['memories'][0]
        print(f"   Latest: {first_mem['location_description']}")

# Test 5: Get pattern
if stats['object_names']:
    obj_name = stats['object_names'][0]
    print(f"\n5. Getting pattern for '{obj_name}'...")
    response = requests.get(f"{BASE_URL}/patterns/{obj_name}")
    if response.status_code == 200:
        pattern_data = response.json()
        pattern = pattern_data['pattern']
        print(f"   Total observations: {pattern['total_observations']}")
        print(f"   Most common location: {pattern['most_common_location']}")
        print(f"   Consistency: {pattern['consistency_score']:.2f}")
    else:
        print(f"   No pattern yet (need more observations)")

# Test 6: Get all patterns
print("\n6. Getting all patterns...")
response = requests.get(f"{BASE_URL}/patterns")
all_patterns = response.json()
print(f"   Total patterns: {all_patterns['total_patterns']}")

print("\n" + "=" * 60)
print("ALL API TESTS COMPLETED!")
print("=" * 60)
print("\nNext: Visit http://localhost:8000/docs")
print("to see interactive API documentation!")
