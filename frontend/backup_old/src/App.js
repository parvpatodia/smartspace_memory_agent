import React, { useState, useEffect } from 'react';
import './healthcare-theme.css';
import UploadModal from './components/uploadModal';  // ← Add this

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [stats, setStats] = useState(null);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false); 
  const [lastUploadResult, setLastUploadResult] = useState(null); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/memory/stats`);
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch equipment types
      const equipResponse = await fetch(`${API_BASE_URL}/api/memory/equipment-types`);
      if (!equipResponse.ok) throw new Error('Failed to fetch equipment types');
      const equipData = await equipResponse.json();
      setEquipmentTypes(equipData.equipment_types || []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setLastUploadResult(result);
    
    // Show success message
    alert(` Upload successful!\n\n` +
          `Video ID: ${result.video_id}\n` +
          `Equipment detected: ${result.summary.total_detections}\n` +
          `Alerts generated: ${result.summary.alerts_generated}\n` +
          `Critical alerts: ${result.summary.critical_alerts}`);
    
    // Refresh data to show new memories
    fetchData();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading MediTrack...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <h2 style={{ color: 'var(--critical)' }}>⚠️ Error</h2>
        <p>Failed to connect to backend: {error}</p>
        <p>Make sure the backend server is running on port 8000</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* Header */}
      <header className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem' }}>
              🏥 MediTrack
            </h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
              Hospital Equipment Intelligence System
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              System Status
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
              ✅ Online
            </div>
          </div>
        </div>
      </header>

      {/* Mock Alert - Will replace with real alerts later */}
      <div style={{ marginBottom: '24px' }}>
        <div className="alert-banner alert-banner-critical">
          <div style={{ fontSize: '1.5rem' }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>
              DEMO ALERT: Critical Equipment Movement Detected
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              Crash cart detected in unusual location. This is a demo alert - will show real alerts when equipment is tracked.
            </div>
          </div>
          <span className="badge-critical">CRITICAL</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="stat-card">
          <div className="stat-label">Total Observations</div>
          <div className="stat-value">{stats?.total_object_memories || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '4px' }}>
            Equipment sightings tracked
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Tracked Equipment</div>
          <div className="stat-value">{stats?.tracked_objects || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '4px' }}>
            Unique equipment items
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Equipment Categories</div>
          <div className="stat-value">{equipmentTypes.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '4px' }}>
            Types being monitored
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Potential Savings</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            $1.2M
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '4px' }}>
            Annually per hospital
          </div>
        </div>
      </div>

      {/* Equipment Types Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--gray-800)', fontSize: '1.5rem' }}>
          🏥 Monitored Equipment Types
        </h2>
        
        {equipmentTypes.length === 0 ? (
          <div style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '8px', 
            textAlign: 'center',
            boxShadow: 'var(--shadow)'
          }}>
            <p style={{ color: 'var(--gray-600)', fontSize: '1.1rem' }}>
              No equipment types defined yet. The system is ready to track 7 types of medical equipment.
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {equipmentTypes.map((equipment, index) => (
              <div 
                key={index} 
                className={`equipment-card equipment-card-${
                  equipment.category === 'critical' ? 'critical' : 
                  equipment.category === 'high' ? 'high' : 
                  'standard'
                }`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', textTransform: 'capitalize' }}>
                    {equipment.name.replace(/_/g, ' ')}
                  </h3>
                  <span className={`badge-${
                    equipment.category === 'critical' ? 'critical' : 
                    equipment.category === 'high' ? 'high-priority' : 
                    'standard'
                  }`}>
                    {equipment.category}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '8px' }}>
                  <strong>Typical Locations:</strong>
                  <div style={{ marginTop: '4px' }}>
                    {equipment.typical_locations.join(', ')}
                  </div>
                </div>
                
                {equipment.replacement_cost && (
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--gray-800)', 
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    💰 Cost: ${equipment.replacement_cost.toLocaleString()}
                  </div>
                )}
                
                {equipment.alert_on_movement && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: 'var(--critical-bg)', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--critical)',
                    fontWeight: '600'
                  }}>
                    🔔 Movement alerts enabled
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--gray-800)', fontSize: '1.5rem' }}>
          ⚡ Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
            📹 Upload Security Footage
          </button>
          <button className="btn-primary" onClick={() => alert('Search feature coming soon!')}>
            🔍 Search Equipment
          </button>
          <button className="btn-primary" onClick={() => alert('Analytics feature coming soon!')}>
            📊 View Analytics
          </button>
          <button className="btn-primary" onClick={fetchData}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        marginTop: '48px', 
        padding: '24px 0', 
        textAlign: 'center',
        color: 'var(--gray-600)',
        fontSize: '0.875rem',
        borderTop: '1px solid var(--gray-100)'
      }}>
        <p style={{ fontWeight: '600', marginBottom: '8px' }}>
          MediTrack - Hospital Equipment Intelligence System
        </p>
        <p>
          Powered by AI • Preventing $1-2M in annual equipment loss per hospital
        </p>
        <p style={{ marginTop: '8px', fontSize: '0.75rem' }}>
          Built for Memories.ai Hackathon 2025
        </p>
      </footer>
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />

    </div>
  );
}

export default App;
