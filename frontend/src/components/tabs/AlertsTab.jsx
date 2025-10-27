
const AlertsTab = ({ critical, onClear }) => {
    return (
      <section className="alerts-tab">
        <div className="section-header">
          <h2>🚨 Critical Alerts</h2>
          {critical.length > 0 && (
            <button className="btn btn-danger" onClick={onClear}>
              Clear All
            </button>
          )}
        </div>
  
        {critical.length > 0 ? (
          <div className="alerts-list">
            {critical.map(alert => (
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
                  <button className="btn btn-sm btn-primary">Acknowledge</button>
                  <button className="btn btn-sm btn-secondary">Dismiss</button>
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
  