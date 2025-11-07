const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class APIClient {
    constructor() {
        this.baseURL = API_URL;
        this.timeout = 30000;
    }

    async uploadVideo(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Upload failed')));
            xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

            xhr.open('POST', `${this.baseURL}/upload`);
            xhr.send(formData);
        });
    }

    async fetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async isHealthy() {
        try {
            await this.fetch('/memory/stats');
            return true;
        } catch {
            return false;
        }
    }

    // Add these methods to the APIClient class in api.js

    async associateDetections(detections, surge = false) {
        return this.fetch('/track/associate', {
            method: 'POST',
            body: {
                detections: detections,
                surge: surge
            }
        });
    }

    async getTracks() {
        return this.fetch('/track/tracks');
    }

    async getTrack(trackId) {
        return this.fetch(`/track/tracks/${trackId}`);
    }

    async getTopology() {
        return this.fetch('/track/topology');
    }

    async reconcileTrack(trackId, action) {
        return this.fetch(`/track/reconcile/${trackId}?action=${action}`, {
            method: 'POST'
        });
    }

    async getTrackingAnalytics() {
        return this.fetch('/track/analytics');
    }

    async acknowledgeAlert(alertId) {
        return this.fetch(`/alerts/${alertId}/acknowledge`, {
            method: 'POST',
            body: {}
        });
    }
    
    async dismissAlert(alertId) {
        return this.fetch(`/alerts/${alertId}/dismiss`, {
            method: 'POST',
            body: {}
        });
    }


}


export default new APIClient();
