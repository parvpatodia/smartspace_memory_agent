// src/components/TabNavigation.jsx

const TabNavigation = ({ activeTab, onTabChange, stats }) => {
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'upload', label: 'Upload Video', icon: '📹', badge: null },
      { id: 'analytics', label: 'Analytics', icon: '📈' },
      { id: 'history', label: 'History', icon: '📋' },
      { id: 'tracking', label: 'Tracking', icon: '🔍' },
      { id: 'topology', label: 'Topology', icon: '🌐' },
      { id: 'alerts', label: 'Alerts', icon: '🚨', badge: stats.alerts > 0 ? stats.alerts : null }
    ];
  
    return (
      <nav className="tab-navigation">
        <div className="container">
          <div className="tab-list">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {tab.badge !== null && (
                  <span className="tab-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>
    );
  };
  
  export default TabNavigation;
  