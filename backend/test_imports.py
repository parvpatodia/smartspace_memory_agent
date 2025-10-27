"""
Quick test to verify all imports work correctly.
Run: python test_imports.py
"""

print("Testing imports...")

try:
    print("1. Testing memory types...", end=" ")
    from memory.memory_types import ObjectMemory, PatternMemory, SystemMemory
    print("✅")
    
    print("2. Testing healthcare types...", end=" ")
    from memory.healthcare_types import get_equipment_info, MEDICAL_EQUIPMENT_TYPES
    print("✅")
    
    print("3. Testing memory store...", end=" ")
    from memory.memory_store import memory_store
    print("✅")
    
    print("4. Testing Memories.ai client...", end=" ")
    from services.memories_ai_client import MemoriesAPIClient
    print("✅")
    
    print("\n All imports successful!")
    print("\nYour project structure is correct!")
    
except ImportError as e:
    print(f"\n Import failed: {e}")
    print("\nCheck that all files exist in the correct locations.")
