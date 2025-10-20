"""
Test file to understand how memory models work.
Run: python test_models.py
"""

from memory.memory_types import ObjectMemory, PatternMemory
from datetime import datetime

print("=" * 60)
print("TESTING MEMORY MODELS")
print("=" * 60)

# ===== Test 1: Create an ObjectMemory =====
print("\n1. Creating an ObjectMemory:")

memory1 = ObjectMemory(
    object_name="keys",
    location_description="on the kitchen counter",
    confidence=0.92,
    room="kitchen"
)

print(f"   Memory ID: {memory1.id}")
print(f"   Object: {memory1.object_name}")
print(f"   Location: {memory1.location_description}")
print(f"   Confidence: {memory1.confidence}")
print(f"   Timestamp: {memory1.timestamp}")
print(f"   String representation: {memory1}")

# ===== Test 2: Convert to dictionary/JSON =====
print("\n2. Converting to dictionary:")

memory_dict = memory1.dict()
print(f"   Type: {type(memory_dict)}")
print(f"   Contents: {memory_dict}")

memory_json = memory1.json()
print(f"\n   JSON string: {memory_json}")

# ===== Test 3: Create from dictionary =====
print("\n3. Creating from dictionary:")

memory2 = ObjectMemory(**memory_dict)
print(f"   Recreated memory: {memory2}")

# ===== Test 4: Validation (this will fail) =====
print("\n4. Testing validation:")

try:
    bad_memory = ObjectMemory(
        object_name="wallet",
        location_description="on desk",
        confidence=1.5  # Invalid! Must be 0.0-1.0
    )
except Exception as e:
    print(f"  Validation caught error: {e}")

# ===== Test 5: Pattern Memory =====
print("\n5. Testing PatternMemory:")

pattern = PatternMemory(
    object_name="keys",
    total_observations=20,
    location_frequency={
        "kitchen counter": 15,
        "desk": 3,
        "couch": 2
    },
    most_common_location="kitchen counter",
    consistency_score=0.75
)

print(f"   Object: {pattern.object_name}")
print(f"   Total observations: {pattern.total_observations}")
print(f"   Consistency: {pattern.consistency_score}")

# Test helper methods
kitchen_pct = pattern.get_location_percentage("kitchen counter")
desk_pct = pattern.get_location_percentage("desk")
couch_pct = pattern.get_location_percentage("couch")

print(f"\n   Location percentages:")
print(f"   - Kitchen counter: {kitchen_pct:.1f}%")
print(f"   - Desk: {desk_pct:.1f}%")
print(f"   - Couch: {couch_pct:.1f}%")

# Test unusual detection
is_couch_unusual = pattern.is_unusual_location("couch", threshold=20.0)
print(f"\n   Is couch unusual? {is_couch_unusual}")
print(f"   (Threshold: 20%, Couch: {couch_pct:.1f}%)")

print("ALL TESTS PASSED! ")

