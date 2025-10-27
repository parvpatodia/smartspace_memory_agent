import React from 'react';

const ProcessingStatus = ({ stage, progress, fileName, fileSize }) => {
  const stages = {
    'uploading': 'Uploading video...',
    'processing': 'Processing with Memories.ai...',
    'analyzing': 'Analyzing for equipment...',
    'complete': 'Complete!'
  };

  return (
    <div className="processing-status fade-in">
      <div className="status-header">
        <div className="spinner"></div>
        <div className="status-info">
          <h3>{stages[stage] || 'Processing...'}</h3>
          <p>{stage.charAt(0).toUpperCase() + stage.slice(1)}</p>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="status-details">
        <p><strong>File:</strong> <span>{fileName}</span></p>
        <p><strong>Size:</strong> <span>{(fileSize / 1024 / 1024).toFixed(2)} MB</span></p>
        <p><strong>Progress:</strong> <span>{progress}%</span></p>
      </div>
    </div>
  );
};

export default ProcessingStatus;
