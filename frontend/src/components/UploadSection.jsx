import React, { useState, useRef } from 'react';
import ProcessingStatus from './ProcessingStatus';
import apiClient from '../services/api';

const UploadSection = ({ onUploadComplete, onToast, showResults }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [processingStage, setProcessingStage] = useState('uploading');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    const maxSize = 500 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      onToast('Invalid file format. Please upload MP4, MOV, AVI, or MKV.', 'error');
      return false;
    }

    if (file.size > maxSize) {
      onToast(`File too large. Max 500MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`, 'error');
      return false;
    }

    return true;
  };

  const handleUpload = async (file) => {
    if (!validateFile(file)) return;

    setCurrentFile(file);
    setIsProcessing(true);
    setUploadProgress(10);
    setProcessingStage('uploading');

    try {
      const response = await apiClient.uploadVideo(file, (progress) => {
        const percentage = Math.min(90, Math.round(progress / 2 + 10));
        setUploadProgress(percentage);
      });

      console.log('✅ Upload response:', response);
      
      setUploadProgress(100);
      setProcessingStage('complete');
      
      onUploadComplete(response);
      
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentFile(null);
      }, 1000);
    } catch (error) {
      console.error('❌ Upload error:', error);
      onToast(`Upload failed: ${error.message}`, 'error');
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  if (showResults) return null;

  return (
    <section className="upload-section">
      <div className="section-header">
        <h2>Upload Security Footage</h2>
        <p className="section-description">Upload hospital security footage to detect and track equipment</p>
      </div>

      {isProcessing ? (
        <ProcessingStatus 
          stage={processingStage}
          progress={uploadProgress}
          fileName={currentFile?.name}
          fileSize={currentFile?.size}
        />
      ) : (
        <div 
          className="upload-area"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('drag-over');
          }}
          onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
            handleDrop(e);
          }}
        >
          <div className="upload-icon">📹</div>
          <h3>Drag & Drop Video Here</h3>
          <p>or</p>
          <button 
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Video File
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="video/*" 
            hidden
            onChange={handleFileSelect}
          />
          <p className="upload-help">Supports: MP4, MOV, AVI (Max 500MB)</p>
        </div>
      )}
    </section>
  );
};

export default UploadSection;
