"""
Debug script to test Memories.ai API permissions.
Tests different endpoints to identify what's working.
"""

import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("MEMORIES_AI_API_KEY")
BASE_URL = "https://api.memories.ai"

async def test_endpoint(session, name, url, method="GET", data=None, headers=None):
    """Test a single API endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"Method: {method}")
    
    default_headers = {"Authorization": f"Bearer {API_KEY}"}
    if headers:
        default_headers.update(headers)
    
    try:
        if method == "GET":
            async with session.get(url, headers=default_headers) as response:
                status = response.status
                text = await response.text()
                print(f"Status: {status}")
                print(f"Response: {text[:200]}")
                return status, text
        elif method == "POST":
            async with session.post(url, headers=default_headers, json=data) as response:
                status = response.status
                text = await response.text()
                print(f"Status: {status}")
                print(f"Response: {text[:200]}")
                return status, text
    except Exception as e:
        print(f"Error: {e}")
        return None, str(e)

async def main():
    print("="*60)
    print("MEMORIES.AI API DEBUG TEST")
    print("="*60)
    print(f"API Key: ...{API_KEY[-8:]}")
    print()
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Health/Status endpoint (if exists)
        await test_endpoint(
            session,
            "Health Check",
            f"{BASE_URL}/health",
            "GET"
        )
        
        # Test 2: API version endpoint
        await test_endpoint(
            session,
            "API Version",
            f"{BASE_URL}/version",
            "GET"
        )
        
        # Test 3: User/Account info
        await test_endpoint(
            session,
            "Account Info",
            f"{BASE_URL}/serve/api/user/info",
            "GET"
        )
        
        # Test 4: List videos (should work if authenticated)
        await test_endpoint(
            session,
            "List Videos",
            f"{BASE_URL}/serve/api/video/list",
            "GET"
        )
        
        # Test 5: Search endpoint (simple test)
        await test_endpoint(
            session,
            "Search Test",
            f"{BASE_URL}/serve/api/video/search",
            "POST",
            data={"query": "test", "limit": 1}
        )
        
        # Test 6: Upload endpoint (the one failing)
        await test_endpoint(
            session,
            "Upload Endpoint",
            f"{BASE_URL}/serve/api/video/upload_url",
            "POST"
        )
        
        print(f"\n{'='*60}")
        print("DEBUG TEST COMPLETE")
        print("="*60)
        print("\nAnalysis:")
        print("- If all return 401: API key is invalid")
        print("- If some work, some fail: Permission issue with specific endpoints")
        print("- If all return 9009: Need to 'Accredit' key in dashboard")
        print("- If all return 0402: Need to add credits/points")

if __name__ == "__main__":
    asyncio.run(main())
