import React, { useState, useRef } from 'react';
import ProcessingStatus from '../ProcessingStatus';
import apiClient from '../../services/api';
import { SuccessNotification, ErrorNotification, LoadingSpinner, UploadProgress } from '../Notifications';

const UploadTab = ({ onUploadComplete, onToast }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    const maxSize = 500 * 1024 * 1024;

    // Validate file type
    if (!validTypes.includes(file.type)) {
      setNotification({
        type: 'error',
        message: 'Invalid file format. Please use MP4, MOV, AVI, or MKV'
      });
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      setNotification({
        type: 'error',
        message: `File too large. Maximum 500MB allowed, you provided ${fileSizeMB}MB`
      });
      return;
    }

    setCurrentFile(file);
    setIsProcessing(true);
    setShowLoadingSpinner(true);
    setNotification(null); // Clear any previous notifications

    try {
      const response = await apiClient.uploadVideo(file, (progress) => {
        setUploadProgress(Math.min(90, Math.round(progress / 2 + 10)));
      });

      setUploadProgress(100);
      setShowLoadingSpinner(false);

      // Show success notification
      const detectionCount = response?.data?.detections?.length || 0;
      console.log('✅ Setting success notification:', detectionCount);
      
      setNotification({
        type: 'success',
        message: `Successfully detected ${detectionCount} equipment items`
      });

      // IMPORTANT: Call callback AFTER notification is set
      // This prevents any errors from interfering with notification display
      onUploadComplete(response);

      // Reset state after a delay to let user see the notification
      setTimeout(() => {
        console.log('🔄 Resetting state after notification');
        setIsProcessing(false);
        setCurrentFile(null);
        setUploadProgress(0);
      }, 1500);

    } catch (error) {
      // Only show error notification if upload itself fails
      setShowLoadingSpinner(false);
      setIsProcessing(false);
      
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Upload failed. Please try again.';
      
      console.error('❌ Upload error:', errorMessage);
      
      setNotification({
        type: 'error',
        message: errorMessage
      });

      // Reset file input
      setCurrentFile(null);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  return (
    <section className="upload-tab">
      {/* Loading Spinner */}
      {showLoadingSpinner && (
        <LoadingSpinner message="Processing video and detecting equipment..." />
      )}

      {/* Success/Error Notifications - ONLY show ONE */}
      {notification && (
        notification.type === 'success' ? (
          <SuccessNotification
            message={notification.message}
            onClose={() => {
              console.log('✓ Closing success notification');
              setNotification(null);
            }}
          />
        ) : (
          <ErrorNotification
            message={notification.message}
            onClose={() => {
              console.log('✕ Closing error notification');
              setNotification(null);
            }}
          />
        )
      )}

      {/* Header */}
      <div className="section-header">
        <h2>Upload Hospital Security Footage</h2>
        <p>Upload video to detect and track medical equipment in real-time</p>
      </div>

      {/* Main Content */}
      {isProcessing && currentFile ? (
        // Processing State - Show Upload Progress
        <div className="processing-state">
          <UploadProgress 
            progress={uploadProgress}
            filename={currentFile.name}
          />
          <ProcessingStatus 
            stage="uploading"
            progress={uploadProgress}
            fileName={currentFile?.name}
            fileSize={currentFile?.size}
          />
        </div>
      ) : (
        // Upload Area - Ready for upload
        <div 
          className="upload-area"
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload video file"
        >
          <div className="upload-content">
            <div className="upload-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M32 8L16 24M32 8L48 24M32 8V40M8 40H56M56 56H8V48M12 56L52 56"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 className="upload-title">Drag & Drop Your Video Here</h3>
            <p className="upload-subtitle">or click to browse your files</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => handleUpload(e.target.files?.[0])}
              aria-label="File input"
            />

            <div className="upload-requirements">
              <span className="requirement-badge">MP4</span>
              <span className="requirement-badge">MOV</span>
              <span className="requirement-badge">AVI</span>
              <span className="requirement-badge">MKV</span>
              <span className="requirement-text">Max 500MB</span>
            </div>

            <button
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              Browse Files
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="upload-info-box">
        <div className="info-item">
          <span className="info-icon">⚡</span>
          <div className="info-text">
            <strong>Fast Processing</strong>
            <p>Real-time equipment detection powered by Memories.ai LVMM</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">🔒</span>
          <div className="info-text">
            <strong>Secure & Private</strong>
            <p>Your footage is processed securely and not stored</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">📊</span>
          <div className="info-text">
            <strong>Detailed Reports</strong>
            <p>Get comprehensive analysis and history of all detections</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UploadTab;