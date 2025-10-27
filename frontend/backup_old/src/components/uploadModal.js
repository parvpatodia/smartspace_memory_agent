import React, { useState } from 'react';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadStatus('Uploading video...');

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload to backend
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      setUploadStatus('Processing complete!');
      
      // Wait a moment to show success, then close
      setTimeout(() => {
        onUploadSuccess(result);
        onClose();
        // Reset state
        setSelectedFile(null);
        setUploadStatus(null);
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message}`);
      setUploadStatus(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setError(null);
      setUploadStatus(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', color: 'var(--gray-800)' }}>
          📹 Upload Security Footage
        </h2>

        {/* File Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: 'var(--gray-700)',
          }}>
            Select Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed var(--gray-300)',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          />
          {selectedFile && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: 'var(--gray-100)',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}>
              📁 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        {/* Status Messages */}
        {uploadStatus && (
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {uploading && <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>}
            {uploadStatus}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--gray-50)',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '0.875rem',
          color: 'var(--gray-600)',
        }}>
          <strong>What happens next:</strong>
          <ol style={{ marginTop: '8px', marginLeft: '20px' }}>
            <li>Video is analyzed by AI</li>
            <li>Equipment is detected and identified</li>
            <li>Memories are created with locations</li>
            <li>Alerts generated for unusual placements</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            disabled={uploading}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid var(--gray-300)',
              backgroundColor: 'white',
              color: 'var(--gray-700)',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn-primary"
            style={{
              opacity: (!selectedFile || uploading) ? 0.5 : 1,
              cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : 'Upload & Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
