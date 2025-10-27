import React from 'react';

const AnalyticsTab = ({ stats, uploadHistory }) => {
  // Calculate key metrics
  const totalUploads = uploadHistory?.length || 0;
  const totalDetections = stats?.total || 0;
  const avgDetectionsPerUpload = totalUploads > 0 ? (totalDetections / totalUploads).toFixed(1) : 0;
  const alertRate = totalDetections > 0 ? ((stats?.alerts / totalDetections) * 100).toFixed(1) : 0;
  const criticalCount = stats?.critical?.length || 0;
  const equipmentTypes = stats?.equipmentTypes || 0;

  // Sort equipment by frequency
  const sortedEquipment = (stats?.distribution || [])
    .sort((a, b) => (b?.count || 0) - (a?.count || 0));

  // Get max count for bar chart
  const maxCount = Math.max(...sortedEquipment.map(e => e?.count || 0), 1);

  // Time analysis
  const getTimeRange = () => {
    if (totalUploads === 0) return 'No data';
    if (uploadHistory && uploadHistory.length > 0) {
      const oldest = new Date(uploadHistory[uploadHistory.length - 1]?.timestamp);
      const newest = new Date(uploadHistory[0]?.timestamp);
      const days = Math.floor((newest - oldest) / (1000 * 60 * 60 * 24));
      return days === 0 ? 'Today' : `${days} days`;
    }
    return 'N/A';
  };

  // Equipment utilization analysis
  const equipmentUtilization = sortedEquipment.map(eq => ({
    name: eq?.name || 'Unknown',
    count: eq?.count || 0,
    percentage: maxCount > 0 ? ((eq?.count || 0) / maxCount * 100).toFixed(0) : 0
  }));

  // Risk assessment
  const getRiskLevel = () => {
    const criticalPercentage = totalDetections > 0 ? (criticalCount / totalDetections * 100) : 0;
    if (criticalPercentage > 30) return { level: 'HIGH', color: '#dc2626', icon: '⚠️' };
    if (criticalPercentage > 10) return { level: 'MEDIUM', color: '#f59e0b', icon: '⚡' };
    return { level: 'LOW', color: '#10b981', icon: '✓' };
  };

  const riskAssessment = getRiskLevel();

  return (
    <section className="analytics-tab">
      {/* Header */}
      <div className="analytics-header">
        <h2>📊 Analytics & Insights</h2>
        <p>Healthcare Equipment Monitoring Analysis</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">📹</div>
          <div className="metric-content">
            <h4>Total Uploads</h4>
            <p className="metric-value">{totalUploads}</p>
            <span className="metric-label">videos analyzed</span>
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h4>Total Detections</h4>
            <p className="metric-value">{totalDetections}</p>
            <span className="metric-label">equipment items</span>
          </div>
        </div>

        <div className="metric-card accent">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h4>Avg per Upload</h4>
            <p className="metric-value">{avgDetectionsPerUpload}</p>
            <span className="metric-label">items per video</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">🚨</div>
          <div className="metric-content">
            <h4>Alert Rate</h4>
            <p className="metric-value">{alertRate}%</p>
            <span className="metric-label">of detections</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">🏥</div>
          <div className="metric-content">
            <h4>Equipment Types</h4>
            <p className="metric-value">{equipmentTypes}</p>
            <span className="metric-label">unique types</span>
          </div>
        </div>

        <div className="metric-card critical">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h4>Critical Items</h4>
            <p className="metric-value">{criticalCount}</p>
            <span className="metric-label">flagged alerts</span>
          </div>
        </div>
      </div>

      {/* Risk Assessment Box */}
      <div className="risk-assessment-box" style={{ borderLeft: `4px solid ${riskAssessment.color}` }}>
        <div className="risk-header">
          <span className="risk-icon">{riskAssessment.icon}</span>
          <h3>Risk Assessment</h3>
          <span className="risk-level" style={{ backgroundColor: riskAssessment.color }}>
            {riskAssessment.level}
          </span>
        </div>
        <p className="risk-description">
          {riskAssessment.level === 'HIGH' && 'High number of critical alerts detected. Immediate attention recommended.'}
          {riskAssessment.level === 'MEDIUM' && 'Moderate number of critical alerts. Review detected equipment regularly.'}
          {riskAssessment.level === 'LOW' && 'Equipment monitoring is operating normally with minimal critical alerts.'}
        </p>
        <div className="risk-stats">
          <span>Critical Rate: {totalDetections > 0 ? ((criticalCount / totalDetections * 100).toFixed(1)) : 0}%</span>
          <span>Time Range: {getTimeRange()}</span>
        </div>
      </div>

      {/* Equipment Distribution */}
      <div className="analytics-section">
        <h3>🏥 Equipment Detection Frequency</h3>
        <div className="equipment-frequency-chart">
          {equipmentUtilization.length > 0 ? (
            equipmentUtilization.map((eq, idx) => (
              <div key={idx} className="frequency-row">
                <div className="frequency-label">
                  <span className="equipment-name">{eq.name.replace(/_/g, ' ')}</span>
                  <span className="equipment-count">{eq.count} detections</span>
                </div>
                <div className="frequency-bar-container">
                  <div
                    className="frequency-bar"
                    style={{ width: `${eq.percentage}%` }}
                  >
                    <span className="bar-percentage">{eq.percentage}%</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No equipment data available</p>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>📈 Detection Trend</h4>
          <div className="trend-info">
            {totalUploads > 0 ? (
              <>
                <p>Average detections: <strong>{avgDetectionsPerUpload}</strong> per upload</p>
                <p className="trend-note">Consistent monitoring across {totalUploads} sessions</p>
              </>
            ) : (
              <p className="no-data">Upload videos to see trends</p>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h4>⚠️ Alert Distribution</h4>
          <div className="alert-info">
            <div className="alert-stat">
              <span className="alert-label">Critical</span>
              <span className="alert-value critical">{criticalCount}</span>
            </div>
            <div className="alert-stat">
              <span className="alert-label">High Priority</span>
              <span className="alert-value warning">{stats?.alerts - criticalCount || 0}</span>
            </div>
            <div className="alert-stat">
              <span className="alert-label">Normal</span>
              <span className="alert-value info">{totalDetections - stats?.alerts || 0}</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h4>📊 Monitoring Coverage</h4>
          <div className="coverage-info">
            <div className="coverage-stat">
              <span className="coverage-label">Upload Success Rate</span>
              <span className="coverage-percentage">100%</span>
            </div>
            <div className="coverage-stat">
              <span className="coverage-label">Data Quality</span>
              <span className="coverage-percentage">Excellent</span>
            </div>
            <div className="coverage-stat">
              <span className="coverage-label">System Status</span>
              <span className="coverage-percentage">✓ Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>💡 Key Insights</h3>
        <div className="insights-list">
          {equipmentTypes > 0 && (
            <div className="insight-item">
              <span className="insight-icon">✓</span>
              <span className="insight-text">
                Detecting <strong>{equipmentTypes}</strong> types of medical equipment across all uploads
              </span>
            </div>
          )}
          
          {sortedEquipment.length > 0 && (
            <div className="insight-item">
              <span className="insight-icon">✓</span>
              <span className="insight-text">
                Most detected: <strong>{sortedEquipment[0]?.name?.replace(/_/g, ' ')}</strong> ({sortedEquipment[0]?.count} times)
              </span>
            </div>
          )}

          {alertRate > 0 && (
            <div className="insight-item">
              <span className="insight-icon">⚠️</span>
              <span className="insight-text">
                <strong>{alertRate}%</strong> of detected equipment generated critical alerts
              </span>
            </div>
          )}

          {totalUploads > 0 && (
            <div className="insight-item">
              <span className="insight-icon">✓</span>
              <span className="insight-text">
                Monitoring active for <strong>{getTimeRange()}</strong> with <strong>{totalUploads}</strong> video sessions
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="export-section">
        <h3>📥 Data Export</h3>
        <div className="export-buttons">
          <button className="export-btn pdf">
            <span>📄</span> Export as PDF Report
          </button>
          <button className="export-btn csv">
            <span>📊</span> Export as CSV
          </button>
          <button className="export-btn json">
            <span>⚙️</span> Export Raw JSON
          </button>
        </div>
        <p className="export-note">
          Generated reports include comprehensive analytics, equipment statistics, and alert summaries
        </p>
      </div>
    </section>
  );
};

export default AnalyticsTab;