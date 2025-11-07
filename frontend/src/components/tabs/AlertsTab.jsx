import React, { useState } from 'react';
import apiClient from '../../services/api';

const AlertsTab = ({ critical, onClear }) => {
    const [alerts, setAlerts] = useState(critical);
    const [processing, setProcessing] = useState(null);

    const handleAcknowledge = async (alertId) => {
        try {
            setProcessing(alertId);
            
            // Call backend to acknowledge alert
            await apiClient.acknowledgeAlert(alertId);
            
            // Remove from UI
            setAlerts(alerts.filter(a => a.id !== alertId));
            console.log(`✓ Alert ${alertId} acknowledged`);
        } catch (err) {
            console.error('Failed to acknowledge alert:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleDismiss = async (alertId) => {
        try {
            setProcessing(alertId);
            
            // Check browser console for errors
            console.log(`Dismissing alert: ${alertId}`);
            
            const response = await apiClient.dismissAlert(alertId);
            console.log('Dismiss response:', response);
            
            // Remove from UI
            setAlerts(alerts.filter(a => a.id !== alertId));
            console.log(`✓ Alert ${alertId} dismissed`);
        } catch (err) {
            console.error('Failed to dismiss alert:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setProcessing(null);
        }
    
    };

    return (
        <section className="alerts-tab">
            <div className="section-header">
                <h2>🚨 Critical Alerts</h2>
                {alerts.length > 0 && (
                    <button className="btn btn-danger" onClick={onClear}>
                        Clear All
                    </button>
                )}
            </div>

            {alerts.length > 0 ? (
                <div className="alerts-list">
                    {alerts.map(alert => (
                        <div key={alert.id} className="alert-critical">
                            <div className="alert-header">
                                <h3>⚠️ {alert.name}</h3>
                                <span className="alert-time">
                                    {new Date(alert.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="alert-body">
                                <p><strong>Location:</strong> {alert.location}</p>
                                <p><strong>Confidence:</strong> {(alert.confidence * 100).toFixed(0)}%</p>
                                <p><strong>Details:</strong> {alert.description}</p>
                            </div>
                            <div className="alert-actions">
                                <button 
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleAcknowledge(alert.id)}
                                    disabled={processing === alert.id}
                                >
                                    {processing === alert.id ? 'Processing...' : 'Acknowledge'}
                                </button>
                                <button 
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleDismiss(alert.id)}
                                    disabled={processing === alert.id}
                                >
                                    {processing === alert.id ? 'Processing...' : 'Dismiss'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✓</div>
                    <h3>All Clear!</h3>
                    <p>No critical alerts at this time</p>
                </div>
            )}
        </section>
    );
};

export default AlertsTab;
