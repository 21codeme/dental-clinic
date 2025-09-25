// ========================================
// REAL-TIME DATA MANAGER
// ========================================

class RealtimeManager {
    constructor() {
        this.listeners = new Map();
        this.isOnline = navigator.onLine;
        this.setupOnlineOfflineHandlers();
    }

    // ========================================
    // INITIALIZATION
    // ========================================

    async initialize() {
        try {
            // Initialize Firebase listeners
            await this.setupFirebaseListeners();
            
            // Setup periodic updates for offline data
            this.setupPeriodicUpdates();
            
            // Setup real-time notifications
            this.setupRealtimeNotifications();
            
            console.log('✅ RealtimeManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing RealtimeManager:', error);
        }
    }

    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('🟢 Connection restored', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('🔴 Connection lost - Working offline', 'warning');
        });
    }

    // ========================================
    // FIREBASE REAL-TIME LISTENERS
    // ========================================

    async setupFirebaseListeners() {
        if (!window.firebase || !window.firebase.firestore) {
            console.warn('Firebase not available, using offline mode');
            return;
        }

        const db = window.firebase.firestore();
        const auth = window.firebase.auth();

        // Listen for current user changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.setupUserSpecificListeners(user.uid, user.email);
            } else {
                this.cleanupAllListeners();
            }
        });
    }

    async setupUserSpecificListeners(userId, userEmail) {
        const db = window.firebase.firestore();
        
        // Get user role
        const userData = await this.getUserData(userEmail);
        const role = userData?.role || 'patient';

        // Setup role-specific listeners
        if (role === 'patient') {
            this.setupPatientListeners(userId, db);
        } else if (role === 'dentist') {
            this.setupDentistListeners(userId, db);
        }
    }

    setupPatientListeners(userId, db) {
        // Real-time appointments listener
        this.addListener('patient-appointments', 
            db.collection('appointments')
                .where('patientId', '==', userId)
                .orderBy('appointmentDate', 'asc'),
            (appointments) => {
                this.updatePatientAppointments(appointments);
                this.updateDashboardStats();
            }
        );

        // Real-time treatments listener
        this.addListener('patient-treatments',
            db.collection('treatments')
                .where('patientId', '==', userId)
                .orderBy('treatmentDate', 'desc'),
            (treatments) => {
                this.updatePatientTreatments(treatments);
                this.updateDashboardStats();
            }
        );

        // Real-time payments listener
        this.addListener('patient-payments',
            db.collection('payments')
                .where('patientId', '==', userId)
                .orderBy('paymentDate', 'desc'),
            (payments) => {
                this.updatePatientPayments(payments);
                this.updateDashboardStats();
            }
        );

        // Real-time notifications listener
        this.addListener('patient-notifications',
            db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20),
            (notifications) => {
                this.updateNotifications(notifications);
            }
        );
    }

    setupDentistListeners(userId, db) {
        // Real-time appointments listener
        this.addListener('dentist-appointments',
            db.collection('appointments')
                .where('dentistId', '==', userId)
                .orderBy('appointmentDate', 'asc'),
            (appointments) => {
                this.updateDentistAppointments(appointments);
                this.updateDentistDashboardStats();
            }
        );

        // Real-time patients listener
        this.addListener('dentist-patients',
            db.collection('users')
                .where('role', '==', 'patient')
                .orderBy('name', 'asc'),
            (patients) => {
                this.updateDentistPatients(patients);
            }
        );

        // Real-time services listener
        this.addListener('dentist-services',
            db.collection('services')
                .orderBy('name', 'asc'),
            (services) => {
                this.updateDentistServices(services);
            }
        );

        // Real-time reports listener
        this.addListener('dentist-reports',
            db.collection('appointments')
                .where('dentistId', '==', userId)
                .orderBy('appointmentDate', 'desc'),
            (appointments) => {
                this.updateDentistReports(appointments);
            }
        );

        // Real-time notifications listener
        this.addListener('dentist-notifications',
            db.collection('notifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20),
            (notifications) => {
                this.updateNotifications(notifications);
            }
        );
    }

    // ========================================
    // LISTENER MANAGEMENT
    // ========================================

    addListener(name, query, callback) {
        if (this.listeners.has(name)) {
            this.listeners.get(name).unsubscribe();
        }

        const unsubscribe = query.onSnapshot(
            (snapshot) => {
                const data = [];
                snapshot.forEach(doc => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                callback(data);
            },
            (error) => {
                console.error(`Error in ${name} listener:`, error);
                this.showToast(`Error loading ${name}`, 'error');
            }
        );

        this.listeners.set(name, { unsubscribe, query, callback });
    }

    cleanupAllListeners() {
        this.listeners.forEach((listener, name) => {
            listener.unsubscribe();
            console.log(`Cleaned up listener: ${name}`);
        });
        this.listeners.clear();
    }

    // ========================================
    // DATA UPDATE HANDLERS
    // ========================================

    updatePatientAppointments(appointments) {
        // Update global appointments array
        window.patientAppointments = appointments;
        
        // Update localStorage as backup
        localStorage.setItem('patientAppointments', JSON.stringify(appointments));
        
        // Update UI if on appointments section
        if (typeof displayAppointments === 'function') {
            displayAppointments();
        }
        
        // Update dashboard stats
        this.updateDashboardStats();
        
        console.log('📅 Patient appointments updated:', appointments.length);
    }

    updatePatientTreatments(treatments) {
        window.patientTreatments = treatments;
        localStorage.setItem('patientTreatments', JSON.stringify(treatments));
        
        if (typeof displayTreatments === 'function') {
            displayTreatments();
        }
        
        this.updateDashboardStats();
        console.log('🦷 Patient treatments updated:', treatments.length);
    }

    updatePatientPayments(payments) {
        window.patientPayments = payments;
        localStorage.setItem('patientPayments', JSON.stringify(payments));
        
        if (typeof displayPayments === 'function') {
            displayPayments();
        }
        
        this.updateDashboardStats();
        console.log('💳 Patient payments updated:', payments.length);
    }

    updateDentistAppointments(appointments) {
        window.dentistAppointments = appointments;
        localStorage.setItem('dentistAppointments', JSON.stringify(appointments));
        
        if (typeof displayDentistAppointments === 'function') {
            displayDentistAppointments();
        }
        
        this.updateDentistDashboardStats();
        console.log('📅 Dentist appointments updated:', appointments.length);
    }

    updateDentistPatients(patients) {
        window.dentistPatients = patients;
        localStorage.setItem('dentistPatients', JSON.stringify(patients));
        
        if (typeof displayPatients === 'function') {
            displayPatients();
        }
        
        console.log('👥 Dentist patients updated:', patients.length);
    }

    updateDentistServices(services) {
        window.dentistServices = services;
        localStorage.setItem('dentistServices', JSON.stringify(services));
        
        if (typeof displayServices === 'function') {
            displayServices();
        }
        
        console.log('🛠️ Dentist services updated:', services.length);
    }

    updateDentistReports(appointments) {
        // Calculate real-time reports
        const reports = this.calculateReports(appointments);
        window.dentistReports = reports;
        
        if (typeof displayReports === 'function') {
            displayReports();
        }
        
        console.log('📊 Dentist reports updated');
    }

    updateNotifications(notifications) {
        window.userNotifications = notifications;
        localStorage.setItem('userNotifications', JSON.stringify(notifications));
        
        // Update notification badge
        this.updateNotificationBadge(notifications);
        
        // Show new notifications
        this.showNewNotifications(notifications);
        
        console.log('🔔 Notifications updated:', notifications.length);
    }

    // ========================================
    // DASHBOARD STATS UPDATES
    // ========================================

    updateDashboardStats() {
        const appointments = window.patientAppointments || [];
        const treatments = window.patientTreatments || [];
        const payments = window.patientPayments || [];

        const stats = {
            totalAppointments: appointments.length,
            treatmentsDone: treatments.length,
            totalPayments: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
            medicalRecords: treatments.length
        };

        // Update dashboard UI
        this.updateStatsCards(stats);
        
        // Update global stats
        window.dashboardStats = stats;
    }

    updateDentistDashboardStats() {
        const appointments = window.dentistAppointments || [];
        const patients = window.dentistPatients || [];
        const services = window.dentistServices || [];

        const stats = {
            totalAppointments: appointments.length,
            pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
            completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
            totalPatients: patients.length,
            totalServices: services.length,
            todayAppointments: this.getTodayAppointments(appointments)
        };

        // Update dashboard UI
        this.updateDentistStatsCards(stats);
        
        // Update global stats
        window.dentistDashboardStats = stats;
    }

    updateStatsCards(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-number').textContent = stats.totalAppointments;
            statCards[1].querySelector('.stat-number').textContent = stats.treatmentsDone;
            statCards[2].querySelector('.stat-number').textContent = `₱${stats.totalPayments.toLocaleString()}`;
            statCards[3].querySelector('.stat-number').textContent = stats.medicalRecords;
        }
    }

    updateDentistStatsCards(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 6) {
            statCards[0].querySelector('.stat-number').textContent = stats.totalAppointments;
            statCards[1].querySelector('.stat-number').textContent = stats.pendingAppointments;
            statCards[2].querySelector('.stat-number').textContent = stats.completedAppointments;
            statCards[3].querySelector('.stat-number').textContent = stats.totalPatients;
            statCards[4].querySelector('.stat-number').textContent = stats.totalServices;
            statCards[5].querySelector('.stat-number').textContent = stats.todayAppointments;
        }
    }

    // ========================================
    // NOTIFICATION SYSTEM
    // ========================================

    updateNotificationBadge(notifications) {
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // Update notification badges
        const badges = document.querySelectorAll('.notification-badge, .pending-badge');
        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    showNewNotifications(notifications) {
        // Show only new notifications (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const newNotifications = notifications.filter(n => {
            const notificationTime = n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
            return notificationTime > fiveMinutesAgo;
        });

        newNotifications.forEach(notification => {
            this.showToast(`🔔 ${notification.title}: ${notification.message}`, 'info');
        });
    }

    // ========================================
    // PERIODIC UPDATES
    // ========================================

    setupPeriodicUpdates() {
        // Update dashboard every 30 seconds
        setInterval(() => {
            if (this.isOnline) {
                this.updateDashboardStats();
                this.updateDentistDashboardStats();
            }
        }, 30000);

        // Sync offline data every 2 minutes
        setInterval(() => {
            if (this.isOnline) {
                this.syncOfflineData();
            }
        }, 120000);
    }

    async syncOfflineData() {
        try {
            // Sync any offline changes to Firebase
            await this.syncOfflineAppointments();
            await this.syncOfflineTreatments();
            await this.syncOfflinePayments();
            
            console.log('✅ Offline data synced successfully');
        } catch (error) {
            console.error('❌ Error syncing offline data:', error);
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    calculateReports(appointments) {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const monthlyAppointments = appointments.filter(apt => {
            const aptDate = apt.appointmentDate?.toDate ? apt.appointmentDate.toDate() : new Date(apt.appointmentDate);
            return aptDate >= thisMonth;
        });

        const completedAppointments = monthlyAppointments.filter(apt => apt.status === 'completed');
        const pendingAppointments = monthlyAppointments.filter(apt => apt.status === 'pending');

        const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.amount || 0), 0);
        const averageAppointmentValue = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;

        return {
            monthlyRevenue: totalRevenue,
            totalAppointments: monthlyAppointments.length,
            completedAppointments: completedAppointments.length,
            pendingAppointments: pendingAppointments.length,
            averageAppointmentValue: averageAppointmentValue
        };
    }

    getTodayAppointments(appointments) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return appointments.filter(apt => {
            const aptDate = apt.appointmentDate?.toDate ? apt.appointmentDate.toDate() : new Date(apt.appointmentDate);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime();
        }).length;
    }

    async getUserData(email) {
        try {
            if (window.firebase && window.firebase.firestore) {
                const db = window.firebase.firestore();
                const querySnapshot = await db.collection('users')
                    .where('email', '==', email)
                    .limit(1)
                    .get();
                
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    return { id: doc.id, ...doc.data() };
                }
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }
        return null;
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

    stop() {
        this.cleanupAllListeners();
    }

    getStats() {
        return {
            listeners: this.listeners.size,
            isOnline: this.isOnline,
            appointments: window.patientAppointments?.length || window.dentistAppointments?.length || 0,
            notifications: window.userNotifications?.length || 0
        };
    }
}

// ========================================
// GLOBAL REALTIME MANAGER
// ========================================

// Create global realtime manager
window.realtimeManager = new RealtimeManager();

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.realtimeManager.start();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.realtimeManager.stop();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeManager;
}
