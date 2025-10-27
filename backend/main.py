from routers import upload
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
from datetime import datetime

# Import the memory router
from routers import memory

load_dotenv()

app = FastAPI(
    title="SmartSpace Memory Agent",
    description="AI-powered memory system for object tracking",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the memory router
app.include_router(memory.router)
app.include_router(upload.router)  # ← Add this line!

@app.get("/")
async def root():
    return {
        "message": "SmartSpace Memory Agent API is running!",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "memory": "/api/memory" ,
            "upload": "/api/upload" # ← Added
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_dir": os.getenv("DATA_DIR"),
        "debug": os.getenv("DEBUG") == "true"
    }

@app.on_event("startup")
async def startup_event():
    print("SmartSpace Memory Agent starting...")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Debug mode: {os.getenv('DEBUG')}")
    print(f"Data directory: {os.getenv('DATA_DIR')}")

@app.on_event("shutdown")
async def shutdown_event():
    print("SmartSpace Memory Agent shutting down...")


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug
    )
