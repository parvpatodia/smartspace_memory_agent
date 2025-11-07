import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import appState from '../services/appState';
import '../styles/tracking.css';

function TrackingViewer() {
    const [tracks, setTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [generatingTracks, setGeneratingTracks] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        loadTracks();
        loadAnalytics();
    }, []);

    const generateRealisticTestData = () => {
        const now = new Date();
        const detections = [];
        
        // Simulate 3 pieces of equipment moving through a path
        const paths = [
            // Patient monitor: Room 2 → Hallway A → Room 5 → Staging Area
            { equipment: 'patient_monitor', path: [1, 2, 3, 5], startTime: -600 },
            // Surgical equipment: OR 1 → Staging Area → Room 2
            { equipment: 'surgical_equipment', path: [4, 5, 1], startTime: -480 },
            // Hospital bed: Room 5 → Hallway A → Room 2
            { equipment: 'hospital_bed', path: [3, 2, 1], startTime: -300 }
        ];
        
        let detId = 0;
        paths.forEach(movement => {
            movement.path.forEach((nodeId, idx) => {
                const timeOffset = movement.startTime + (idx * 180); // 3 min per node
                const ts = new Date(now.getTime() + timeOffset * 1000);
                
                detections.push({
                    det_id: detId++,
                    ts: ts.toISOString(),
                    class: movement.equipment,
                    node_id: nodeId,
                    score: 0.85 + Math.random() * 0.1
                });
            });
        });
        
        return detections;
    };

    const loadTracks = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getTracks();
            if (response.success) {
                setTracks(response.tracks || []);
                appState.addTracks(response.tracks || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateTracks = async (useTestData = false) => {
        try {
            setGeneratingTracks(true);
            setError(null);
    
            let trackingDetections;
            
            if (useTestData) {
                // Use realistic synthetic data
                trackingDetections = generateRealisticTestData();
                console.log('Using realistic test data:', trackingDetections);
            } else {
                // Use real detections from app state
                const state = appState.getState();
                const allDetections = state.memories || [];
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
                let detections = allDetections.filter(det => {
                    const detTime = new Date(det.createdAt);
                    return detTime > twoHoursAgo;
                });
                
                // Filter by selected node if specified
                if (selectedNode) {
                    detections = detections.filter(det => det.node_id === selectedNode);
                    console.log(`Filtered by node ${selectedNode}: ${detections.length} detections`);
                }
                
    
                if (!detections.length) {
                    setError('No recent detections. Use "Test Data" button or upload new videos.');
                    setGeneratingTracks(false);
                    return;
                }
    
                trackingDetections = detections.map((det, idx) => ({
                    det_id: idx,
                    ts: det.createdAt,
                    class: det.name || 'equipment',
                    node_id: det.node_id || 1,
                    score: det.confidence || 0.8
                }));
            }
    
            console.log('Tracking detections:', trackingDetections);
    
            // Call association endpoint
            const response = await apiClient.associateDetections(trackingDetections, false);
    
            console.log('Association response:', response);
    
            if (response.success) {
                setTracks(response.tracks || []);
                appState.addTracks(response.tracks || []);
                loadAnalytics();
            } else {
                setError('Failed to generate tracks');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error generating tracks:', err);
        } finally {
            setGeneratingTracks(false);
        }
    };
    

    const loadAnalytics = async () => {
        try {
            const response = await apiClient.getTrackingAnalytics();
            if (response.success) {
                setAnalytics(response.kpis);
            }
        } catch (err) {
            console.error('Failed to load analytics:', err);
        }
    };

    const handleReconcile = async (trackId, action) => {
        try {
            await apiClient.reconcileTrack(trackId, action);
            loadTracks();
            loadAnalytics();
        } catch (err) {
            setError(err.message);
        }
    };

    const renderChain = (track) => {
        return (
            <div className="track-chain">
                {track.links && track.links.map((link, idx) => (
                    <div key={idx} className="chain-segment">
                        <div className="node-badge">
                            {link.from_node_name}
                        </div>
                        <div className="arrow">→</div>
                        <div className="node-badge">
                            {link.to_node_name}
                        </div>
                        <div className="link-info">
                            <span className="time-info">
                                {new Date(link.t_exit).toLocaleTimeString()} - {new Date(link.t_entry).toLocaleTimeString()}
                            </span>
                            <span className={`confidence confidence-${getConfidenceLevel(link.confidence)}`}>
                                {(link.confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                        {link.reasons && (
                            <div className="reasons">
                                {link.reasons.map((reason, i) => (
                                    <div key={i} className="reason-item">{reason}</div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const getConfidenceLevel = (confidence) => {
        if (confidence > 0.85) return 'high';
        if (confidence > 0.5) return 'medium';
        return 'low';
    };

    return (
        <div className="tracking-viewer">
            <div className="tracking-header">
                <h2>Equipment Tracking</h2>
                <div className="header-buttons">
                    <button 
                        onClick={() => generateTracks(true)}  // Use test data
                        disabled={generatingTracks} 
                        className="generate-btn"
                        title="Generate tracks with realistic synthetic data"
                    >
                        {generatingTracks ? 'Generating...' : 'Test Data'}
                    </button>
                    <button 
                        onClick={() => generateTracks(false)}  // Use real data
                        disabled={generatingTracks} 
                        className="generate-btn"
                    >
                        {generatingTracks ? 'Generating...' : 'Generate Tracks'}
                    </button>
                    <button onClick={loadTracks} disabled={loading} className="refresh-btn">
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Node Filter/Selector */}
            <div className="node-filter-container">
                <label htmlFor="node-filter" className="node-filter-label">
                    Filter by Location (optional):
                </label>
                <select
                    id="node-filter"
                    value={selectedNode || 'all'}
                    onChange={(e) => setSelectedNode(e.target.value === 'all' ? null : Number(e.target.value))}
                    className="node-filter-select"
                >
                    <option value="all">All Locations</option>
                    <option value="1">Room 2</option>
                    <option value="2">Hallway A</option>
                    <option value="3">Room 5</option>
                    <option value="4">OR 1</option>
                    <option value="5">Staging Area</option>
                </select>
                <span className="filter-info">
                    {selectedNode ? `Filtering by Node ${selectedNode}` : 'Showing all detections'}
                </span>
            </div>


            {analytics && (
                <div className="analytics-summary">
                    <div className="stat-box">
                        <span className="stat-label">Total Tracks</span>
                        <span className="stat-value">{analytics.total_tracks}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">Avg Confidence</span>
                        <span className="stat-value">{(analytics.avg_confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">High Confidence</span>
                        <span className="stat-value">{analytics.high_confidence_count}</span>
                    </div>
                    <div className="stat-box warning">
                        <span className="stat-label">Needs Review</span>
                        <span className="stat-value">{analytics.needs_review_count}</span>
                    </div>
                </div>
            )}

{error && <div className="error-message">{error}</div>}

    {/* Calculate filtered tracks based on selected node */}
    {(() => {
        const filteredTracks = selectedNode 
            ? tracks.filter(track => {
                // Check if any link in the track involves the selected node
                return track.links && track.links.some(link => 
                    link.from_node_id === selectedNode || link.to_node_id === selectedNode
                );
            })
            : tracks;

        return filteredTracks.length === 0 ? (
            <div className="empty-state">
                <p>
                    {selectedNode 
                        ? `No tracks found for Node ${selectedNode}.` 
                        : 'No tracks generated yet.'}
                </p>
                <p>Click "Generate Tracks" to associate uploaded detections into equipment movement chains.</p>
            </div>
        ) : (
            <div className="tracks-list">
                {filteredTracks.map((track) => (
                    <div key={track.track_id} className="track-card">
                        <div className="track-header">
                            <div className="track-info">
                                <h3>{track.class}</h3>
                                <span className={`status-badge ${track.status}`}>
                                    {track.status}
                                </span>
                            </div>
                            <div className="track-confidence">
                                <span className={`confidence-badge confidence-${getConfidenceLevel(track.confidence)}`}>
                                    {(track.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        <div className="track-details">
                            {renderChain(track)}
                        </div>

                        {track.status === 'needs_review' && (
                            <div className="track-actions">
                                <button 
                                    onClick={() => handleReconcile(track.track_id, 'confirm')}
                                    className="btn btn-confirm"
                                >
                                    Confirm
                                </button>
                                <button 
                                    onClick={() => handleReconcile(track.track_id, 'flag')}
                                    className="btn btn-flag"
                                >
                                    Keep as Review
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    })()}
    </div>
    );
    }

export default TrackingViewer;
