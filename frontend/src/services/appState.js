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
            isProcessing: false
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
}

export default new AppState();
