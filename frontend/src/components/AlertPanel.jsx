import React from 'react';

const AlertPanel = ({ alerts }) => {
  return (
    <div className="alert-panel">
      {alerts.map(alert => (
        <div key={alert.id} className={`alert-item ${alert.alert?.severity === 'critical' ? 'critical' : 'high'}`}>
          <span className="alert-icon">{alert.alert?.severity === 'critical' ? '🚨' : '⚠️'}</span>
          <div className="alert-content">
            <h4>{alert.alert?.title || `${alert.name} Alert`}</h4>
            <p>{alert.alert?.message || `Critical equipment detected: ${alert.name}`}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertPanel;
