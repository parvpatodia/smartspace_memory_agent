"""
Healthcare-specific extensions for memory system.
Adds medical equipment categories and criticality levels.
"""

from enum import Enum
from pydantic import BaseModel
from typing import Optional

class EquipmentCategory(str, Enum):
    """Categories of medical equipment"""
    CRITICAL = "critical"      # Life-saving (crash cart, defibrillator)
    HIGH_PRIORITY = "high"     # Important (IV pump, monitor)
    STANDARD = "standard"      # Regular (wheelchair, stretcher)
    SUPPLIES = "supplies"      # Consumables (gloves, masks)

class MedicalEquipment(BaseModel):
    """
    Defines a type of medical equipment and its properties.
    
    This helps the system understand:
    - How critical the equipment is
    - Where it should normally be
    - When to alert if missing
    """
    name: str
    category: EquipmentCategory
    typical_locations: list[str]  # Where it should be
    alert_on_movement: bool  # Alert if leaves designated area?
    replacement_cost: Optional[float] = None  # How expensive?
    
    # Examples:
    # MedicalEquipment(
    #     name="crash_cart",
    #     category=EquipmentCategory.CRITICAL,
    #     typical_locations=["ICU Bay 1", "ICU Bay 2"],
    #     alert_on_movement=True,
    #     replacement_cost=25000.00
    # )

# Pre-defined equipment types
MEDICAL_EQUIPMENT_TYPES = {
    "crash_cart": MedicalEquipment(
        name="crash_cart",
        category=EquipmentCategory.CRITICAL,
        typical_locations=["ICU", "Emergency Room"],
        alert_on_movement=True,
        replacement_cost=25000.00
    ),
    "iv_pump": MedicalEquipment(
        name="iv_pump",
        category=EquipmentCategory.HIGH_PRIORITY,
        typical_locations=["ICU", "Patient Rooms"],
        alert_on_movement=False,
        replacement_cost=3000.00
    ),
    "defibrillator": MedicalEquipment(
        name="defibrillator",
        category=EquipmentCategory.CRITICAL,
        typical_locations=["ICU", "Emergency Room", "OR"],
        alert_on_movement=True,
        replacement_cost=15000.00
    ),
    "wheelchair": MedicalEquipment(
        name="wheelchair",
        category=EquipmentCategory.STANDARD,
        typical_locations=["Equipment Storage", "Patient Rooms"],
        alert_on_movement=False,
        replacement_cost=500.00
    ),
    "patient_monitor": MedicalEquipment(
        name="patient_monitor",
        category=EquipmentCategory.HIGH_PRIORITY,
        typical_locations=["ICU", "Patient Rooms"],
        alert_on_movement=False,
        replacement_cost=5000.00
    ),
    "ventilator": MedicalEquipment(
        name="ventilator",
        category=EquipmentCategory.CRITICAL,
        typical_locations=["ICU", "OR"],
        alert_on_movement=True,
        replacement_cost=50000.00
    ),
    "ultrasound_machine": MedicalEquipment(
        name="ultrasound_machine",
        category=EquipmentCategory.HIGH_PRIORITY,
        typical_locations=["Radiology", "Emergency Room"],
        alert_on_movement=False,
        replacement_cost=30000.00
    )
}

def get_equipment_info(equipment_name: str) -> Optional[MedicalEquipment]:
    """
    Get information about a type of equipment.
    
    Args:
        equipment_name: Name of equipment (e.g., "crash_cart")
        
    Returns:
        MedicalEquipment object with properties, or None if not found
        
    Example:
        info = get_equipment_info("crash_cart")
        if info and info.alert_on_movement:
            send_alert("Critical equipment moved!")
    """
    return MEDICAL_EQUIPMENT_TYPES.get(equipment_name.lower().replace(" ", "_"))
