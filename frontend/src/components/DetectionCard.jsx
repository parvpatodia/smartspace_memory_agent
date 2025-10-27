import React from 'react';

const DetectionCard = ({ detection }) => {
  // SAFETY FIRST: Comprehensive validation
  if (!detection) {
    return (
      <div className="detection-card scale-in">
        <div className="empty-state" style={{ padding: '20px' }}>
          <p>Invalid detection data</p>
        </div>
      </div>
    );
  }

  // Extract and safely default all properties
  const name = detection?.name || 'Unknown Object';
  const location = detection?.location || 'N/A';
  const confidence = detection?.confidence ?? 0;
  const duration = detection?.duration ?? 0;
  const description = detection?.description || 'Equipment detected';
  const hasAlert = detection?.alert ? true : false;

  // Equipment icons mapping
  const icons = {
    'crash_cart': '🚑',
    'defibrillator': '⚡',
    'ventilator': '💨',
    'iv_pump': '💧',
    'patient_monitor': '📊',
    'ultrasound_machine': '📡',
    'wheelchair': '♿',
    'hospital_bed': '🛏️',
    'stretcher': '🛏️',
    'oxygen_tank': '🧪',
    'object_1': '📦',
    'object_2': '📦',
    'detected_object_1': '📦',
    'detected_object_2': '📦',
    'video_processing': '⏳'
  };

  // Get icon for this detection type
  const icon = icons[name] || icons[name?.toLowerCase()] || '📦';

  // Calculate confidence percentage safely
  const confidencePercent = typeof confidence === 'number' 
    ? Math.min(100, Math.max(0, confidence * 100)).toFixed(0)
    : 0;

  // Format name: safe replace with fallback
  const displayName = typeof name === 'string'
    ? name.replace(/_/g, ' ')
    : 'Unknown Object';

  // Format duration safely
  const displayDuration = typeof duration === 'number'
    ? duration.toFixed(1)
    : 'N/A';

  return (
    <div className="detection-card scale-in">
      <div className="detection-header">
        <div className="detection-icon">{icon}</div>
        <div className="detection-title">
          <h3>{displayName}</h3>
          <p>{location}</p>
        </div>
      </div>

      <div className="detection-details">
        <div className="detail-row">
          <span className="label">Confidence</span>
          <span className="value">{confidencePercent}%</span>
        </div>

        <div className="confidence-bar">
          <div 
            className="confidence-fill" 
            style={{ width: `${confidencePercent}%` }}
          ></div>
        </div>

        <div className="detail-row">
          <span className="label">Duration</span>
          <span className="value">{displayDuration}s</span>
        </div>

        {description && (
          <div className="detail-row">
            <span className="label">Details</span>
            <span className="value" style={{ fontSize: '0.7rem' }}>
              {description.substring(0, 30)}...
            </span>
          </div>
        )}
      </div>

      {hasAlert && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <span className="badge badge-error">⚠️ Alert Generated</span>
        </div>
      )}
    </div>
  );
};

export default DetectionCard;
