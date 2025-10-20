"""
Data models for the memory system.
These define the structure of all memory-related data.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, List
from enum import Enum
import uuid


# ===== ENUMS (Fixed set of values) =====

class MemoryType(str, Enum):
    """Types of memories the system can store"""
    OBJECT_DETECTION = "object_detection"  # Saw an object in a video
    SYSTEM_EVENT = "system_event"          # System action (startup, shutdown)
    USER_ACTION = "user_action"            # User did something (deleted memory)



class ObjectMemory(BaseModel):
    """
    Represents a single observation of an object.
    
    Example:
        "I saw keys on the kitchen counter at 3:15 PM with 92% confidence"
    """
    
    # Unique identifier for this memory
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Example: "a7b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d"
    
    # When was this observed?
    timestamp: datetime = Field(default_factory=datetime.now)
    # Example: 2025-10-20T15:15:00
    
    # What object did we see?
    object_name: str
    # Example: "keys"
    
    # Where was it?
    location_description: str
    # Example: "on the kitchen counter near the coffee maker"
    
    # How confident are we? (0.0 to 1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    # Example: 0.92 (92% confident)
    
    # Optional: Which room?
    room: Optional[str] = None
    # Example: "kitchen"
    
    # Optional: Video this came from
    video_id: Optional[str] = None
    # Example: "video_123"
    
    # Optional: Path to saved frame image
    frame_path: Optional[str] = None
    # Example: "data/frames/frame_abc123.jpg"
    
    class Config:
        """Pydantic configuration"""
        # How to convert datetime to JSON
        json_encoders = {
            datetime: lambda v: v.isoformat()
            # 2025-10-20T15:15:00 → "2025-10-20T15:15:00"
        }
    
    def __str__(self):
        """Human-readable string representation"""
        return f"Memory: {self.object_name} at {self.location_description} ({self.confidence:.0%} confidence)"




class PatternMemory(BaseModel):
    """
    Learned patterns for a specific object.
    
    Example:
        "Keys are usually on the kitchen counter (78% of time),
         sometimes on desk (15%), rarely on couch (7%)"
    """
    
    # Which object is this pattern for?
    object_name: str
    # Example: "keys"
    
    # How many times have we seen this object?
    total_observations: int = 0
    # Example: 42
    
    # Count of each location: {"kitchen counter": 33, "desk": 6, "couch": 3}
    location_frequency: Dict[str, int] = Field(default_factory=dict)
    
    # The most common location
    most_common_location: Optional[str] = None
    # Example: "kitchen counter"
    
    # How consistent is this object's placement? (0.0 to 1.0)
    # 1.0 = always same place, 0.0 = completely random
    consistency_score: float = 0.0
    # Example: 0.78 (78% consistent)
    
    # When was this pattern last updated?
    last_updated: datetime = Field(default_factory=datetime.now)
    
    def get_location_percentage(self, location: str) -> float:
        """
        What percentage of time is the object in this location?
        
        Args:
            location: The location to check
            
        Returns:
            Percentage (0-100)
            
        Example:
            pattern.get_location_percentage("kitchen counter")
            → 78.5  (means 78.5% of observations)
        """
        if self.total_observations == 0:
            return 0.0
        
        count = self.location_frequency.get(location, 0)
        return (count / self.total_observations) * 100
    
    def is_unusual_location(self, location: str, threshold: float = 20.0) -> bool:
        """
        Is this location unusual for this object?
        
        Args:
            location: Location to check
            threshold: Percentage below which is "unusual" (default 20%)
            
        Returns:
            True if unusual, False if normal
            
        Example:
            pattern.is_unusual_location("couch")
            → True (only 7% of time, below 20% threshold)
        """
        percentage = self.get_location_percentage(location)
        return percentage < threshold
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }



class SystemMemory(BaseModel):
    """
    Records system events and user actions.
    
    Examples:
        - "System started"
        - "User deleted memory abc123"
        - "Memory backup created"
    """
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    memory_type: MemoryType
    description: str
    metadata: Dict = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }



class MemoryQuery(BaseModel):
    """
    Parameters for searching memories.
    
    Example:
        "Find all memories of 'keys' in the last 24 hours"
    """
    
    object_name: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=50, le=1000)  # Max 1000 results

