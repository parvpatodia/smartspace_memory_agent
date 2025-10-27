"""
Memories.ai OAuth 2.0 Authentication Handler
Implements the proper authentication flow as per Memories.ai docs
"""

import os
import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Optional

class MemoriesAuthHandler:
    """
    Handles Memories.ai OAuth authentication flow.
    
    Flow:
    1. Authorize API key and set callback URL
    2. Receive authorization code via callback
    3. Exchange code for access token
    4. Use access token in API requests
    5. Refresh token when needed
    """
    
    def __init__(self):
        self.api_key = os.getenv("MEMORIES_AI_API_KEY")
        self.client_id = os.getenv("MEMORIES_AI_CLIENT_ID")  # From dashboard
        self.callback_url = os.getenv("MEMORIES_CALLBACK_URL", "http://localhost:8000/api/memories/callback")
        
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        
        self.auth_base_url = "https://api.memories.ai/auth"
        
        print(f"🔐 Memories.ai Auth Handler initialized")
        print(f"   Client ID: {self.client_id[:8]}..." if self.client_id else "   Client ID: Not set")
    
    async def authorize_api_key(self):
        """
        Step 1: Authorize API key and set callback URL
        This needs to be done once through their dashboard
        """
        print("⚠️ API Key authorization must be done manually:")
        print("   1. Go to https://memories.ai/developer")
        print("   2. Find your API key")
        print("   3. Click 'Authorize'")
        print(f"   4. Set callback URL to: {self.callback_url}")
        print("   5. Save and wait for authorization code")
    
    async def exchange_code_for_token(self, code: str) -> bool:
        """
        Step 2: Exchange authorization code for access token
        
        Args:
            code: Authorization code received via callback
            
        Returns:
            True if token obtained successfully
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.auth_base_url}/getAccessToken"
                
                payload = {
                    "code": code,
                    "clientId": self.client_id
                }
                
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        self.access_token = result.get("accessToken")
                        self.refresh_token = result.get("refreshToken")
                        expires_in = result.get("expiresIn", 3600)  # seconds
                        
                        self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                        
                        print(f"✅ Access token obtained")
                        print(f"   Expires at: {self.token_expires_at}")
                        
                        return True
                    else:
                        print(f"❌ Failed to get access token: {response.status}")
                        return False
                        
        except Exception as e:
            print(f"❌ Error exchanging code for token: {e}")
            return False
    
    async def refresh_access_token(self) -> bool:
        """
        Step 3: Refresh access token when expired
        
        Returns:
            True if token refreshed successfully
        """
        if not self.refresh_token:
            print("❌ No refresh token available")
            return False
        
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.auth_base_url}/refreshAccessToken"
                
                payload = {
                    "refreshToken": self.refresh_token,
                    "clientId": self.client_id
                }
                
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        self.access_token = result.get("accessToken")
                        expires_in = result.get("expiresIn", 3600)
                        
                        self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                        
                        print(f"✅ Access token refreshed")
                        return True
                    else:
                        print(f"❌ Failed to refresh token: {response.status}")
                        return False
                        
        except Exception as e:
            print(f"❌ Error refreshing token: {e}")
            return False
    
    async def get_valid_token(self) -> Optional[str]:
        """
        Get a valid access token, refreshing if necessary
        
        Returns:
            Valid access token or None
        """
        # Check if we have a token
        if not self.access_token:
            print("⚠️ No access token available")
            print("   Complete authorization flow first")
            return None
        
        # Check if token is expired
        if self.token_expires_at and datetime.now() >= self.token_expires_at:
            print("🔄 Token expired, refreshing...")
            if await self.refresh_access_token():
                return self.access_token
            else:
                return None
        
        return self.access_token
    
    def is_authenticated(self) -> bool:
        """Check if we have valid authentication"""
        return (
            self.access_token is not None and
            self.token_expires_at is not None and
            datetime.now() < self.token_expires_at
        )
