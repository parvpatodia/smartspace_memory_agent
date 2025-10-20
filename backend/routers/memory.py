"""
Memory API endpoints.
Allows frontend to interact with the memory system.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional, List

# Import our memory system
from memory.memory_store import memory_store
from memory.memory_types import ObjectMemory, SystemMemory, MemoryType

# Create router
router = APIRouter(
    prefix="/api/memory",  # All routes start with /api/memory
    tags=["memory"]         # Groups endpoints in API docs
)


# ===== STATISTICS ENDPOINT =====

@router.get("/stats")
async def get_memory_stats():
    """
    Get overall memory statistics.
    
    Returns:
        - Total number of memories
        - Number of tracked objects
        - List of object names
        - Date range of memories
        
    Example:
        GET /api/memory/stats
        
        Response:
        {
            "total_object_memories": 42,
            "tracked_objects": 3,
            "object_names": ["keys", "wallet", "phone"],
            "oldest_memory": "2025-10-15T10:00:00",
            "newest_memory": "2025-10-20T16:00:00"
        }
    """
    try:
        stats = memory_store.get_memory_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get memory stats: {str(e)}"
        )


# ===== RETRIEVE MEMORIES ENDPOINTS =====

@router.get("/objects")
async def get_all_tracked_objects():
    """
    Get list of all objects being tracked.
    
    Returns:
        List of object names with their memory counts
        
    Example:
        GET /api/memory/objects
        
        Response:
        {
            "objects": [
                {"name": "keys", "memory_count": 15},
                {"name": "wallet", "memory_count": 8},
                {"name": "phone", "memory_count": 19}
            ]
        }
    """
    try:
        stats = memory_store.get_memory_stats()
        object_names = stats.get("object_names", [])
        
        # Get count for each object
        objects = []
        for obj_name in object_names:
            memories = memory_store.get_object_memories(
                object_name=obj_name,
                limit=1000  # Get all to count
            )
            objects.append({
                "name": obj_name,
                "memory_count": len(memories)
            })
        
        return {"objects": objects}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get tracked objects: {str(e)}"
        )


@router.get("/objects/{object_name}")
async def get_object_memories(
    object_name: str,
    hours: int = Query(
        default=168,  # Default: 1 week
        description="Hours to look back (default: 168 = 1 week)"
    ),
    limit: int = Query(
        default=50,
        le=500,
        description="Maximum number of memories to return"
    )
):
    """
    Get memories for a specific object.
    
    Args:
        object_name: Which object to get memories for
        hours: How many hours back to look (default: 168 = 1 week)
        limit: Maximum results to return (max: 500)
        
    Returns:
        List of memories with details
        
    Example:
        GET /api/memory/objects/keys?hours=24&limit=10
        
        Response:
        {
            "object_name": "keys",
            "time_period_hours": 24,
            "total_memories": 5,
            "memories": [
                {
                    "id": "abc-123",
                    "timestamp": "2025-10-20T15:30:00",
                    "location_description": "on kitchen counter",
                    "confidence": 0.92,
                    "room": "kitchen"
                },
                ...
            ]
        }
    """
    try:
        # Get memories within time window
        since = datetime.now() - timedelta(hours=hours)
        
        all_memories = memory_store.get_object_memories(
            object_name=object_name,
            limit=limit
        )
        
        # Filter by time
        memories = [
            m for m in all_memories
            if m.timestamp >= since
        ]
        
        # Convert to dictionaries for JSON response
        memories_dict = [m.dict() for m in memories]
        
        return {
            "object_name": object_name,
            "time_period_hours": hours,
            "total_memories": len(memories),
            "memories": memories_dict
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get memories for {object_name}: {str(e)}"
        )


@router.get("/recent/{object_name}")
async def get_recent_memories(
    object_name: str,
    hours: int = Query(default=24, description="Hours to look back")
):
    """
    Get recent memories for an object.
    Convenience endpoint for last N hours.
    
    Args:
        object_name: Which object
        hours: How many hours back (default: 24)
        
    Example:
        GET /api/memory/recent/keys?hours=12
        
        Response:
        {
            "object_name": "keys",
            "hours": 12,
            "memories": [...]
        }
    """
    try:
        memories = memory_store.get_recent_memories(
            object_name=object_name,
            hours=hours
        )
        
        return {
            "object_name": object_name,
            "hours": hours,
            "count": len(memories),
            "memories": [m.dict() for m in memories]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recent memories: {str(e)}"
        )


# ===== PATTERN ENDPOINTS =====

@router.get("/patterns/{object_name}")
async def get_object_pattern(object_name: str):
    """
    Get learned pattern for a specific object.
    
    Args:
        object_name: Which object's pattern to get
        
    Returns:
        Pattern details with statistics
        
    Example:
        GET /api/memory/patterns/keys
        
        Response:
        {
            "object_name": "keys",
            "pattern": {
                "total_observations": 20,
                "most_common_location": "kitchen counter",
                "consistency_score": 0.75,
                "location_frequency": {
                    "kitchen counter": 15,
                    "desk": 3,
                    "couch": 2
                }
            }
        }
    """
    try:
        pattern = memory_store.get_object_pattern(object_name)
        
        if not pattern:
            raise HTTPException(
                status_code=404,
                detail=f"No pattern found for '{object_name}'. Object may not be tracked yet."
            )
        
        return {
            "object_name": object_name,
            "pattern": pattern.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get pattern: {str(e)}"
        )


@router.get("/patterns")
async def get_all_patterns():
    """
    Get learned patterns for all tracked objects.
    
    Returns:
        Dictionary of object_name → pattern
        
    Example:
        GET /api/memory/patterns
        
        Response:
        {
            "patterns": {
                "keys": {
                    "total_observations": 20,
                    "most_common_location": "kitchen counter",
                    ...
                },
                "wallet": {
                    "total_observations": 12,
                    "most_common_location": "dresser",
                    ...
                }
            }
        }
    """
    try:
        all_patterns = memory_store.get_all_patterns()
        
        # Convert to dict format
        patterns_dict = {
            name: pattern.dict()
            for name, pattern in all_patterns.items()
        }
        
        return {
            "patterns": patterns_dict,
            "total_patterns": len(patterns_dict)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get patterns: {str(e)}"
        )


# ===== DELETE ENDPOINTS =====

@router.delete("/objects/{object_name}/memories/{memory_id}")
async def delete_memory(object_name: str, memory_id: str):
    """
    Delete a specific memory.
    
    Args:
        object_name: Which object (for clarity in API)
        memory_id: ID of memory to delete
        
    Returns:
        Success confirmation
        
    Example:
        DELETE /api/memory/objects/keys/memories/abc-123
        
        Response:
        {
            "success": true,
            "message": "Memory deleted successfully",
            "memory_id": "abc-123"
        }
    """
    try:
        success = memory_store.delete_object_memory(memory_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Memory with ID '{memory_id}' not found"
            )
        
        # Log this action as system memory
        system_memory = SystemMemory(
            memory_type=MemoryType.USER_ACTION,
            description=f"User deleted memory for {object_name}",
            metadata={
                "memory_id": memory_id,
                "object_name": object_name
            }
        )
        memory_store.store_system_memory(system_memory)
        
        return {
            "success": True,
            "message": "Memory deleted successfully",
            "memory_id": memory_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete memory: {str(e)}"
        )


@router.post("/reset")
async def reset_all_memories():
    """
    
    This will delete all stored memories and patterns.
    Use with caution! Mainly for testing/demo purposes.
    
    Returns:
        Confirmation of reset
        
    Example:
        POST /api/memory/reset
        
        Response:
        {
            "success": true,
            "message": "All memories have been reset"
        }
    """
    try:
        # Log before resetting
        system_memory = SystemMemory(
            memory_type=MemoryType.SYSTEM_EVENT,
            description="User reset all memories"
        )
        memory_store.store_system_memory(system_memory)
        
        # Reset
        memory_store.reset_all_memories()
        
        return {
            "success": True,
            "message": "All memories have been reset",
            "warning": "This action cannot be undone"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset memories: {str(e)}"
        )


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
            "memory_store_initialized": true,
            "total_memories": 42
        }
    """
    try:
        stats = memory_store.get_memory_stats()
        
        return {
            "status": "healthy",
            "memory_store_initialized": True,
            "total_memories": stats.get("total_object_memories", 0),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
