// ========================================
// REAL-TIME DATA SYNCHRONIZATION
// ========================================

class RealtimeSync {
    constructor() {
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.syncInterval = null;
        this.setupOnlineOfflineHandlers();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async initialize() {
        try {
            // Start sync process
            this.startSyncProcess();
            
            // Setup conflict resolution
            this.setupConflictResolution();
            
            console.log('✅ RealtimeSync initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing RealtimeSync:', error);
        }
    }

    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('🟢 Connection restored - Syncing data', 'success');
            this.processSyncQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('🔴 Connection lost - Data will sync when online', 'warning');
        });
    }

    // ========================================
    // SYNC PROCESS
    // ========================================

    startSyncProcess() {
        // Process sync queue every 5 seconds
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.processSyncQueue();
            }
        }, 5000);

        // Process sync queue immediately
        this.processSyncQueue();
    }

    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        console.log(`🔄 Processing ${this.syncQueue.length} sync items...`);

        const itemsToProcess = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of itemsToProcess) {
            try {
                await this.syncItem(item);
            } catch (error) {
                console.error('Error syncing item:', error);
                // Re-add to queue if it's a network error
                if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                    this.syncQueue.push(item);
                }
            }
        }
    }

    async syncItem(item) {
        const { type, action, data, timestamp } = item;

        switch (type) {
            case 'appointment':
                await this.syncAppointment(action, data);
                break;
            case 'patient':
                await this.syncPatient(action, data);
                break;
            case 'service':
                await this.syncService(action, data);
                break;
            case 'treatment':
                await this.syncTreatment(action, data);
                break;
            case 'payment':
                await this.syncPayment(action, data);
                break;
            default:
                console.warn('Unknown sync item type:', type);
        }
    }

    // ========================================
    // SPECIFIC SYNC METHODS
    // ========================================

    async syncAppointment(action, data) {
        if (!window.firebase || !window.firebase.firestore) return;

        const db = window.firebase.firestore();
        const auth = window.firebase.auth();
        const user = auth.currentUser;

        if (!user) return;

        switch (action) {
            case 'create':
                await db.collection('appointments').add({
                    ...data,
                    patientId: user.uid,
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'update':
                await db.collection('appointments').doc(data.id).update({
                    ...data,
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'delete':
                await db.collection('appointments').doc(data.id).delete();
                break;
        }
    }

    async syncPatient(action, data) {
        if (!window.firebase || !window.firebase.firestore) return;

        const db = window.firebase.firestore();

        switch (action) {
            case 'create':
                await db.collection('users').add({
                    ...data,
                    role: 'patient',
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'update':
                await db.collection('users').doc(data.id).update({
                    ...data,
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'delete':
                await db.collection('users').doc(data.id).delete();
                break;
        }
    }

    async syncService(action, data) {
        if (!window.firebase || !window.firebase.firestore) return;

        const db = window.firebase.firestore();

        switch (action) {
            case 'create':
                await db.collection('services').add({
                    ...data,
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'update':
                await db.collection('services').doc(data.id).update({
                    ...data,
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'delete':
                await db.collection('services').doc(data.id).delete();
                break;
        }
    }

    async syncTreatment(action, data) {
        if (!window.firebase || !window.firebase.firestore) return;

        const db = window.firebase.firestore();
        const auth = window.firebase.auth();
        const user = auth.currentUser;

        if (!user) return;

        switch (action) {
            case 'create':
                await db.collection('treatments').add({
                    ...data,
                    patientId: user.uid,
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'update':
                await db.collection('treatments').doc(data.id).update({
                    ...data,
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'delete':
                await db.collection('treatments').doc(data.id).delete();
                break;
        }
    }

    async syncPayment(action, data) {
        if (!window.firebase || !window.firebase.firestore) return;

        const db = window.firebase.firestore();
        const auth = window.firebase.auth();
        const user = auth.currentUser;

        if (!user) return;

        switch (action) {
            case 'create':
                await db.collection('payments').add({
                    ...data,
                    patientId: user.uid,
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'update':
                await db.collection('payments').doc(data.id).update({
                    ...data,
                    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
                break;
            case 'delete':
                await db.collection('payments').doc(data.id).delete();
                break;
        }
    }

    // ========================================
    // QUEUE MANAGEMENT
    // ========================================

    addToSyncQueue(type, action, data) {
        const syncItem = {
            type,
            action,
            data,
            timestamp: Date.now(),
            id: `${type}-${action}-${Date.now()}`
        };

        this.syncQueue.push(syncItem);
        
        // Save to localStorage as backup
        this.saveSyncQueueToLocalStorage();
        
        console.log(`📝 Added to sync queue: ${type} ${action}`);
    }

    saveSyncQueueToLocalStorage() {
        try {
            localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('Error saving sync queue to localStorage:', error);
        }
    }

    loadSyncQueueFromLocalStorage() {
        try {
            const saved = localStorage.getItem('syncQueue');
            if (saved) {
                this.syncQueue = JSON.parse(saved);
                console.log(`📥 Loaded ${this.syncQueue.length} items from sync queue`);
            }
        } catch (error) {
            console.error('Error loading sync queue from localStorage:', error);
        }
    }

    // ========================================
    // CONFLICT RESOLUTION
    // ========================================

    setupConflictResolution() {
        // Load sync queue on startup
        this.loadSyncQueueFromLocalStorage();
        
        // Setup conflict resolution strategies
        this.conflictStrategies = {
            appointment: 'server-wins',
            patient: 'server-wins',
            service: 'server-wins',
            treatment: 'server-wins',
            payment: 'server-wins'
        };
    }

    async resolveConflict(localData, serverData, type) {
        const strategy = this.conflictStrategies[type] || 'server-wins';
        
        switch (strategy) {
            case 'server-wins':
                return serverData;
            case 'client-wins':
                return localData;
            case 'merge':
                return this.mergeData(localData, serverData);
            case 'timestamp':
                return this.resolveByTimestamp(localData, serverData);
            default:
                return serverData;
        }
    }

    mergeData(localData, serverData) {
        // Simple merge strategy - prefer non-null values
        const merged = { ...serverData };
        
        Object.keys(localData).forEach(key => {
            if (localData[key] !== null && localData[key] !== undefined) {
                merged[key] = localData[key];
            }
        });
        
        return merged;
    }

    resolveByTimestamp(localData, serverData) {
        const localTime = localData.updatedAt || localData.createdAt || 0;
        const serverTime = serverData.updatedAt || serverData.createdAt || 0;
        
        return localTime > serverTime ? localData : serverData;
    }

    // ========================================
    // REAL-TIME UPDATES
    // ========================================

    setupRealtimeUpdates() {
        if (!window.firebase || !window.firebase.firestore) return;

        const db = window.firebase.firestore();
        const auth = window.firebase.auth();
        
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.setupUserRealtimeUpdates(user.uid);
            }
        });
    }

    setupUserRealtimeUpdates(userId) {
        const db = window.firebase.firestore();
        
        // Listen for appointment updates
        db.collection('appointments')
            .where('patientId', '==', userId)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(change => {
                    this.handleRealtimeChange('appointment', change);
                });
            });

        // Listen for treatment updates
        db.collection('treatments')
            .where('patientId', '==', userId)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(change => {
                    this.handleRealtimeChange('treatment', change);
                });
            });

        // Listen for payment updates
        db.collection('payments')
            .where('patientId', '==', userId)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(change => {
                    this.handleRealtimeChange('payment', change);
                });
            });
    }

    handleRealtimeChange(type, change) {
        const { doc, type: changeType } = change;
        const data = { id: doc.id, ...doc.data() };

        switch (changeType) {
            case 'added':
                this.handleDataAdded(type, data);
                break;
            case 'modified':
                this.handleDataModified(type, data);
                break;
            case 'removed':
                this.handleDataRemoved(type, data);
                break;
        }
    }

    handleDataAdded(type, data) {
        console.log(`➕ ${type} added:`, data);
        this.showToast(`New ${type} added`, 'success');
        
        // Update local storage
        this.updateLocalStorage(type, data, 'add');
        
        // Trigger UI update
        this.triggerUIUpdate(type);
    }

    handleDataModified(type, data) {
        console.log(`✏️ ${type} modified:`, data);
        this.showToast(`${type} updated`, 'info');
        
        // Update local storage
        this.updateLocalStorage(type, data, 'update');
        
        // Trigger UI update
        this.triggerUIUpdate(type);
    }

    handleDataRemoved(type, data) {
        console.log(`🗑️ ${type} removed:`, data);
        this.showToast(`${type} deleted`, 'warning');
        
        // Update local storage
        this.updateLocalStorage(type, data, 'remove');
        
        // Trigger UI update
        this.triggerUIUpdate(type);
    }

    updateLocalStorage(type, data, action) {
        const key = `patient${type.charAt(0).toUpperCase() + type.slice(1)}s`;
        let items = JSON.parse(localStorage.getItem(key) || '[]');
        
        switch (action) {
            case 'add':
                items.push(data);
                break;
            case 'update':
                const index = items.findIndex(item => item.id === data.id);
                if (index !== -1) {
                    items[index] = data;
                }
                break;
            case 'remove':
                items = items.filter(item => item.id !== data.id);
                break;
        }
        
        localStorage.setItem(key, JSON.stringify(items));
    }

    triggerUIUpdate(type) {
        // Trigger custom events for UI updates
        const event = new CustomEvent(`${type}Updated`, {
            detail: { type, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========================================
    // PUBLIC API
    // ========================================

    async start() {
        await this.initialize();
        this.setupRealtimeUpdates();
    }

    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    getStats() {
        return {
            queueLength: this.syncQueue.length,
            isOnline: this.isOnline,
            lastSync: this.lastSyncTime
        };
    }
}

// ========================================
// GLOBAL REALTIME SYNC
// ========================================

// Create global realtime sync
window.realtimeSync = new RealtimeSync();

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.realtimeSync.start();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeSync;
}
