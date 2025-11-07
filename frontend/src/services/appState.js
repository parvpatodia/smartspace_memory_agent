class AppState {
    constructor() {
        this.listeners = [];
        this.state = {
            memories: [],
            currentUpload: null,
            stats: {
                totalMemories: 0,
                activeAlerts: 0,
                equipmentTypes: new Set()
            },
            isProcessing: false,
        // Tracking state
        tracks: [],
        trackingAnalytics: {
        totalTracks: 0,
        avgConfidence: 0,
        highConfidenceCount: 0,
        needsReviewCount: 0
        },
        topology: {
            nodes: [],
            edges: []
        }
        };
        this.loadFromStorage();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    addMemories(memoryArray) {
        memoryArray.forEach(memory => {
            memory.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            memory.createdAt = new Date().toISOString();
            this.state.memories.unshift(memory);
        });
        this.updateStats();
        this.saveToStorage();
        this.notify();
    }

    clearMemories() {
        this.state.memories = [];
        this.updateStats();
        this.saveToStorage();
        this.notify();
    }

    updateStats() {
        this.state.stats.totalMemories = this.state.memories.length;
        this.state.stats.activeAlerts = this.state.memories.filter(m => 
            m.alert && m.alert.severity === 'critical'
        ).length;
        this.state.stats.equipmentTypes = new Set(
            this.state.memories.map(m => m.name)
        );
    }

    getStats() {
        const distribution = {};
        this.state.memories.forEach(m => {
            distribution[m.name] = (distribution[m.name] || 0) + 1;
        });

        return {
            total: this.state.stats.totalMemories,
            alerts: this.state.stats.activeAlerts,
            equipmentTypes: this.state.stats.equipmentTypes.size,
            distribution: Object.entries(distribution)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            critical: this.state.memories.filter(m => 
                m.alert && m.alert.severity === 'critical'
            ),
            recent: this.state.memories.slice(0, 10)
        };
    }

    saveToStorage() {
        try {
            localStorage.setItem('memoryguard_state', JSON.stringify({
                memories: this.state.memories,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('memoryguard_state');
            if (data) {
                const parsed = JSON.parse(data);
                this.state.memories = parsed.memories || [];
                this.updateStats();
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }

    getState() {
        return this.state;
    }


    addTracks(trackArray) {
        this.state.tracks = trackArray || [];
        this.updateTrackingStats();
        this.saveToStorage();
        this.notify();
    }
    
    updateTrackingStats() {
        if (!this.state.tracks.length) {
            this.state.trackingAnalytics = {
                totalTracks: 0,
                avgConfidence: 0,
                highConfidenceCount: 0,
                needsReviewCount: 0
            };
            return;
        }
    
        const confidences = this.state.tracks.map(t => t.confidence);
        this.state.trackingAnalytics = {
            totalTracks: this.state.tracks.length,
            avgConfidence: (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(3),
            highConfidenceCount: confidences.filter(c => c > 0.85).length,
            needsReviewCount: this.state.tracks.filter(t => t.status === 'needs_review').length
        };
    }
    
    setTopology(topology) {
        this.state.topology = topology || { nodes: [], edges: [] };
        this.notify();
    }
    
    getTracks() {
        return this.state.tracks;
    }
    
    getTrackingStats() {
        return this.state.trackingAnalytics;
    }
    
    // Update saveToStorage to include tracks
    saveToStorage() {
        try {
            localStorage.setItem('memoryguard_state', JSON.stringify({
                memories: this.state.memories,
                tracks: this.state.tracks,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }
    
    // Update loadFromStorage to include tracks
    loadFromStorage() {
        try {
            const data = localStorage.getItem('memoryguard_state');
            if (data) {
                const parsed = JSON.parse(data);
                this.state.memories = parsed.memories || [];
                this.state.tracks = parsed.tracks || [];
                this.updateStats();
                this.updateTrackingStats();
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }    
}

export default new AppState();
