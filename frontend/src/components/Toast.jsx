import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = { success: '✓', error: '✕', warning: '!', info: 'ℹ' };

  return (
    <div className={`toast ${type} fade-in`}>
      <span className="toast-icon">{icons[type]}</span>
      <div className="toast-content">
        <div className="toast-title">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;
