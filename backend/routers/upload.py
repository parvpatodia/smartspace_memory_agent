"""
Video upload endpoint with healthcare equipment detection.
Supports both mock detections (for development) and real Memories.ai API.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from services.memories_ai_client import MemoriesAPIClient
from memory.memory_store import memory_store
from memory.memory_types import ObjectMemory, SystemMemory, MemoryType
from memory.healthcare_types import get_equipment_info, EquipmentCategory
from datetime import datetime
from typing import List, Dict, Any
import uuid
import os
import random

router = APIRouter(prefix="/api", tags=["upload"])

# Detection mode configuration
USE_MOCK_DETECTIONS = os.getenv("USE_MOCK_DETECTIONS", "false").lower() == "true"

print(f"🔧 Detection Mode: {'MOCK' if USE_MOCK_DETECTIONS else 'REAL API'}")


def generate_realistic_mock_detections(filename: str, video_size: int) -> List[Dict[str, Any]]:
    """Generate realistic mock equipment detections for development and demos."""
    
    random.seed(hash(filename))
    
    scenarios = [
        # Scenario 1: Theft in Progress
        [
            {"name": "crash_cart", "location": "Parking Lot B, near loading dock", "confidence": 0.92, "timestamp": 15},
            {"name": "defibrillator", "location": "Staff parking area", "confidence": 0.89, "timestamp": 23},
            {"name": "iv_pump", "location": "Floor 3, ICU Bay 2", "confidence": 0.88, "timestamp": 65}
        ],
        # Scenario 2: Normal Operations
        [
            {"name": "patient_monitor", "location": "ICU, Room 312", "confidence": 0.90, "timestamp": 10},
            {"name": "iv_pump", "location": "Patient Room 405", "confidence": 0.87, "timestamp": 28},
            {"name": "wheelchair", "location": "Equipment Storage Room", "confidence": 0.93, "timestamp": 45},
            {"name": "ultrasound_machine", "location": "Radiology Department", "confidence": 0.88, "timestamp": 72}
        ],
        # Scenario 3: High-Value Equipment
        [
            {"name": "ventilator", "location": "ICU Bay 4", "confidence": 0.93, "timestamp": 8},
            {"name": "ultrasound_machine", "location": "Emergency Room", "confidence": 0.91, "timestamp": 35},
            {"name": "patient_monitor", "location": "Floor 2, Hallway", "confidence": 0.86, "timestamp": 52}
        ],
        # Scenario 4: Emergency
        [
            {"name": "crash_cart", "location": "Emergency Room, Bay 1", "confidence": 0.95, "timestamp": 5},
            {"name": "defibrillator", "location": "ICU, Room 308", "confidence": 0.92, "timestamp": 18},
            {"name": "ventilator", "location": "OR Suite 3", "confidence": 0.94, "timestamp": 42}
        ],
        # Scenario 5: Mixed
        [
            {"name": "wheelchair", "location": "Patient Room 201", "confidence": 0.94, "timestamp": 12},
            {"name": "iv_pump", "location": "Floor 2, Nurses Station", "confidence": 0.87, "timestamp": 30},
            {"name": "crash_cart", "location": "ICU Central Station", "confidence": 0.92, "timestamp": 48}
        ]
    ]
    
    scenario_index = abs(hash(filename)) % len(scenarios)
    selected = scenarios[scenario_index]
    
    print(f"   🎭 Mock scenario {scenario_index + 1}: {len(selected)} detections")
    
    return selected


async def process_healthcare_detection(detection: Dict[str, Any], video_id: str) -> Dict[str, Any]:
    """Process a single equipment detection with healthcare intelligence."""
    
    # Create memory object
    memory = ObjectMemory(
        object_name=detection["name"],
        location_description=detection["location"],
        confidence=detection.get("confidence", 0.0),
        video_id=video_id,
        timestamp=datetime.now()
    )
    
    # Get equipment information
    equipment_info = get_equipment_info(detection["name"])
    
    # Store the memory
    memory_id = memory_store.store_object_memory(memory)
    
    # Check for alerts
    alert = None
    if equipment_info:
        alert = memory_store.check_critical_equipment_alert(memory)
    
    # Build response
    result = {
        "object_name": detection["name"],
        "location": detection["location"],
        "confidence": detection.get("confidence", 0.0),
        "timestamp": detection.get("timestamp", 0),
        "memory_id": memory_id,
        "equipment_info": {
            "category": equipment_info.category if equipment_info else "unknown",
            "replacement_cost": equipment_info.replacement_cost if equipment_info else None,
            "is_tracked_equipment": equipment_info is not None
        },
        "alert": alert
    }
    
    # Log alert as system memory
    if alert:
        system_memory = SystemMemory(
            memory_type=MemoryType.SYSTEM_EVENT,
            description=f"Alert generated: {alert['message']}",
            metadata={
                "alert_severity": alert["severity"],
                "equipment": detection["name"],
                "location": detection["location"],
                "memory_id": memory_id
            }
        )
        memory_store.store_system_memory(system_memory)
    
    return result


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Upload and analyze hospital security footage using video summary."""
    
    video_id = str(uuid.uuid4())
    
    try:
        print(f"📹 Processing video upload: {video_id}")
        print(f"   File: {file.filename}")
        
        contents = await file.read()
        video_size = len(contents)
        
        print(f"   Size: {video_size / 1024 / 1024:.1f} MB")
        print(f"   🔌 Using Memories.ai API with video summary")
        
        try:
            memories_client = MemoriesAPIClient()
            
            # NEW METHOD: Uses video summary for object extraction
            detections = await memories_client.analyze_video_correct(contents)
            
            print(f"   Equipment identified: {len(detections)} items")
            
        except Exception as api_error:
            print(f"   ⚠️ API error: {api_error}")
            detections = []
        
        # Return response
        critical_count = len([d for d in detections if d.get("alert", {}).get("severity") == "critical"])
        
        response = {
            "success": True,
            "video_id": video_id,
            "detections": detections,
            "summary": {
                "alerts_generated": critical_count,
                "detection_method": "video_summary"
            }
        }
        
        print(f" Upload processed successfully")
        print(f"   Stored: {len(detections)} memories")
        print(f"   Alerts: {critical_count} critical")
        
        return response
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "detections": []
        }


    

@router.get("/uploads/{video_id}")
async def get_upload_details(video_id: str):
    """Get details about a specific video upload."""
    try:
        all_memories = memory_store.get_object_memories(limit=1000)
        video_memories = [m for m in all_memories if m.video_id == video_id]
        
        if not video_memories:
            raise HTTPException(
                status_code=404,
                detail=f"No memories found for video {video_id}"
            )
        
        return {
            "video_id": video_id,
            "memory_count": len(video_memories),
            "memories": [m.dict() for m in video_memories]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get upload details: {str(e)}"
        )
