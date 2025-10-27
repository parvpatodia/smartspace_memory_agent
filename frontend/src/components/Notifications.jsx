import React from 'react';

export const LoadingSpinner = ({ message = "Processing..." }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="spinner-text">{message}</p>
      </div>
    </div>
  );
};

/**
 * Success notification component
 * Shows celebratory feedback after successful upload
 */
export const SuccessNotification = ({ message, onClose }) => {
  React.useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="success-notification animated-in">
      <div className="success-content">
        <span className="success-icon">✓</span>
        <span className="success-message">{message}</span>
        <button 
          className="notification-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Error notification component
 * Shows errors professionally instead of browser alerts
 */
export const ErrorNotification = ({ message, onClose }) => {
  React.useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="error-notification animated-in">
      <div className="error-content">
        <span className="error-icon">✕</span>
        <div className="error-text">
          <span className="error-title">Error</span>
          <span className="error-message">{message}</span>
        </div>
        <button 
          className="notification-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Empty state component
 * Shows professional empty state when no data
 */
export const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <button className="empty-state-action">{action}</button>
      )}
    </div>
  );
};

/**
 * Upload progress component
 * Shows file upload percentage
 */
export const UploadProgress = ({ progress, filename }) => {
  return (
    <div className="upload-progress">
      <div className="progress-info">
        <span className="progress-filename">{filename}</span>
        <span className="progress-percentage">{progress}%</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};