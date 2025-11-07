from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Import routers
from routers import upload, history, memory, tracking, alerts

# Import tracking service
from services.tracking_service import TrackingService

app = FastAPI(title="MediTrack API", version="1.0.0")

# Global tracking service instance
tracking_service = None

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
app.include_router(tracking.router)
app.include_router(alerts.router)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    global tracking_service
    
    print("\n" + "="*50)
    print("MediTrack API starting")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Debug: {os.getenv('DEBUG', 'false')}")
    print(f"Data directory: {os.path.abspath('./data')}")
    print("="*50 + "\n")
    
    # Initialize tracking service with topology
    try:
        tracking_service = TrackingService()
        tracking_service.load_topology()
        print("Tracking service initialized")
        print(f"  Nodes: {len(tracking_service.nodes)}")
        print(f"  Edges: {len(tracking_service.edges)}\n")
    except Exception as e:
        print(f"Warning: Tracking service initialization failed - {e}")
        print("Tracking features will not be available\n")


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
            "memory": "/api/memory",
            "tracking": "/api/track/associate",
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
    
    print("Starting MediTrack Backend Server")
    print("Server: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["routers", "services"]
    )
