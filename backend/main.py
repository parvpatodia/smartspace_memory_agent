from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="SmartSpace Memory Agent",
    description="AI-powered memory system for object tracking",
    version="1.0.0"
)

# CORS - allows frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint - test if server is running
@app.get("/")
async def root():
    """Root endpoint - returns basic API info"""
    return {
        "message": "SmartSpace Memory Agent API is running!",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": "/api"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check if API is healthy"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_dir": os.getenv("DATA_DIR"),
        "debug": os.getenv("DEBUG") == "true"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Run when API starts"""
    print("=" * 60)
    print("🚀 SmartSpace Memory Agent starting...")
    print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔧 Debug mode: {os.getenv('DEBUG')}")
    print(f"💾 Data directory: {os.getenv('DATA_DIR')}")
    print("=" * 60)

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run when API shuts down"""
    print("\n" + "=" * 60)
    print("👋 SmartSpace Memory Agent shutting down...")
    print("=" * 60)

# Run the server
if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug  # Auto-reload on code changes in debug mode
    )
