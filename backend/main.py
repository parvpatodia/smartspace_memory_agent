from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
import json
from datetime import datetime
from pathlib import Path
load_dotenv()
# Import routers
from routers import upload, history, memory

app = FastAPI(title="MediTrack API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(history.router)
app.include_router(memory.router)

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    print("\n" + "="*50)
    print("SmartSpace Memory Agent starting...")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Debug mode: {os.getenv('DEBUG', 'false')}")
    print(f"Data directory: {os.path.abspath('./data')}")
    print("="*50 + "\n")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "MediTrack API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "upload": "/api/upload",
            "history": "/api/history",
            "health": "/api/health"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "MediTrack",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    
    print("\n🚀 Starting MediTrack Backend Server...")
    print("📍 Server: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔌 WebSocket: ws://localhost:8000/ws\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["routers", "services"]
    )
    