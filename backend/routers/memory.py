"""
Memory API endpoints.
Allows frontend to interact with the memory system.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional, List
import json
from pathlib import Path

# Create router
router = APIRouter(
    prefix="/api/memory",
    tags=["memory"]
)

# Path to history file
HISTORY_FILE = Path("data/upload_history.json")

def load_history():
    """Load upload history from JSON file."""
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return []
    return []

# ===== STATISTICS ENDPOINT =====

@router.get("/stats")
async def get_memory_stats():
    """
    Get overall memory and detection statistics.
    
    Returns:
        - Total number of uploads
        - Total detections
        - Total alerts
        - Average detections per video
        - Critical sessions count
        
    Example:
        GET /api/memory/stats
        
        Response:
        {
            "success": true,
            "data": {
                "total_uploads": 5,
                "total_detections": 12,
                "total_alerts": 3,
                "average_detections_per_video": 2.4,
                "critical_sessions": 2,
                "timestamp": "2025-10-27T12:42:00"
            }
        }
    """
    try:
        history = load_history()
        
        if not history:
            return {
                "success": True,
                "data": {
                    "total_uploads": 0,
                    "total_detections": 0,
                    "total_alerts": 0,
                    "average_detections_per_video": 0,
                    "critical_sessions": 0,
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        total_detections = sum(h.get("detections", 0) for h in history)
        total_alerts = sum(h.get("alerts", 0) for h in history)
        critical_sessions = sum(1 for h in history if h.get("alerts", 0) > 0)
        
        stats = {
            "success": True,
            "data": {
                "total_uploads": len(history),
                "total_detections": total_detections,
                "total_alerts": total_alerts,
                "average_detections_per_video": round(total_detections / len(history), 2) if history else 0,
                "critical_sessions": critical_sessions,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        return stats
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {}
        }

# ===== HEALTH CHECK =====

@router.get("/health")
async def memory_health_check():
    """
    Check if memory system is healthy.
    
    Returns:
        Health status and basic stats
        
    Example:
        GET /api/memory/health
        
        Response:
        {
            "status": "healthy",
            "system_initialized": true,
            "total_uploads": 5,
            "timestamp": "2025-10-27T12:42:00"
        }
    """
    try:
        history = load_history()
        
        return {
            "status": "healthy",
            "system_initialized": True,
            "total_uploads": len(history),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ===== ADDITIONAL UTILITY ENDPOINTS =====

@router.get("/upload-summary")
async def get_upload_summary():
    """
    Get summary of all uploads with equipment distribution.
    
    Returns:
        List of recent uploads and equipment breakdown
        
    Example:
        GET /api/memory/upload-summary
        
        Response:
        {
            "success": true,
            "recent_uploads": [...],
            "equipment_distribution": {...}
        }
    """
    try:
        history = load_history()
        
        # Get equipment distribution
        equipment_dist = {}
        for upload in history:
            detections = upload.get("detections", 0)
            if detections > 0:
                # Group by detection count ranges
                key = f"{detections} items"
                equipment_dist[key] = equipment_dist.get(key, 0) + 1
        
        return {
            "success": True,
            "total_uploads": len(history),
            "recent_uploads": history[:10],  # Last 10
            "equipment_distribution": equipment_dist,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }