import React, { useState, useEffect } from 'react';

const HistoryTab = ({ uploadHistory, setUploadHistory }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ Fetch history when component mounts
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/history');
      const result = await response.json();
      
      if (result.success && result.data) {
        setUploadHistory(result.data);
        console.log(`✅ Loaded ${result.data.length} history records`);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const getFilteredHistory = () => {
    let filtered = uploadHistory || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item?.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.video_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => {
        const alertCount = item?.alerts || 0;
        if (filter === 'critical') return alertCount > 0;
        if (filter === 'warning') return item?.detections > 2;
        if (filter === 'success') return alertCount === 0;
        return true;
      });
    }

    // Sort logic
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b?.timestamp) - new Date(a?.timestamp));
    } else if (sortBy === 'size') {
      filtered.sort((a, b) => (b?.size || 0) - (a?.size || 0));
    } else if (sortBy === 'detections') {
      filtered.sort((a, b) => (b?.detections || 0) - (a?.detections || 0));
    }

    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (item) => {
    const alerts = item?.alerts || 0;
    if (alerts > 0) {
      return { status: 'CRITICAL', color: 'critical', icon: '⚠' };
    }
    if ((item?.detections || 0) > 2) {
      return { status: 'WARNING', color: 'warning', icon: '⚡' };
    }
    return { status: 'NORMAL', color: 'success', icon: '✓' };
  };

  // Calculate stats
  const totalUploads = uploadHistory?.length || 0;
  const criticalCount = uploadHistory?.filter(item => (item?.alerts || 0) > 0).length || 0;
  const totalDetections = uploadHistory?.reduce((sum, item) => sum + (item?.detections || 0), 0) || 0;
  const avgSize = totalUploads > 0
    ? (uploadHistory.reduce((sum, item) => sum + (item?.size || 0), 0) / totalUploads)
    : 0;

  if (loading) {
    return (
      <section className="history-tab">
        <div className="no-history">
          <p>Loading history...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="history-tab">
      {/* Header */}
      <div className="history-header">
        <h2>Upload History</h2>
        <p>Complete timeline of all video uploads and detections</p>
      </div>

      {/* Stats Bar */}
      <div className="history-stats-bar">
        <div className="history-stat">
          <span className="stat-icon">📹</span>
          <div className="stat-content">
            <span className="stat-label">Total Uploads</span>
            <span className="stat-value">{totalUploads}</span>
          </div>
        </div>
        <div className="history-stat">
          <span className="stat-icon">🎯</span>
          <div className="stat-content">
            <span className="stat-label">Total Detections</span>
            <span className="stat-value">{totalDetections}</span>
          </div>
        </div>
        <div className="history-stat">
          <span className="stat-icon">⚠️</span>
          <div className="stat-content">
            <span className="stat-label">Critical Sessions</span>
            <span className="stat-value critical-value">{criticalCount}</span>
          </div>
        </div>
        <div className="history-stat">
          <span className="stat-icon">💾</span>
          <div className="stat-content">
            <span className="stat-label">Avg. File Size</span>
            <span className="stat-value">{formatFileSize(avgSize)}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="history-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by filename or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
              <option value="all">All Sessions</option>
              <option value="critical">Critical Alerts</option>
              <option value="warning">Multiple Detections</option>
              <option value="success">Normal</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="date">Most Recent</option>
              <option value="size">File Size</option>
              <option value="detections">Detection Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="history-container">
        {filteredHistory.length > 0 ? (
          <div className="history-table">
            <div className="table-header">
              <div className="col-status">Status</div>
              <div className="col-filename">File Name</div>
              <div className="col-timestamp">Upload Time</div>
              <div className="col-size">Size</div>
              <div className="col-detections">Detections</div>
              <div className="col-alerts">Alerts</div>
              <div className="col-actions">Actions</div>
            </div>

            {filteredHistory.map((item, idx) => {
              const badge = getStatusBadge(item);
              return (
                <div key={idx} className="table-row">
                  <div className="col-status">
                    <span className={`status-badge ${badge.color}`}>
                      {badge.icon} {badge.status}
                    </span>
                  </div>

                  <div className="col-filename">
                    <div className="filename-info">
                      <span className="filename">{item?.filename || 'Unknown'}</span>
                      <span className="video-id">{item?.video_id?.slice(0, 12)}...</span>
                    </div>
                  </div>

                  <div className="col-timestamp">
                    <span className="timestamp">{formatTime(item?.timestamp)}</span>
                  </div>

                  <div className="col-size">
                    <span className="size">{formatFileSize(item?.size)}</span>
                  </div>

                  <div className="col-detections">
                    <span className="detection-badge">{item?.detections || 0}</span>
                  </div>

                  <div className="col-alerts">
                    <span className={`alert-badge ${item?.alerts > 0 ? 'has-alerts' : 'no-alerts'}`}>
                      {item?.alerts || 0}
                    </span>
                  </div>

                  <div className="col-actions">
                    <button className="action-btn view" title="View Details">
                      👁️
                    </button>
                    <button className="action-btn download" title="Download Report">
                      ⬇️
                    </button>
                    <button className="action-btn delete" title="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-history">
            <div className="no-history-icon">📭</div>
            <h3>No Upload History</h3>
            <p>
              {searchTerm || filter !== 'all'
                ? 'No uploads match your search or filter criteria.'
                : 'Start by uploading a video to see history here.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {filteredHistory.length > 0 && (
        <div className="history-pagination">
          <span className="pagination-info">
            Showing {filteredHistory.length} of {totalUploads} uploads
          </span>
        </div>
      )}

      {/* Detailed Stats Section */}
      <div className="history-insights">
        <h3>Session Insights</h3>

        <div className="insights-grid">
          <div className="insight-card">
            <h4>Most Recent Upload</h4>
            {uploadHistory && uploadHistory.length > 0 ? (
              <div className="insight-content">
                <p className="filename">{uploadHistory[0]?.filename}</p>
                <p className="timestamp">{formatTime(uploadHistory[0]?.timestamp)}</p>
                <p className="stat">{uploadHistory[0]?.detections || 0} detections</p>
              </div>
            ) : (
              <p className="no-data">No uploads yet</p>
            )}
          </div>

          <div className="insight-card">
            <h4>Largest File</h4>
            {uploadHistory && uploadHistory.length > 0 ? (() => {
              const largest = uploadHistory.reduce((max, item) => 
                (item?.size || 0) > (max?.size || 0) ? item : max
              );
              return (
                <div className="insight-content">
                  <p className="filename">{largest?.filename}</p>
                  <p className="stat">{formatFileSize(largest?.size)}</p>
                  <p className="timestamp">{formatTime(largest?.timestamp)}</p>
                </div>
              );
            })() : (
              <p className="no-data">No uploads yet</p>
            )}
          </div>

          <div className="insight-card">
            <h4>Most Detections</h4>
            {uploadHistory && uploadHistory.length > 0 ? (() => {
              const mostDetections = uploadHistory.reduce((max, item) =>
                (item?.detections || 0) > (max?.detections || 0) ? item : max
              );
              return (
                <div className="insight-content">
                  <p className="filename">{mostDetections?.filename}</p>
                  <p className="stat">{mostDetections?.detections || 0} equipment items</p>
                  <p className="timestamp">{formatTime(mostDetections?.timestamp)}</p>
                </div>
              );
            })() : (
              <p className="no-data">No uploads yet</p>
            )}
          </div>

          <div className="insight-card">
            <h4>Critical Sessions</h4>
            {criticalCount > 0 ? (
              <div className="insight-content">
                <p className="stat critical-stat">{criticalCount} sessions with alerts</p>
                <p className="percentage">
                  {((criticalCount / totalUploads) * 100).toFixed(1)}% of all uploads
                </p>
                <p className="recommendation">Review critical sessions</p>
              </div>
            ) : (
              <p className="no-data">No critical sessions</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistoryTab;