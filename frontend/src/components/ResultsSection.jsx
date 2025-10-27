import React from 'react';
import AlertPanel from './AlertPanel';
import DetectionCard from './DetectionCard';

const ResultsSection = ({ data }) => {
  // Safety check: ensure data exists
  if (!data) {
    return (
      <section className="results-section">
        <div className="empty-state">
          <p>No results available</p>
        </div>
      </section>
    );
  }

  const detections = Array.isArray(data.detections) ? data.detections : [];
  const alerts = detections.filter(d => d?.alert);

  return (
    <section className="results-section fade-in">
      <div className="section-header">
        <h2>Detection Results</h2>
        <div className="results-summary">
          <div className="summary-item">
            <div className="summary-icon">📦</div>
            <div className="summary-content">
              <h4>Detections</h4>
              <p>{detections.length}</p>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">{alerts.length > 0 ? '⚠️' : '✓'}</div>
            <div className="summary-content">
              <h4>Alerts</h4>
              <p>{alerts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {alerts.length > 0 && <AlertPanel alerts={alerts} />}
      
      <div className="detections-grid">
        {detections.length > 0 ? (
          detections.map((detection, index) => (
            <DetectionCard key={detection?.id || index} detection={detection} />
          ))
        ) : (
          <div className="empty-state">
            <p>No objects detected</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResultsSection;
