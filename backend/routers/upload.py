from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import uuid
import os
from services.memories_ai_client import MemoriesAPIClient
import httpx

router = APIRouter(prefix="/api", tags=["upload"])

# Initialize services
memories_client = MemoriesAPIClient()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload and process a video file.
    Returns detected equipment, alerts, and saves to history.
    """
    upload_id = str(uuid.uuid4())
    
    try:
        print(f"\n📹 Processing video upload: {upload_id}")
        print(f"   File: {file.filename}")
        
        # Read file
        contents = await file.read()
        file_size_mb = len(contents) / 1024 / 1024
        file_size_bytes = len(contents)
        
        print(f"   Size: {file_size_mb:.2f} MB")
        
        # Analyze video with Memories.ai
        print(f"\n🔌 Using Memories.ai API")
        detections = await memories_client.analyze_video_correct(contents)
        
        print(f"   Equipment identified: {len(detections)} items")
        
        # Count alerts
        alerts_count = sum(1 for d in detections if d.get("alert"))
        
        print(f"   Alerts: {alerts_count} critical")
        
        # ✅ SAVE TO HISTORY
        try:
            async with httpx.AsyncClient() as client:
                history_response = await client.post(
                    "http://localhost:8000/api/history/add",
                    params={
                        "video_id": upload_id,
                        "filename": file.filename,
                        "size": file_size_bytes,
                        "detections": len(detections),
                        "alerts": alerts_count
                    },
                    timeout=10.0
                )
                
                if history_response.status_code == 200:
                    print("✅ Saved to history")
                else:
                    print(f"⚠️ History save returned: {history_response.status_code}")
                    
        except Exception as e:
            print(f"⚠️ Failed to save to history: {str(e)[:100]}")
        
        print(f"✅ Upload processed successfully")
        
        # Return response
        return JSONResponse({
            "success": True,
            "data": {
                "video_id": upload_id,
                "filename": file.filename,
                "size": file_size_mb,
                "detections": detections,
                "alerts": alerts_count,
                "message": f"Detected {len(detections)} equipment items with {alerts_count} critical alerts"
            }
        })
        
    except Exception as e:
        print(f"❌ Error processing upload: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "video_id": upload_id
            }
        )

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "upload"
    }