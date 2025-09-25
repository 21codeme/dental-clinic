// ========================================
// REAL-TIME NOTIFICATION SYSTEM
// ========================================

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.soundEnabled = true;
        this.desktopNotificationsEnabled = false;
        this.setupNotificationPermission();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async initialize() {
        try {
            // Request notification permission
            await this.requestNotificationPermission();
            
            // Setup notification UI
            this.setupNotificationUI();
            
            // Setup notification sounds
            this.setupNotificationSounds();
            
            // Start listening for notifications
            this.startNotificationListener();
            
            console.log('✅ NotificationSystem initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing NotificationSystem:', error);
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.desktopNotificationsEnabled = permission === 'granted';
            
            if (this.desktopNotificationsEnabled) {
                this.showToast('🔔 Desktop notifications enabled!', 'success');
            } else {
                this.showToast('🔕 Desktop notifications disabled', 'info');
            }
        }
    }

    setupNotificationUI() {
        // Create notification panel
        this.createNotificationPanel();
        
        // Create notification bell
        this.createNotificationBell();
        
        // Setup notification styles
        this.setupNotificationStyles();
    }

    createNotificationPanel() {
        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-header">
                <h3>🔔 Notifications</h3>
                <button class="close-panel" onclick="notificationSystem.closePanel()">×</button>
            </div>
            <div class="notification-list" id="notificationList">
                <div class="loading">Loading notifications...</div>
            </div>
            <div class="notification-actions">
                <button class="btn btn-sm" onclick="notificationSystem.markAllAsRead()">Mark All Read</button>
                <button class="btn btn-sm btn-secondary" onclick="notificationSystem.clearAll()">Clear All</button>
            </div>
        `;
        
        document.body.appendChild(panel);
    }

    createNotificationBell() {
        // Find existing header or create one
        let header = document.querySelector('.header, .dashboard-header, .main-header');
        if (!header) {
            header = document.querySelector('header') || document.body;
        }
        
        const bell = document.createElement('div');
        bell.className = 'notification-bell';
        bell.innerHTML = `
            <button class="bell-btn" onclick="notificationSystem.togglePanel()">
                🔔
                <span class="notification-badge" id="notificationBadge">0</span>
            </button>
        `;
        
        // Add to header
        if (header) {
            header.appendChild(bell);
        } else {
            document.body.appendChild(bell);
        }
    }

    setupNotificationStyles() {
        const styles = `
            <style>
                .notification-panel {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    width: 350px;
                    max-height: 500px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 10000;
                    display: none;
                    overflow: hidden;
                }
                
                .notification-panel.show {
                    display: block;
                }
                
                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background: #667eea;
                    color: white;
                    border-bottom: 1px solid #ddd;
                }
                
                .notification-header h3 {
                    margin: 0;
                    font-size: 16px;
                }
                
                .close-panel {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .notification-list {
                    max-height: 350px;
                    overflow-y: auto;
                    padding: 10px 0;
                }
                
                .notification-item {
                    padding: 12px 20px;
                    border-bottom: 1px solid #f0f0f0;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .notification-item:hover {
                    background: #f8f9fa;
                }
                
                .notification-item.unread {
                    background: #e3f2fd;
                    border-left: 4px solid #2196f3;
                }
                
                .notification-title {
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 4px;
                }
                
                .notification-message {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                
                .notification-time {
                    color: #999;
                    font-size: 12px;
                }
                
                .notification-actions {
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-top: 1px solid #ddd;
                    display: flex;
                    gap: 10px;
                }
                
                .notification-bell {
                    position: relative;
                }
                
                .bell-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background 0.2s;
                    position: relative;
                }
                
                .bell-btn:hover {
                    background: #f0f0f0;
                }
                
                .notification-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #e74c3c;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
                
                .notification-badge.hidden {
                    display: none;
                }
                
                .loading {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                }
                
                .empty-notifications {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                }
                
                .empty-notifications .icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                    opacity: 0.5;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupNotificationSounds() {
        // Create audio context for notification sounds
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not supported');
        }
    }

    // ========================================
    // NOTIFICATION LISTENER
    // ========================================

    startNotificationListener() {
        // Listen for real-time notifications from Firebase
        if (window.firebase && window.firebase.firestore) {
            this.setupFirebaseNotificationListener();
        }
        
        // Listen for custom events
        this.setupCustomEventListeners();
    }

    setupFirebaseNotificationListener() {
        const db = window.firebase.firestore();
        const auth = window.firebase.auth();
        
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Listen for user notifications
                db.collection('notifications')
                    .where('userId', '==', user.uid)
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .onSnapshot((snapshot) => {
                        const notifications = [];
                        snapshot.forEach(doc => {
                            notifications.push({ id: doc.id, ...doc.data() });
                        });
                        this.updateNotifications(notifications);
                    });
            }
        });
    }

    setupCustomEventListeners() {
        // Listen for appointment updates
        document.addEventListener('appointmentUpdated', (event) => {
            this.createNotification({
                title: 'Appointment Updated',
                message: `Your appointment has been ${event.detail.status}`,
                type: 'info'
            });
        });
        
        // Listen for payment updates
        document.addEventListener('paymentReceived', (event) => {
            this.createNotification({
                title: 'Payment Received',
                message: `Payment of ₱${event.detail.amount} has been received`,
                type: 'success'
            });
        });
        
        // Listen for treatment updates
        document.addEventListener('treatmentCompleted', (event) => {
            this.createNotification({
                title: 'Treatment Completed',
                message: `Your ${event.detail.treatment} has been completed`,
                type: 'success'
            });
        });
    }

    // ========================================
    // NOTIFICATION MANAGEMENT
    // ========================================

    updateNotifications(notifications) {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
        
        this.updateNotificationBadge();
        this.updateNotificationList();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    updateNotificationList() {
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="empty-notifications">
                    <div class="icon">🔔</div>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }
        
        const notificationsHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" 
                 onclick="notificationSystem.openNotification('${notification.id}')">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
            </div>
        `).join('');
        
        list.innerHTML = notificationsHTML;
    }

    // ========================================
    // NOTIFICATION CREATION
    // ========================================

    async createNotification(notificationData) {
        try {
            // Add to local notifications
            const notification = {
                id: 'notif-' + Date.now(),
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type || 'info',
                read: false,
                createdAt: new Date()
            };
            
            this.notifications.unshift(notification);
            this.unreadCount++;
            
            // Update UI
            this.updateNotificationBadge();
            this.updateNotificationList();
            
            // Show desktop notification
            if (this.desktopNotificationsEnabled) {
                this.showDesktopNotification(notification);
            }
            
            // Play notification sound
            if (this.soundEnabled) {
                this.playNotificationSound();
            }
            
            // Show toast
            this.showToast(`🔔 ${notification.title}`, 'info');
            
            // Save to Firebase if available
            if (window.firebase && window.firebase.firestore) {
                await this.saveNotificationToFirebase(notification);
            }
            
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    async saveNotificationToFirebase(notification) {
        try {
            const db = window.firebase.firestore();
            const auth = window.firebase.auth();
            const user = auth.currentUser;
            
            if (user) {
                await db.collection('notifications').add({
                    userId: user.uid,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    read: notification.read,
                    createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error saving notification to Firebase:', error);
        }
    }

    showDesktopNotification(notification) {
        if (this.desktopNotificationsEnabled && 'Notification' in window) {
            const desktopNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id
            });
            
            desktopNotification.onclick = () => {
                window.focus();
                this.togglePanel();
                desktopNotification.close();
            };
            
            // Auto-close after 5 seconds
            setTimeout(() => {
                desktopNotification.close();
            }, 5000);
        }
    }

    playNotificationSound() {
        if (this.audioContext) {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            } catch (error) {
                console.warn('Could not play notification sound:', error);
            }
        }
    }

    // ========================================
    // UI INTERACTIONS
    // ========================================

    togglePanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    }

    closePanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('show');
        }
    }

    openNotification(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            // Mark as read
            notification.read = true;
            this.unreadCount--;
            
            // Update UI
            this.updateNotificationBadge();
            this.updateNotificationList();
            
            // Close panel
            this.closePanel();
            
            // Handle notification action
            this.handleNotificationAction(notification);
        }
    }

    handleNotificationAction(notification) {
        // Handle different notification types
        switch (notification.type) {
            case 'appointment':
                // Navigate to appointments
                if (typeof showSection === 'function') {
                    showSection('appointments');
                }
                break;
            case 'payment':
                // Navigate to payments
                if (typeof showSection === 'function') {
                    showSection('payments');
                }
                break;
            case 'treatment':
                // Navigate to treatments
                if (typeof showSection === 'function') {
                    showSection('treatments');
                }
                break;
            default:
                // Default action
                break;
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.unreadCount = 0;
        
        this.updateNotificationBadge();
        this.updateNotificationList();
        
        this.showToast('All notifications marked as read', 'success');
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all notifications?')) {
            this.notifications = [];
            this.unreadCount = 0;
            
            this.updateNotificationBadge();
            this.updateNotificationList();
            
            this.showToast('All notifications cleared', 'success');
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    formatTime(timestamp) {
        const now = new Date();
        const time = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }
    }

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
    }

    getStats() {
        return {
            total: this.notifications.length,
            unread: this.unreadCount,
            desktopEnabled: this.desktopNotificationsEnabled,
            soundEnabled: this.soundEnabled
        };
    }
}

// ========================================
// GLOBAL NOTIFICATION SYSTEM
// ========================================

// Create global notification system
window.notificationSystem = new NotificationSystem();

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem.start();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
