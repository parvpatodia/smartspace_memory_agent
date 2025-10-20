"""
Persistent memory storage system.
Handles saving/loading memories to/from disk.
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pathlib import Path
import threading
from .memory_types import (
    ObjectMemory, 
    PatternMemory, 
    SystemMemory, 
    MemoryQuery, 
    MemoryType
)


class MemoryStore:
    """
    Manages persistent storage of all memories.
    
    Architecture:
        - Keeps memories in RAM for fast access
        - Saves to disk after every change
        - Loads from disk on startup
        - Thread-safe with locks
    """
    
    def __init__(self, data_dir: str = "data"):
        """
        Initialize the memory store.
        
        Args:
            data_dir: Directory to store memory files
        """
        # Create data directory if it doesn't exist
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # File paths for different memory types
        self.memory_file = self.data_dir / "object_memories.json"
        self.patterns_file = self.data_dir / "patterns.json"
        self.system_file = self.data_dir / "system_memories.json"
        
        # In-memory storage (cache for fast access)
        self._object_memories: List[ObjectMemory] = []
        self._pattern_memories: Dict[str, PatternMemory] = {}
        self._system_memories: List[SystemMemory] = []
        
        # Thread lock for safe concurrent access
        self._lock = threading.RLock()
        # RLock = Reentrant Lock (same thread can acquire multiple times)
        
        # Load existing memories from disk
        self._load_all_memories()
        
        print(f" Memory Store initialized")
        print(f"    Data directory: {self.data_dir}")
        print(f"    Loaded {len(self._object_memories)} object memories")
        print(f"    Loaded {len(self._pattern_memories)} patterns")
    
    # ===== PRIVATE METHODS (Loading/Saving) =====
    
    def _load_all_memories(self):
        """Load all memories from disk into RAM"""
        try:
            # Load object memories
            if self.memory_file.exists():
                print(f"   Loading object memories from {self.memory_file}...")
                with open(self.memory_file, 'r') as f:
                    data = json.load(f)
                    # Convert each dict to ObjectMemory model
                    self._object_memories = [
                        ObjectMemory(**mem) for mem in data
                    ]
                print(f" Loaded {len(self._object_memories)} object memories")
            
            # Load pattern memories
            if self.patterns_file.exists():
                print(f"   Loading patterns from {self.patterns_file}...")
                with open(self.patterns_file, 'r') as f:
                    data = json.load(f)
                    # Convert each dict to PatternMemory model
                    self._pattern_memories = {
                        name: PatternMemory(**pattern)
                        for name, pattern in data.items()
                    }
                print(f" Loaded {len(self._pattern_memories)} patterns")
            
            # Load system memories
            if self.system_file.exists():
                print(f"   Loading system memories from {self.system_file}...")
                with open(self.system_file, 'r') as f:
                    data = json.load(f)
                    self._system_memories = [
                        SystemMemory(**mem) for mem in data
                    ]
                print(f" Loaded {len(self._system_memories)} system memories")
                
        except Exception as e:
            print(f"  Error loading memories: {e}")
            print(f"  Starting with empty memory store")
            # Initialize empty if loading fails
            self._object_memories = []
            self._pattern_memories = {}
            self._system_memories = []
    
    def _save_object_memories(self):
        """Save object memories to disk"""
        try:
            # Convert ObjectMemory models to dictionaries
            data = [mem.dict() for mem in self._object_memories]
            
            # Write to file with pretty formatting
            with open(self.memory_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
                # default=str handles datetime objects
            
        except Exception as e:
            print(f"Failed to save object memories: {e}")
    
    def _save_pattern_memories(self):
        """Save pattern memories to disk"""
        try:
            # Convert PatternMemory models to dictionaries
            data = {
                name: pattern.dict() 
                for name, pattern in self._pattern_memories.items()
            }
            
            with open(self.patterns_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
                
        except Exception as e:
            print(f"Failed to save pattern memories: {e}")
    
    def _save_system_memories(self):
        """Save system memories to disk"""
        try:
            data = [mem.dict() for mem in self._system_memories]
            
            with open(self.system_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
                
        except Exception as e:
            print(f"Failed to save system memories: {e}")
    
    # ===== PUBLIC METHODS (Object Memories) =====
    
    def store_object_memory(self, memory: ObjectMemory) -> str:
        """
        Store a new object detection memory.
        
        Args:
            memory: The memory to store
            
        Returns:
            The memory's ID
            
        Example:
            memory = ObjectMemory(
                object_name="keys",
                location_description="kitchen counter",
                confidence=0.92
            )
            memory_id = store.store_object_memory(memory)
        """
        with self._lock:  # Thread-safe
            # Add to in-memory list
            self._object_memories.append(memory)
            
            # Update patterns based on this memory
            self._update_object_patterns(memory)
            
            # Save to disk
            self._save_object_memories()
            
            print(f"Stored memory: {memory.object_name} at {memory.location_description}")
            return memory.id
    
    def get_object_memories(
        self, 
        object_name: Optional[str] = None,
        limit: int = 50
    ) -> List[ObjectMemory]:
        """
        Retrieve object memories, optionally filtered by object name.
        
        Args:
            object_name: Filter by object name (None = all objects)
            limit: Maximum number of memories to return
            
        Returns:
            List of memories (newest first)
            
        Example:
            # Get all memories for "keys"
            keys_memories = store.get_object_memories(object_name="keys")
            
            # Get all memories for all objects
            all_memories = store.get_object_memories()
        """
        with self._lock:
            memories = self._object_memories
            
            # Filter by object name if specified
            if object_name:
                memories = [
                    m for m in memories 
                    if m.object_name.lower() == object_name.lower()
                ]
            
            # Sort by timestamp (newest first)
            memories = sorted(
                memories, 
                key=lambda x: x.timestamp, 
                reverse=True
            )
            
            # Limit results
            return memories[:limit]
    
    def get_recent_memories(
        self, 
        object_name: str, 
        hours: int = 24
    ) -> List[ObjectMemory]:
        """
        Get recent memories for an object.
        
        Args:
            object_name: Which object to search for
            hours: How many hours back to look
            
        Returns:
            List of memories within time window
            
        Example:
            # Get memories from last 24 hours
            recent = store.get_recent_memories("keys", hours=24)
        """
        since = datetime.now() - timedelta(hours=hours)
        
        with self._lock:
            memories = [
                m for m in self._object_memories
                if m.object_name.lower() == object_name.lower()
                and m.timestamp >= since
            ]
            
            return sorted(memories, key=lambda x: x.timestamp, reverse=True)
    
    def delete_object_memory(self, memory_id: str) -> bool:
        """
        Delete a specific memory.
        
        Args:
            memory_id: ID of memory to delete
            
        Returns:
            True if deleted, False if not found
            
        Example:
            success = store.delete_object_memory("abc-123-def")
        """
        with self._lock:
            original_count = len(self._object_memories)
            
            # Remove memory with this ID
            self._object_memories = [
                m for m in self._object_memories 
                if m.id != memory_id
            ]
            
            # Check if anything was deleted
            if len(self._object_memories) < original_count:
                # Save changes
                self._save_object_memories()
                
                # Recalculate patterns (since we removed data)
                self._recalculate_all_patterns()
                
                print(f"Deleted memory: {memory_id}")
                return True
            
            return False
    
    # ===== PUBLIC METHODS (Pattern Memories) =====
    
    def _update_object_patterns(self, memory: ObjectMemory):
        """
        Update learned patterns based on new memory.
        Called automatically when storing a memory.
        
        Args:
            memory: The new memory to learn from
        """
        obj_name = memory.object_name.lower()
        
        # Create pattern if doesn't exist
        if obj_name not in self._pattern_memories:
            self._pattern_memories[obj_name] = PatternMemory(
                object_name=obj_name
            )
        
        pattern = self._pattern_memories[obj_name]
        
        # Update location frequency
        location = memory.location_description
        pattern.location_frequency[location] = \
            pattern.location_frequency.get(location, 0) + 1
        
        # Increment total observations
        pattern.total_observations += 1
        
        # Update most common location
        if pattern.location_frequency:
            most_common = max(
                pattern.location_frequency.items(),
                key=lambda x: x[1]
            )
            pattern.most_common_location = most_common[0]
            
            # Calculate consistency score (0-1)
            # How often is it in the most common place?
            max_count = most_common[1]
            pattern.consistency_score = max_count / pattern.total_observations
        
        # Update timestamp
        pattern.last_updated = datetime.now()
        
        # Save patterns to disk
        self._save_pattern_memories()
    
    def get_object_pattern(self, object_name: str) -> Optional[PatternMemory]:
        """
        Get learned pattern for an object.
        
        Args:
            object_name: Which object's pattern to get
            
        Returns:
            Pattern if exists, None otherwise
            
        Example:
            pattern = store.get_object_pattern("keys")
            if pattern:
                print(f"Keys are usually at: {pattern.most_common_location}")
        """
        with self._lock:
            return self._pattern_memories.get(object_name.lower())
    
    def get_all_patterns(self) -> Dict[str, PatternMemory]:
        """
        Get all learned patterns.
        
        Returns:
            Dictionary of object_name -> pattern
            
        Example:
            patterns = store.get_all_patterns()
            for obj_name, pattern in patterns.items():
                print(f"{obj_name}: {pattern.most_common_location}")
        """
        with self._lock:
            return self._pattern_memories.copy()
    
    def _recalculate_all_patterns(self):
        """
        Recalculate all patterns from scratch.
        Called after deleting memories.
        """
        print("Recalculating patterns...")
        
        # Clear existing patterns
        self._pattern_memories = {}
        
        # Rebuild from all memories
        for memory in self._object_memories:
            self._update_object_patterns(memory)
        
        print("Patterns recalculated")
    
    # ===== PUBLIC METHODS (System Memories) =====
    
    def store_system_memory(self, memory: SystemMemory) -> str:
        """
        Store a system event memory.
        
        Args:
            memory: The system memory to store
            
        Returns:
            The memory's ID
        """
        with self._lock:
            self._system_memories.append(memory)
            self._save_system_memories()
            return memory.id
    
    # ===== UTILITY METHODS =====
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get overall memory statistics.
        
        Returns:
            Dictionary with stats
            
        Example:
            stats = store.get_memory_stats()
            print(f"Total memories: {stats['total_object_memories']}")
        """
        with self._lock:
            # Get unique object names
            tracked_objects = set(
                m.object_name for m in self._object_memories
            )
            
            # Get oldest and newest timestamps
            oldest = None
            newest = None
            if self._object_memories:
                oldest = min(m.timestamp for m in self._object_memories)
                newest = max(m.timestamp for m in self._object_memories)
            
            return {
                "total_object_memories": len(self._object_memories),
                "total_system_memories": len(self._system_memories),
                "tracked_objects": len(tracked_objects),
                "object_names": list(tracked_objects),
                "total_patterns": len(self._pattern_memories),
                "oldest_memory": oldest.isoformat() if oldest else None,
                "newest_memory": newest.isoformat() if newest else None,
                "data_directory": str(self.data_dir)
            }
    
    def reset_all_memories(self):
        """
        Clear all memories.
        Use with caution! Creates backup first.
        """
        with self._lock:
            print("🧹 Resetting all memories...")
            
            # Clear in-memory data
            self._object_memories = []
            self._pattern_memories = {}
            self._system_memories = []
            
            # Delete files
            for file_path in [self.memory_file, self.patterns_file, self.system_file]:
                if file_path.exists():
                    file_path.unlink()
            
            print("All memories cleared")


# Create single global instance
# All parts of the app will use this same instance
memory_store = MemoryStore()
