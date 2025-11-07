"""
Tracking service for equipment identity resolution.
Uses topology-aware association with Hungarian algorithm.
"""

from typing import List, Dict, Optional, Tuple
import json
from pathlib import Path
from datetime import datetime, timedelta
import yaml
import numpy as np
from scipy.optimize import linear_sum_assignment
import networkx as nx


class TrackingService:
    """
    Topology-aware equipment tracking service.
    
    Combines spatial-temporal constraints with Hungarian assignment
    to infer equipment identity chains across detections.
    """
    
    def __init__(self, config_path: str = "config/topology.yaml"):
        self.config_path = config_path
        self.nodes = []
        self.edges = []
        self.graph = None
        self.shortest_paths = {}
        self.config = {}
        self.tracks_file = Path("data/tracks.json")
        
    def load_topology(self):
        """Load topology configuration from YAML."""
        try:
            with open(self.config_path, 'r') as f:
                self.config = yaml.safe_load(f)
            
            self.nodes = self.config.get('nodes', [])
            self.edges = self.config.get('edges', [])
            
            self._build_graph()
            self._compute_shortest_paths()
            
        except FileNotFoundError:
            raise Exception(f"Topology config not found: {self.config_path}")
        except Exception as e:
            raise Exception(f"Failed to load topology: {e}")
    
    def _build_graph(self):
        """Build NetworkX graph from nodes and edges."""
        self.graph = nx.Graph()
        
        for node in self.nodes:
            self.graph.add_node(node['id'], name=node['name'], type=node['type'])
        
        for edge in self.edges:
            self.graph.add_edge(
                edge['from'],
                edge['to'],
                weight=edge['distance_m']
            )
    
    def _compute_shortest_paths(self):
        """Precompute shortest paths between all node pairs."""
        self.shortest_paths = {}
        
        for source in self.graph.nodes():
            try:
                lengths = nx.single_source_dijkstra_path_length(
                    self.graph, source, weight='weight'
                )
                self.shortest_paths[source] = lengths
            except Exception:
                pass
    
    def get_distance(self, from_node_id: int, to_node_id: int) -> Optional[float]:
        """Get distance between two nodes."""
        if from_node_id not in self.shortest_paths:
            return None
        return self.shortest_paths[from_node_id].get(to_node_id)
    
    def get_node_name(self, node_id: int) -> str:
        """Get node name by ID."""
        for node in self.nodes:
            if node['id'] == node_id:
                return node['name']
        return f"Node {node_id}"
    
    def get_node_id(self, node_name: str) -> Optional[int]:
        """Get node ID by name."""
        for node in self.nodes:
            if node['name'].lower() == node_name.lower():
                return node['id']
        return None
    
    def build_cost_matrix(
        self,
        exits: List[Dict],
        entries: List[Dict]
    ) -> np.ndarray:
        """
        Build cost matrix with feasibility gating.
        
        Cost is infinity if movement is physically impossible.
        Otherwise, cost reflects distance/time/appearance deviation.
        """
        n_exits = len(exits)
        n_entries = len(entries)
        C = np.full((n_exits, n_entries), np.inf)
        
        config = self.config.get('speed_config', {})
        normal_speed = config.get('normal_mps', 1.3)
        urgent_speed = config.get('urgent_mps', 2.2)
        time_pad = config.get('time_pad_s', 8)
        
        for i, exit_det in enumerate(exits):
            for j, entry_det in enumerate(entries):
                from_node = exit_det['node_id']
                to_node = entry_det['node_id']
                
                # Same node - skip (equipment can't stay in same node)
                if from_node == to_node:
                    continue
                
                # Get distance
                dist = self.get_distance(from_node, to_node)
                if dist is None:
                    continue  # No path exists
                
                # Calculate transit times
                t_exit = exit_det['ts']
                t_entry = entry_det['ts']
                actual_time = (t_entry - t_exit).total_seconds()
                
                # Skip if going backwards in time
                if actual_time < 0:
                    continue
                
                # Expected transit time
                expected_time = dist / normal_speed
                
                # Relaxed gating for demo
                # Allow 0.5x to 3x expected time
                time_lower = expected_time * 0.3  # Can be faster
                time_upper = expected_time * 3 + time_pad  # Can be slower or waiting
                
                # Feasibility gate
                if actual_time < time_lower or actual_time > time_upper:
                    continue
                
                # Compute cost components (normalized)
                dist_dev = abs(dist - 20) / 30 if dist > 0 else 0  # Normalize to ~20m
                time_dev = abs(actual_time - expected_time) / max(expected_time, 1)
                
                # Combined cost (lower is better)
                assoc_config = self.config.get('association', {})
                weight_dist = assoc_config.get('dist_weight', 0.4)
                weight_time = assoc_config.get('time_weight', 0.4)
                
                cost = (weight_dist * dist_dev) + (weight_time * time_dev)
                C[i, j] = cost
        
        return C

    
    def compute_link_confidence(
        self,
        exit_det: Dict,
        entry_det: Dict,
        cost: float
    ) -> float:
        """Compute confidence score for a single link."""
        # Normalize cost to confidence (0-1)
        # Lower cost = higher confidence
        confidence = max(0, 1 - cost)
        return round(confidence, 3)
    
    def generate_reasons(
        self,
        exit_det: Dict,
        entry_det: Dict,
        cost: float
    ) -> List[str]:
        """Generate human-readable reasons for a link."""
        from_node = self.get_node_name(exit_det['node_id'])
        to_node = self.get_node_name(entry_det['node_id'])
        
        dist = self.get_distance(exit_det['node_id'], entry_det['node_id'])
        actual_time = (entry_det['ts'] - exit_det['ts']).total_seconds()
        expected_time = dist / 1.3 if dist else 0
        
        reasons = [
            f"Movement: {from_node} → {to_node}",
            f"Distance: {dist:.1f}m, expected ~{expected_time:.0f}s, actual {actual_time:.0f}s",
            f"Cost score: {cost:.3f}"
        ]
        
        return reasons
    
    def associate_detections(
    self,
    detections: List[Dict]
    ) -> List[Dict]:
        """
        Associate detections into equipment tracks using normal mode.
        """
        if not detections:
            return []
        
        # Parse and validate detections
        parsed_detections = []
        for det in detections:
            try:
                # Handle both string and datetime objects
                ts = det.get('ts')
                if isinstance(ts, str):
                    # Parse ISO format string
                    ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                elif not isinstance(ts, datetime):
                    # Skip invalid timestamps
                    continue
                
                parsed_det = {
                    'det_id': det.get('det_id'),
                    'ts': ts,
                    'class': det.get('class', 'equipment'),
                    'node_id': int(det.get('node_id', 1)),
                    'score': float(det.get('score', 0.8))
                }
                parsed_detections.append(parsed_det)
            except Exception as e:
                print(f"Warning: Skipping invalid detection - {e}")
                continue
        
        if not parsed_detections:
            return []

        """
        Associate detections into equipment tracks using normal mode.
        
        Groups detections into 5-second windows and applies Hungarian assignment.
        """
        if not detections:
            return []
        
        # Sort by timestamp
        sorted_dets = sorted(parsed_detections, key=lambda d: d['ts'])
        
        # Create time windows (5 second buckets)
        windows = []
        current_window = []
        current_time = sorted_dets[0]['ts']
        
        for det in sorted_dets:
            if (det['ts'] - current_time).total_seconds() > 5:
                if current_window:
                    windows.append(current_window)
                current_window = [det]
                current_time = det['ts']
            else:
                current_window.append(det)
        
        if current_window:
            windows.append(current_window)
        
        # Process windows and build tracks
        tracks = []
        open_tracks = {}  # node_id -> list of partial tracks
        
        for window_idx in range(len(windows) - 1):
            prev_window = windows[window_idx]
            curr_window = windows[window_idx + 1]
            
            # Find exits from each node in previous window
            exits_by_node = {}
            for det in prev_window:
                node_id = det['node_id']
                if node_id not in exits_by_node:
                    exits_by_node[node_id] = det
                else:
                    # Keep the last detection (exit)
                    if det['ts'] > exits_by_node[node_id]['ts']:
                        exits_by_node[node_id] = det
            
            exits = list(exits_by_node.values())
            
            # Find entries to each node in current window
            entries_by_node = {}
            for det in curr_window:
                node_id = det['node_id']
                if node_id not in entries_by_node:
                    entries_by_node[node_id] = det
                else:
                    # Keep the first detection (entry)
                    if det['ts'] < entries_by_node[node_id]['ts']:
                        entries_by_node[node_id] = det
            
            entries = list(entries_by_node.values())
            
            if not exits or not entries:
                continue
            
            # Build cost matrix and solve assignment
            C = self.build_cost_matrix(exits, entries)
            
            if np.all(np.isinf(C)):
                continue  # No valid assignments
            
            row_ind, col_ind = linear_sum_assignment(C)
            
            # Process matches
            matched_exits = set()
            matched_entries = set()
            
            for r, c in zip(row_ind, col_ind):
                if np.isinf(C[r, c]):
                    continue
                
                exit_det = exits[r]
                entry_det = entries[c]
                cost = C[r, c]
                
                link_conf = self.compute_link_confidence(exit_det, entry_det, cost)
                reasons = self.generate_reasons(exit_det, entry_det, cost)
                
                # Create or extend track
                from_node = exit_det['node_id']
                to_node = entry_det['node_id']
                
                if from_node in open_tracks and open_tracks[from_node]:
                    track = open_tracks[from_node].pop()
                else:
                    track = {
                        'track_id': self._generate_track_id(),
                        'class': exit_det['class'],
                        'links': [],
                        'confidence': 0,
                        'status': 'active'
                    }
                
                track['links'].append({
                    'from_node_id': from_node,
                    'to_node_id': to_node,
                    'from_node_name': self.get_node_name(from_node),
                    'to_node_name': self.get_node_name(to_node),
                    't_exit': exit_det['ts'].isoformat(),
                    't_entry': entry_det['ts'].isoformat(),
                    'confidence': link_conf,
                    'reasons': reasons
                })
                
                # Store for potential extension
                if to_node not in open_tracks:
                    open_tracks[to_node] = []
                open_tracks[to_node].append(track)
                
                matched_exits.add(r)
                matched_entries.add(c)
            
            # Finalize unmatched exits
            for i in range(len(exits)):
                if i not in matched_exits and exits[i]['node_id'] in open_tracks:
                    track = open_tracks[exits[i]['node_id']].pop()
                    self._finalize_track(track)
                    tracks.append(track)
        
        # Finalize remaining open tracks
        for node_tracks in open_tracks.values():
            for track in node_tracks:
                self._finalize_track(track)
                tracks.append(track)
        
        return tracks
    
    def _finalize_track(self, track: Dict):
        """Finalize a track and compute overall confidence."""
        if track['links']:
            link_confidences = [link['confidence'] for link in track['links']]
            # Geometric mean
            track['confidence'] = round(
                np.prod(link_confidences) ** (1 / len(link_confidences)), 3
            )
        else:
            track['confidence'] = 0
        
        if track['confidence'] < 0.5:
            track['status'] = 'needs_review'
    
    def _generate_track_id(self) -> str:
        """Generate a unique track ID."""
        import uuid
        return str(uuid.uuid4())
    
    def save_tracks(self, tracks: List[Dict]):
        """Save tracks to JSON file."""
        try:
            self.tracks_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.tracks_file, 'w') as f:
                json.dump(tracks, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving tracks: {e}")
    
    def load_tracks(self) -> List[Dict]:
        """Load tracks from JSON file."""
        try:
            if self.tracks_file.exists():
                with open(self.tracks_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading tracks: {e}")
        return []
