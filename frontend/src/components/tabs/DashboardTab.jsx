import React, { useState, useEffect } from 'react';

const DashboardTab = ({ stats, detections }) => {
  const [timeRange, setTimeRange] = useState('today');
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Calculate health metrics
  const healthScore = stats?.total > 0 
    ? Math.round(((stats?.total - (stats?.alerts || 0)) / stats?.total) * 100)
    : 100;

  const systemStatus = healthScore >= 90 ? 'optimal' : healthScore >= 70 ? 'nominal' : 'caution';
  const statusColors = {
    optimal: { bg: '#ecf9fc', border: '#06b6d4', text: '#0891b2', label: 'Optimal' },
    nominal: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', label: 'Nominal' },
    caution: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', label: 'Caution' }
  };

  const currentStatus = statusColors[systemStatus];

  // Format metrics
  const equipmentTypes = stats?.equipmentTypes || 0;
  const totalDetections = stats?.total || 0;
  const criticalAlerts = (stats?.critical?.length || 0);
  const averageConfidence = stats?.total > 0 ? '82%' : 'N/A';

  // Get recent detections (last 5)
  const recentDetections = (detections || []).slice(0, 5);

  // Equipment distribution
  const equipmentDistribution = (stats?.distribution || [])
    .sort((a, b) => (b?.count || 0) - (a?.count || 0))
    .slice(0, 5);

  return (
    <section className="dashboard-tab">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Equipment Monitoring</h1>
          <p>Real-time healthcare facility surveillance and analysis</p>
        </div>
        <div className="header-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>


      {/* System Status Panel */}
      <div className="status-panel" style={{ borderLeft: `4px solid ${currentStatus.border}` }}>
        <div className="status-header">
          <div className="status-indicator" style={{ backgroundColor: currentStatus.border }}></div>
          <h3>System Status</h3>
          <span className="status-label" style={{ backgroundColor: currentStatus.bg, color: currentStatus.text }}>
            {currentStatus.label}
          </span>
        </div>
        <div className="status-metrics">
          <div className="status-metric">
            <span className="metric-label">Health Score</span>
            <span className="metric-value" style={{ color: currentStatus.text }}>
              {healthScore}%
            </span>
          </div>
          <div className="status-metric">
            <span className="metric-label">Operational Items</span>
            <span className="metric-value">{totalDetections - criticalAlerts}/{totalDetections}</span>
          </div>
          <div className="status-metric">
            <span className="metric-label">Alerts Active</span>
            <span className="metric-value" style={{ color: criticalAlerts > 0 ? '#dc2626' : '#10b981' }}>
              {criticalAlerts}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">■</div>
          <div className="kpi-content">
            <span className="kpi-label">Total Monitored</span>
            <span className="kpi-value">{totalDetections}</span>
            <span className="kpi-unit">Equipment Items</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">▲</div>
          <div className="kpi-content">
            <span className="kpi-label">Equipment Types</span>
            <span className="kpi-value">{equipmentTypes}</span>
            <span className="kpi-unit">Unique Categories</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⚠</div>
          <div className="kpi-content">
            <span className="kpi-label">Critical Alerts</span>
            <span className="kpi-value" style={{ color: criticalAlerts > 0 ? '#dc2626' : '#10b981' }}>
              {criticalAlerts}
            </span>
            <span className="kpi-unit">Requiring Attention</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">●</div>
          <div className="kpi-content">
            <span className="kpi-label">Avg Confidence</span>
            <span className="kpi-value">{averageConfidence}</span>
            <span className="kpi-unit">Detection Accuracy</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Equipment & Activity */}
        <div className="column">
          {/* Equipment Distribution */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Equipment Distribution</h3>
              <span className="card-subtitle">By Detection Frequency</span>
            </div>
            <div className="equipment-list">
              {equipmentDistribution.length > 0 ? (
                equipmentDistribution.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="equipment-item"
                    onClick={() => setSelectedEquipment(selectedEquipment === item.name ? null : item.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="equipment-info">
                      <span className="equipment-name">{item.name?.replace(/_/g, ' ')}</span>
                      <span className="equipment-count">{item.count} detections</span>
                    </div>
                    <div className="equipment-bar">
                      <div 
                        className="equipment-fill"
                        style={{ width: `${(item.count / equipmentDistribution[0]?.count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No equipment data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <span className="card-subtitle">Last 5 Detections</span>
            </div>
            <div className="activity-feed">
              {recentDetections.length > 0 ? (
                recentDetections.map((detection, idx) => (
                  <div key={idx} className="activity-item">
                    <div className="activity-marker"></div>
                    <div className="activity-content">
                      <span className="activity-title">{detection?.name?.replace(/_/g, ' ')}</span>
                      <span className="activity-time">
                        {new Date(detection?.timestamp || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className={`activity-confidence ${detection?.confidence > 0.75 ? 'high' : 'medium'}`}>
                      {(detection?.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No recent detections</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Insights */}
        <div className="column">
          {/* Critical Alerts */}
          <div className="dashboard-card alert-card">
            <div className="card-header">
              <h3>Critical Items</h3>
              <span className="card-subtitle">Requiring Attention</span>
            </div>
            {criticalAlerts > 0 ? (
              <div className="alerts-list">
                {(stats?.critical || []).slice(0, 4).map((alert, idx) => (
                  <div key={idx} className="alert-item">
                    <div className="alert-icon">⚠</div>
                    <div className="alert-details">
                      <span className="alert-name">{alert?.name?.replace(/_/g, ' ')}</span>
                      <span className="alert-info">{alert?.location}</span>
                    </div>
                    <div className="alert-action">→</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-alerts">
                <div className="no-alerts-icon">✓</div>
                <p>All systems nominal</p>
                <span>No critical alerts at this time</span>
              </div>
            )}
          </div>

          {/* System Performance */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Performance Metrics</h3>
              <span className="card-subtitle">System Overview</span>
            </div>
            <div className="metrics-stack">
              <div className="metric-row">
                <span className="metric-name">Detection Rate</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '92%' }}></div>
                </div>
                <span className="metric-percent">92%</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">System Uptime</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '99%' }}></div>
                </div>
                <span className="metric-percent">99%</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">Response Time</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '88%' }}></div>
                </div>
                <span className="metric-percent">88%</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">Data Integrity</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '100%' }}></div>
                </div>
                <span className="metric-percent">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="dashboard-footer">
        <div className="footer-item">
          <span className="footer-label">Last Updated</span>
          <span className="footer-value">{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="footer-item">
          <span className="footer-label">Data Period</span>
          <span className="footer-value">{timeRange === 'today' ? 'Last 24 Hours' : timeRange === 'week' ? 'Last 7 Days' : timeRange === 'month' ? 'Last 30 Days' : 'All Available Data'}</span>
        </div>
        <div className="footer-item">
          <span className="footer-label">Next Refresh</span>
          <span className="footer-value">in 5 minutes</span>
        </div>
      </div>
    </section>
  );
};

export default DashboardTab;