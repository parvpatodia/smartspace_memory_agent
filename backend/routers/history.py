from fastapi import APIRouter, HTTPException
from datetime import datetime
import json
from pathlib import Path

router = APIRouter(prefix="/api", tags=["history"])

HISTORY_FILE = Path("data/upload_history.json")
HISTORY_FILE.parent.mkdir(exist_ok=True)

def load_history():
    """Load upload history from JSON file."""
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading history: {e}")
            return []
    return []

def save_history(history):
    """Save upload history to JSON file."""
    try:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")

@router.get("/history")
async def get_history():
    """
    Get all upload history records.
    Returns records sorted by most recent first.
    """
    try:
        history = load_history()
        return {
            "success": True,
            "data": history,
            "total": len(history)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@router.post("/history/add")
async def add_history_record(
    video_id: str,
    filename: str,
    size: int,
    detections: int,
    alerts: int
):
    """
    Add a new video upload to history.
    Called after video is processed successfully.
    """
    try:
        history = load_history()
        
        new_record = {
            "id": video_id,
            "video_id": video_id,
            "filename": filename,
            "size": size,
            "detections": detections,
            "alerts": alerts,
            "timestamp": datetime.now().isoformat(),
            "status": "completed"
        }
        
        # Add to front (most recent first)
        history.insert(0, new_record)
        
        # Keep last 100 records
        history = history[:100]
        
        save_history(history)
        
        print(f"✅ Added to history: {filename}")
        
        return {
            "success": True,
            "message": "Successfully added to history",
            "record": new_record
        }
    except Exception as e:
        print(f"❌ Error adding to history: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@router.delete("/history/{video_id}")
async def delete_history_record(video_id: str):
    """Delete a specific record from history."""
    try:
        history = load_history()
        history = [h for h in history if h.get("video_id") != video_id]
        save_history(history)
        
        return {
            "success": True,
            "message": "Record deleted"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.delete("/history")
async def clear_history():
    """Clear all history records."""
    try:
        save_history([])
        return {
            "success": True,
            "message": "History cleared"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }