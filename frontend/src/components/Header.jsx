import React from 'react';

const Header = ({ stats }) => {
  return (
    <header className="app-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <h1>MemoryGuard</h1>
          </div>
          <div className="header-stats" id="headerStats">
            <div className="stat-item">
              <span className="stat-label">Total Memories</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Alerts</span>
              <span className="stat-value alert">{stats.alerts}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Equipment Types</span>
              <span className="stat-value">{stats.equipmentTypes}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
