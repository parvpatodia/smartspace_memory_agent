import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import '../styles/topology.css';

function TopologyViewer() {
    const [topology, setTopology] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTopology();
    }, []);

    const loadTopology = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getTopology();
            if (response.success) {
                // Backend returns nodes/edges directly, not nested in topology
                setTopology({
                    nodes: response.nodes.map(n => ({
                        ...n,
                        x: 100 + n.id * 150,
                        y: 150 + (n.id % 2) * 200
                    })),
                    edges: response.edges.map(e => ({
                        from: e.from_id,
                        to: e.to_id,
                        distance: e.distance_m
                    }))
                });
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="topology-viewer"><p>Loading topology...</p></div>;
    if (error) return <div className="topology-viewer error"><p>Error: {error}</p></div>;
    if (!topology) return <div className="topology-viewer"><p>No topology data available</p></div>;

    return (
        <div className="topology-viewer">
            <div className="section-header">
                <h2>Hospital Layout - Equipment Tracking Network</h2>
                <button onClick={loadTopology} disabled={loading} className="btn btn-secondary">
                    Refresh
                </button>
            </div>

            <div className="topology-container">
                {/* SVG Network Diagram */}
                <svg className="topology-svg" viewBox="0 0 1000 600">
                    {/* Edges (connections) */}
                    {topology.edges && topology.edges.map((edge, idx) => {
                        const fromNode = topology.nodes.find(n => n.id === edge.from);
                        const toNode = topology.nodes.find(n => n.id === edge.to);
                        if (!fromNode || !toNode) return null;

                        return (
                            <g key={`edge-${idx}`} className="edge">
                                <line
                                    x1={fromNode.x}
                                    y1={fromNode.y}
                                    x2={toNode.x}
                                    y2={toNode.y}
                                    strokeWidth={edge.distance / 5}
                                    stroke="#ccc"
                                />
                                <text
                                    x={(fromNode.x + toNode.x) / 2}
                                    y={(fromNode.y + toNode.y) / 2 - 5}
                                    className="edge-label"
                                >
                                    {edge.distance}m
                                </text>
                            </g>
                        );
                    })}

                    {/* Nodes (rooms) */}
                    {topology.nodes && topology.nodes.map((node) => (
                        <g key={`node-${node.id}`} className="node">
                            <circle
                                cx={node.x}
                                cy={node.y}
                                r="40"
                                className="node-circle"
                                title={node.name}
                            />
                            <text
                                x={node.x}
                                y={node.y - 5}
                                className="node-label node-id"
                            >
                                {node.id}
                            </text>
                            <text
                                x={node.x}
                                y={node.y + 15}
                                className="node-label node-name"
                            >
                                {node.name.split(' ')[0]}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Legend */}
            <div className="topology-legend">
                <h3>Legend</h3>
                <div className="legend-items">
                    <div className="legend-item">
                        <div className="node-circle" style={{ width: 20, height: 20 }}></div>
                        <span>Hospital Location (Room/Area)</span>
                    </div>
                    <div className="legend-item">
                        <svg width="50" height="20">
                            <line x1="0" y1="10" x2="50" y2="10" stroke="#ccc" strokeWidth="2" />
                        </svg>
                        <span>Connection (Distance in meters)</span>
                    </div>
                </div>
            </div>

            {/* Node Details Table */}
            <div className="topology-details">
                <h3>Location Details</h3>
                <table className="nodes-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Connected To</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topology.nodes && topology.nodes.map((node) => {
                            const connections = topology.edges
                                .filter(e => e.from === node.id || e.to === node.id)
                                .length;
                            
                            return (
                                <tr key={node.id}>
                                    <td>{node.id}</td>
                                    <td>{node.name}</td>
                                    <td>{node.type || 'Area'}</td>
                                    <td>{connections} locations</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TopologyViewer;
