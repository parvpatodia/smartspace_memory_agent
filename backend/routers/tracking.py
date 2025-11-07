"""
Tracking API endpoints.
Provides equipment identity resolution and track management.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel
import json
from pathlib import Path

from services.tracking_service import TrackingService


router = APIRouter(
    prefix="/api/track",
    tags=["tracking"]
)

# Initialize tracking service
tracking_service = None


def get_tracking_service():
    """Get or initialize tracking service."""
    global tracking_service
    if tracking_service is None:
        tracking_service = TrackingService()
        tracking_service.load_topology()
    return tracking_service


# ===== REQUEST/RESPONSE MODELS =====


class AssociateRequest(BaseModel):
    """Request to associate detections into tracks."""
    detections: List[Dict]
    surge: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "detections": [
                    {
                        "det_id": 1,
                        "ts": "2025-11-04T12:05:00Z",
                        "class": "patient_monitor",
                        "node_id": 1,
                        "score": 0.92
                    }
                ],
                "surge": False
            }
        }


class TrackResponse(BaseModel):
    """Response containing tracks with confidence scores."""
    success: bool
    tracks: List[Dict]
    stats: Dict
    timestamp: str


# ===== ENDPOINTS =====


@router.post("/associate", response_model=TrackResponse)
async def associate_detections(request: AssociateRequest):
    """
    Associate equipment detections into identity chains.
    """
    try:
        service = get_tracking_service()
        
        print(f"\n--- ASSOCIATE REQUEST ---")
        print(f"Total detections: {len(request.detections)}")
        print(f"Surge mode: {request.surge}")
        
        # Convert timestamp strings to datetime
        for det in request.detections:
            try:
                if isinstance(det['ts'], str):
                    print(f"Converting timestamp: {det['ts']}")
                    det['ts'] = datetime.fromisoformat(det['ts'].replace('Z', '+00:00'))
                print(f"Detection {det['det_id']}: node={det['node_id']}, class={det['class']}, ts={det['ts']}")
            except Exception as e:
                print(f"ERROR parsing detection {det.get('det_id')}: {e}")
                raise
        
        print(f"Starting association...")
        # Associate detections
        tracks = service.associate_detections(request.detections)
        
        print(f"Tracks formed: {len(tracks)}")
        for track in tracks:
            print(f"  Track {track['track_id']}: {len(track['links'])} links, confidence={track['confidence']}")
        
        # Save tracks
        service.save_tracks(tracks)
        
        # Compute statistics
        stats = {
            "total_detections": len(request.detections),
            "tracks_formed": len(tracks),
            "high_confidence": len([t for t in tracks if t['confidence'] > 0.85]),
            "medium_confidence": len([t for t in tracks if 0.5 < t['confidence'] <= 0.85]),
            "needs_review": len([t for t in tracks if t['status'] == 'needs_review']),
            "avg_confidence": round(sum(t['confidence'] for t in tracks) / len(tracks), 3) if tracks else 0
        }
        
        return TrackResponse(
            success=True,
            tracks=tracks,
            stats=stats,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        print(f"\n!!! ASSOCIATION ERROR !!!")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        import traceback
        print(traceback.format_exc())
        print(f"!!! END ERROR !!!\n")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/tracks")
async def get_all_tracks():
    """
    Get all stored tracks.
    
    Returns:
        List of all equipment tracks with full details
    """
    try:
        service = get_tracking_service()
        tracks = service.load_tracks()
        
        return {
            "success": True,
            "total_tracks": len(tracks),
            "tracks": tracks,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tracks/{track_id}")
async def get_track(track_id: str):
    """
    Get details for a specific track.
    
    Parameters:
        track_id: The track ID (UUID)
    
    Returns:
        Full track details including all links and reasoning
    """
    try:
        service = get_tracking_service()
        tracks = service.load_tracks()
        
        track = next((t for t in tracks if t['track_id'] == track_id), None)
        
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        return {
            "success": True,
            "track": track,
            "timestamp": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topology")
async def get_topology():
    """
    Get current topology configuration.
    
    Returns:
        Nodes, edges, and distances for visualization/debugging
    """
    try:
        service = get_tracking_service()
        
        # Build readable node/edge data
        nodes_data = [
            {
                "id": n['id'],
                "name": n['name'],
                "type": n['type']
            }
            for n in service.nodes
        ]
        
        edges_data = [
            {
                "from_id": e['from'],
                "from_name": service.get_node_name(e['from']),
                "to_id": e['to'],
                "to_name": service.get_node_name(e['to']),
                "distance_m": e['distance_m']
            }
            for e in service.edges
        ]
        
        return {
            "success": True,
            "nodes": nodes_data,
            "edges": edges_data,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reconcile/{track_id}")
async def reconcile_track(track_id: str, action: str = Query(...)):
    """
    Manual reconciliation of a track.
    
    Parameters:
        track_id: The track ID
        action: 'confirm' (mark as correct), 'flag' (needs review), 'delete'
    
    Returns:
        Updated track status
    """
    try:
        if action not in ['confirm', 'flag', 'delete']:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        service = get_tracking_service()
        tracks = service.load_tracks()
        
        track = next((t for t in tracks if t['track_id'] == track_id), None)
        
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        if action == 'confirm':
            track['status'] = 'confirmed'
        elif action == 'flag':
            track['status'] = 'needs_review'
        elif action == 'delete':
            tracks = [t for t in tracks if t['track_id'] != track_id]
        
        service.save_tracks(tracks)
        
        return {
            "success": True,
            "message": f"Track {action}ed successfully",
            "track": track if action != 'delete' else None,
            "timestamp": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics")
async def get_tracking_analytics():
    """
    Get tracking system analytics and metrics.
    
    Returns:
        KPIs including track counts, confidences, and performance metrics
    """
    try:
        service = get_tracking_service()
        tracks = service.load_tracks()
        
        if not tracks:
            return {
                "success": True,
                "kpis": {
                    "total_tracks": 0,
                    "avg_confidence": 0,
                    "high_confidence_count": 0,
                    "needs_review_count": 0,
                    "avg_links_per_track": 0
                },
                "timestamp": datetime.now().isoformat()
            }
        
        confidences = [t['confidence'] for t in tracks]
        link_counts = [len(t.get('links', [])) for t in tracks]
        
        kpis = {
            "total_tracks": len(tracks),
            "avg_confidence": round(sum(confidences) / len(confidences), 3),
            "min_confidence": round(min(confidences), 3),
            "max_confidence": round(max(confidences), 3),
            "high_confidence_count": len([c for c in confidences if c > 0.85]),
            "medium_confidence_count": len([c for c in confidences if 0.5 < c <= 0.85]),
            "low_confidence_count": len([c for c in confidences if c <= 0.5]),
            "needs_review_count": len([t for t in tracks if t['status'] == 'needs_review']),
            "avg_links_per_track": round(sum(link_counts) / len(link_counts), 2) if link_counts else 0
        }
        
        return {
            "success": True,
            "kpis": kpis,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Mark alert as acknowledged"""
    print(f"✓ Alert acknowledged: {alert_id}")
    return {
        "success": True,
        "message": f"Alert {alert_id} acknowledged",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    """Mark alert as dismissed"""
    print(f"✓ Alert dismissed: {alert_id}")
    return {
        "success": True,
        "message": f"Alert {alert_id} dismissed",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/topology")
async def get_topology():
    """Get hospital topology (nodes and edges)"""
    try:
        service = get_tracking_service()
        
        # Get nodes with computed positions
        nodes = []
        for node in service.nodes:
            nodes.append({
                "id": node["id"],
                "name": node["name"],
                "type": "room",
                "x": 100 + node["id"] * 150,
                "y": 150 + (node["id"] % 2) * 200
            })
        
        # Get edges
        edges = []
        for edge in service.edges:
            edges.append({
                "from": edge["from"],
                "to": edge["to"],
                "distance": edge["distance"]
            })
        
        print(f"Returning topology: {len(nodes)} nodes, {len(edges)} edges")
        
        return {
            "success": True,
            "topology": {
                "nodes": nodes,
                "edges": edges
            }
        }
    except Exception as e:
        print(f"Topology error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
