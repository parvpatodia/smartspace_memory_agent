from fastapi import APIRouter, HTTPException
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

# Store acknowledged/dismissed alerts (in production, use database)
processed_alerts = set()

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Mark alert as acknowledged"""
    try:
        processed_alerts.add(alert_id)
        print(f"✓ Alert acknowledged: {alert_id}")
        return {
            "success": True,
            "message": f"Alert {alert_id} acknowledged",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    """Mark alert as dismissed"""
    try:
        processed_alerts.add(alert_id)
        print(f"✓ Alert dismissed: {alert_id}")
        return {
            "success": True,
            "message": f"Alert {alert_id} dismissed",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
