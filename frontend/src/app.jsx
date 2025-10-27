/**
 * COMPLETE REDESIGNED APP.JSX
 * Professional healthcare equipment tracking dashboard
 * With analytics, tabs, upload management, and real features
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import UploadTab from './components/tabs/UploadTab';
import DashboardTab from './components/tabs/DashboardTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import HistoryTab from './components/tabs/HistoryTab';
import AlertsTab from './components/tabs/AlertsTab';
import Toast from './components/Toast';
import appState from './services/appState';
import apiClient from './services/api';
import './styles/main.css';
import './styles/components.css';
import './styles/healthcare.css';

const getInitialStats = () => ({
  total: 0,
  alerts: 0,
  equipmentTypes: 0,
  distribution: [],
  critical: [],
  recent: []
});

function App() {
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState(appState.getState());
  const [toasts, setToasts] = useState([]);
  const [stats, setStats] = useState(getInitialStats());
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [uploadHistory, setUploadHistory] = useState([]);

  // ===== EFFECTS =====

  useEffect(() => {
    const unsubscribe = appState.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    apiClient.isHealthy()
      .then(setIsBackendHealthy)
      .catch(() => setIsBackendHealthy(false));
  }, []);

  useEffect(() => {
    try {
      const currentStats = appState.getStats();
      const safeStats = {
        total: currentStats?.total || 0,
        alerts: currentStats?.alerts || 0,
        equipmentTypes: currentStats?.equipmentTypes || 0,
        distribution: Array.isArray(currentStats?.distribution) ? currentStats.distribution : [],
        critical: Array.isArray(currentStats?.critical) ? currentStats.critical : [],
        recent: Array.isArray(currentStats?.recent) ? currentStats.recent : []
      };
      setStats(safeStats);
    } catch (error) {
      console.error('Error updating stats:', error);
      setStats(getInitialStats());
    }
  }, [state]);

  // ===== TOAST MANAGEMENT =====

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ===== HANDLERS =====

  const handleUploadComplete = (response) => {
    try {
      if (!response || !Array.isArray(response.detections)) {
        throw new Error('Invalid response format');
      }

      // Add to history
      const uploadRecord = {
        id: Date.now(),
        fileName: response.detections[0]?.fileName || 'Unknown',
        timestamp: new Date().toISOString(),
        detectionCount: response.detections.length,
        alerts: response.summary?.alerts_generated || 0,
        detections: response.detections
      };
      
      setUploadHistory(prev => [uploadRecord, ...prev].slice(0, 50));

      // Add to memory
      appState.addMemories(response.detections);

      // Show success
      addToast(
        `✅ Detected ${response.detections.length} object(s). ${response.summary?.alerts_generated || 0} alert(s).`,
        'success'
      );

      // Go to dashboard
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error handling upload:', error);
      addToast('Error processing results', 'error');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Delete all memories? This cannot be undone.')) {
      appState.clearMemories();
      setUploadHistory([]);
      addToast('All data cleared', 'info');
    }
  };

  const handleExportData = () => {
    try {
      const data = appState.exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memoryguard_export_${Date.now()}.json`;
      a.click();
      addToast('✅ Data exported successfully', 'success');
    } catch (error) {
      addToast('Error exporting data', 'error');
    }
  };

  // ===== RENDER =====

  return (
    <div className="app">
      <Header stats={stats} />

      {/* Tab Navigation */}
      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
      />

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <UploadTab onUploadComplete={handleUploadComplete} onToast={addToast} />
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <DashboardTab 
              stats={stats}
              onRefresh={() => setState(appState.getState())}
              onExport={handleExportData}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsTab stats={stats} uploadHistory={uploadHistory} />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <HistoryTab uploadHistory={uploadHistory} />
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <AlertsTab 
              critical={stats.critical}
              onClear={handleClearAll}
            />
          )}
        </div>
      </main>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
