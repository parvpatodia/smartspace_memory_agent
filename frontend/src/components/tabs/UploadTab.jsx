
import React, { useState, useRef } from 'react';
import ProcessingStatus from '../ProcessingStatus';
import apiClient from '../../services/api';

const UploadTab = ({ onUploadComplete, onToast }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    const maxSize = 500 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      onToast('Invalid file format. Use MP4, MOV, AVI, or MKV', 'error');
      return;
    }

    if (file.size > maxSize) {
      onToast(`File too large. Max 500MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`, 'error');
      return;
    }

    setCurrentFile(file);
    setIsProcessing(true);

    try {
      const response = await apiClient.uploadVideo(file, (progress) => {
        setUploadProgress(Math.min(90, Math.round(progress / 2 + 10)));
      });

      setUploadProgress(100);
      setTimeout(() => {
        onUploadComplete(response);
        setIsProcessing(false);
        setCurrentFile(null);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      onToast(`Upload failed: ${error.message}`, 'error');
      setIsProcessing(false);
    }
  };

  return (
    <section className="upload-tab">
      <div className="section-header">
        <h2>📹 Upload Hospital Security Footage</h2>
        <p>Upload video to detect and track medical equipment</p>
      </div>

      {isProcessing ? (
        <ProcessingStatus 
          stage="uploading"
          progress={uploadProgress}
          fileName={currentFile?.name}
          fileSize={currentFile?.size}
        />
      ) : (
        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          <div className="upload-icon">📹</div>
          <h3>Drag & Drop Video</h3>
          <p>or click to select</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          <p className="upload-help">MP4, MOV, AVI • Max 500MB</p>
        </div>
      )}
    </section>
  );
};

export default UploadTab;
