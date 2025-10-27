"""
Test Memories.ai client connection.
Run: python test_memories_client.py
"""

import asyncio
from dotenv import load_dotenv
from services.memories_ai_client import MemoriesAPIClient

# Load environment variables from .env file
load_dotenv()

async def main():
    print("=" * 60)
    print("TESTING MEMORIES.AI CLIENT")
    print("=" * 60)
    
    try:
        # Initialize client
        client = MemoriesAPIClient()
        
        # Test connection
        print("\n1. Testing API connection...")
        connected = await client.test_connection()
        
        if connected:
            print(" Client initialized and connected successfully!")
        else:
            print(" Connection failed - check your API key")
            return
        
        print("\n" + "=" * 60)
        print("CLIENT TEST COMPLETE!")
        print("=" * 60)
        
    except ValueError as e:
        print(f"\n Configuration error: {e}")
        print("\nMake sure to:")
        print("1. Create backend/.env file")
        print("2. Add: MEMORIES_AI_API_KEY=your_key_here")
    
    except Exception as e:
        print(f"\n Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
