"""
Test search with proper filtering to target video.
"""

import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("MEMORIES_AI_API_KEY")

async def test_search_filtering():
    """Test search and filter by specific video"""
    
    # Use one of your existing video IDs from the logs
    target_video = "VI637499704942931968"  # From your first upload
    
    print("="*60)
    print("TESTING SEARCH WITH FILTERING")
    print("="*60)
    print(f"Target Video: {target_video}")
    print()
    
    url = "https://api.memories.ai/serve/api/v1/search"
    headers = {"Authorization": API_KEY}
    
    # CORRECT payload format from docs
    payload = {
        "search_param": "show me all objects and equipment",
        "folder_id": -2,
        "search_type": "BY_CLIP"
    }
    
    print(f"📤 Sending request...")
    print(f"   URL: {url}")
    print(f"   Payload: {payload}")
    print()
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            result = await response.json()
            
            print(f"📥 Response:")
            print(f"   Code: {result.get('code')}")
            print(f"   Success: {result.get('success')}")
            print(f"   Message: {result.get('msg', 'N/A')}")  # ← Added this!
            print()
            
            # Check for error
            if result.get('code') != '0000':
                print(f"❌ API ERROR!")
                print(f"   Error message: {result.get('msg')}")
                print(f"   Full response: {result}")
                print()
                print("Possible causes:")
                print("1. Search parameter format issue")
                print("2. Folder ID issue (-2 for API folder)")
                print("3. Search type issue (BY_CLIP vs BY_VIDEO)")
                print("4. API endpoint changed")
                return
            
            data = result.get("data", [])
            
            if not isinstance(data, list):
                data = data.get("clips", []) if isinstance(data, dict) else []
            
            print(f"📊 Total clips returned: {len(data)}")
            print()
            
            if len(data) == 0:
                print("⚠️ Search succeeded but returned 0 clips")
                print("This means:")
                print("1. No videos have been processed yet")
                print("2. OR videos processed but no semantic content found")
                print("3. OR query doesn't match any video content")
                return
            
            # Group by video
            videos_found = {}
            for clip in data:
                video_no = clip.get("videoNo", "unknown")
                if video_no not in videos_found:
                    videos_found[video_no] = []
                videos_found[video_no].append(clip)
            
            print(f"📹 Unique videos in results: {len(videos_found)}")
            for video_no, clips in videos_found.items():
                marker = "← TARGET" if video_no == target_video else ""
                print(f"   {video_no}: {len(clips)} clips {marker}")
            print()
            
            # Filter to target video
            target_clips = [c for c in data if c.get("videoNo") == target_video]
            
            print(f"🎯 Clips from target video: {len(target_clips)}")
            
            if target_clips:
                print("\n📝 Sample clips from target video:")
                for i, clip in enumerate(target_clips[:3], 1):
                    print(f"\n   Clip {i}:")
                    print(f"      Time: {clip.get('startTime')}s - {clip.get('endTime')}s")
                    print(f"      Score: {clip.get('score', 0):.4f}")
                    print(f"      Video: {clip.get('videoNo')}")
            else:
                print("\n⚠️ No clips found for target video")
                print("\nBut other videos have clips!")
                print("Your target video might still be processing")

if __name__ == "__main__":
    asyncio.run(test_search_filtering())
