// ========================================
// COMPREHENSIVE BACKEND API FUNCTIONS
// ========================================

class DentalClinicAPI {
    constructor() {
        this.baseURL = 'https://delas-alas-dental-clinic.firebaseapp.com/api';
        this.firebase = null;
        this.auth = null;
        this.db = null;
        this.initializeFirebase();
    }

    async initializeFirebase() {
        try {
            if (typeof firebase !== 'undefined') {
                this.firebase = firebase;
                this.auth = firebase.auth();
                this.db = firebase.firestore();
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }

    // ========================================
    // AUTHENTICATION API
    // ========================================

    async login(email, password) {
        try {
            if (this.auth) {
                const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Get user data from Firestore
                const userData = await this.getUserByEmail(email);
                
                return {
                    success: true,
                    user: {
                        uid: user.uid,
                        email: user.email,
                        ...userData
                    }
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async register(userData) {
        try {
            if (this.auth && this.db) {
                // Create user with Firebase Auth
                const userCredential = await this.auth.createUserWithEmailAndPassword(
                    userData.email, 
                    userData.password
                );
                const user = userCredential.user;
                
                // Save additional user data to Firestore
                await this.db.collection('users').doc(user.uid).set({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    dateOfBirth: userData.dateOfBirth,
                    gender: userData.gender,
                    address: userData.address,
                    role: userData.role,
                    isActive: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return {
                    success: true,
                    user: {
                        uid: user.uid,
                        email: user.email,
                        ...userData
                    }
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        try {
            if (this.auth) {
                await this.auth.signOut();
                return { success: true };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUserByEmail(email) {
        try {
            if (this.db) {
                const querySnapshot = await this.db.collection('users')
                    .where('email', '==', email)
                    .limit(1)
                    .get();
                
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    return { id: doc.id, ...doc.data() };
                } else {
                    return null;
                }
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    // ========================================
    // APPOINTMENTS API
    // ========================================

    async createAppointment(appointmentData) {
        try {
            if (this.db) {
                const docRef = await this.db.collection('appointments').add({
                    ...appointmentData,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return {
                    success: true,
                    appointmentId: docRef.id
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getAppointments(userId, role = 'patient') {
        try {
            if (this.db) {
                let query;
                if (role === 'dentist') {
                    query = this.db.collection('appointments')
                        .where('dentistId', '==', userId)
                        .orderBy('appointmentDate', 'asc');
                } else {
                    query = this.db.collection('appointments')
                        .where('patientId', '==', userId)
                        .orderBy('appointmentDate', 'asc');
                }
                
                const querySnapshot = await query.get();
                const appointments = [];
                
                querySnapshot.forEach(doc => {
                    appointments.push({ id: doc.id, ...doc.data() });
                });
                
                return {
                    success: true,
                    appointments
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                appointments: []
            };
        }
    }

    async updateAppointment(appointmentId, updateData) {
        try {
            if (this.db) {
                await this.db.collection('appointments').doc(appointmentId).update({
                    ...updateData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteAppointment(appointmentId) {
        try {
            if (this.db) {
                await this.db.collection('appointments').doc(appointmentId).delete();
                return { success: true };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // PATIENTS API
    // ========================================

    async getPatients() {
        try {
            if (this.db) {
                const querySnapshot = await this.db.collection('users')
                    .where('role', '==', 'patient')
                    .orderBy('name', 'asc')
                    .get();
                
                const patients = [];
                querySnapshot.forEach(doc => {
                    patients.push({ id: doc.id, ...doc.data() });
                });
                
                return {
                    success: true,
                    patients
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                patients: []
            };
        }
    }

    async getPatient(patientId) {
        try {
            if (this.db) {
                const doc = await this.db.collection('users').doc(patientId).get();
                if (doc.exists) {
                    return {
                        success: true,
                        patient: { id: doc.id, ...doc.data() }
                    };
                } else {
                    return {
                        success: false,
                        error: 'Patient not found'
                    };
                }
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updatePatient(patientId, updateData) {
        try {
            if (this.db) {
                await this.db.collection('users').doc(patientId).update({
                    ...updateData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // SERVICES API
    // ========================================

    async getServices() {
        try {
            if (this.db) {
                const querySnapshot = await this.db.collection('services')
                    .orderBy('name', 'asc')
                    .get();
                
                const services = [];
                querySnapshot.forEach(doc => {
                    services.push({ id: doc.id, ...doc.data() });
                });
                
                return {
                    success: true,
                    services
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                services: []
            };
        }
    }

    async createService(serviceData) {
        try {
            if (this.db) {
                const docRef = await this.db.collection('services').add({
                    ...serviceData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return {
                    success: true,
                    serviceId: docRef.id
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateService(serviceId, updateData) {
        try {
            if (this.db) {
                await this.db.collection('services').doc(serviceId).update({
                    ...updateData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return { success: true };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteService(serviceId) {
        try {
            if (this.db) {
                await this.db.collection('services').doc(serviceId).delete();
                return { success: true };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // TREATMENTS API
    // ========================================

    async getTreatments(patientId) {
        try {
            if (this.db) {
                const querySnapshot = await this.db.collection('treatments')
                    .where('patientId', '==', patientId)
                    .orderBy('treatmentDate', 'desc')
                    .get();
                
                const treatments = [];
                querySnapshot.forEach(doc => {
                    treatments.push({ id: doc.id, ...doc.data() });
                });
                
                return {
                    success: true,
                    treatments
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                treatments: []
            };
        }
    }

    async createTreatment(treatmentData) {
        try {
            if (this.db) {
                const docRef = await this.db.collection('treatments').add({
                    ...treatmentData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return {
                    success: true,
                    treatmentId: docRef.id
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // PAYMENTS API
    // ========================================

    async getPayments(patientId) {
        try {
            if (this.db) {
                const querySnapshot = await this.db.collection('payments')
                    .where('patientId', '==', patientId)
                    .orderBy('paymentDate', 'desc')
                    .get();
                
                const payments = [];
                querySnapshot.forEach(doc => {
                    payments.push({ id: doc.id, ...doc.data() });
                });
                
                return {
                    success: true,
                    payments
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                payments: []
            };
        }
    }

    async createPayment(paymentData) {
        try {
            if (this.db) {
                const docRef = await this.db.collection('payments').add({
                    ...paymentData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return {
                    success: true,
                    paymentId: docRef.id
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // REPORTS API
    // ========================================

    async getDashboardStats(userId, role) {
        try {
            if (this.db) {
                let stats = {
                    totalAppointments: 0,
                    pendingAppointments: 0,
                    completedAppointments: 0,
                    todayAppointments: 0,
                    totalPatients: 0,
                    totalRevenue: 0
                };

                // Get appointments
                const appointmentsResult = await this.getAppointments(userId, role);
                if (appointmentsResult.success) {
                    const appointments = appointmentsResult.appointments;
                    stats.totalAppointments = appointments.length;
                    stats.pendingAppointments = appointments.filter(apt => apt.status === 'pending').length;
                    stats.completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
                    
                    // Get today's appointments
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    stats.todayAppointments = appointments.filter(apt => {
                        const aptDate = apt.appointmentDate.toDate();
                        aptDate.setHours(0, 0, 0, 0);
                        return aptDate.getTime() === today.getTime();
                    }).length;
                }

                // Get patients count (for dentists)
                if (role === 'dentist') {
                    const patientsResult = await this.getPatients();
                    if (patientsResult.success) {
                        stats.totalPatients = patientsResult.patients.length;
                    }
                }

                // Get revenue (for dentists)
                if (role === 'dentist') {
                    const paymentsResult = await this.getPayments(userId);
                    if (paymentsResult.success) {
                        stats.totalRevenue = paymentsResult.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                    }
                }

                return {
                    success: true,
                    stats
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stats: {}
            };
        }
    }

    // ========================================
    // NOTIFICATIONS API
    // ========================================

    async sendNotification(userId, notification) {
        try {
            if (this.db) {
                const docRef = await this.db.collection('notifications').add({
                    userId: userId,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type || 'info',
                    read: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                return {
                    success: true,
                    notificationId: docRef.id
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getNotifications(userId) {
        try {
            if (this.db) {
                const querySnapshot = await this.db.collection('notifications')
                    .where('userId', '==', userId)
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();
                
                const notifications = [];
                querySnapshot.forEach(doc => {
                    notifications.push({ id: doc.id, ...doc.data() });
                });
                
                return {
                    success: true,
                    notifications
                };
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                notifications: []
            };
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    async isOnline() {
        return navigator.onLine;
    }

    async getCurrentUser() {
        try {
            if (this.auth) {
                const user = this.auth.currentUser;
                if (user) {
                    const userData = await this.getUserByEmail(user.email);
                    return {
                        success: true,
                        user: {
                            uid: user.uid,
                            email: user.email,
                            ...userData
                        }
                    };
                } else {
                    return {
                        success: false,
                        error: 'No user logged in'
                    };
                }
            } else {
                throw new Error('Firebase not initialized');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ========================================
    // ERROR HANDLING
    // ========================================

    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const errorMessage = this.getErrorMessage(error);
        this.showToast(errorMessage, 'error');
        
        return {
            success: false,
            error: errorMessage
        };
    }

    getErrorMessage(error) {
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    return 'User not found. Please check your email.';
                case 'auth/wrong-password':
                    return 'Incorrect password. Please try again.';
                case 'auth/email-already-in-use':
                    return 'Email already in use. Please use a different email.';
                case 'auth/weak-password':
                    return 'Password is too weak. Please use a stronger password.';
                case 'auth/invalid-email':
                    return 'Invalid email address. Please check your email.';
                case 'permission-denied':
                    return 'Permission denied. Please contact support.';
                case 'unavailable':
                    return 'Service temporarily unavailable. Please try again later.';
                default:
                    return 'An error occurred. Please try again.';
            }
        } else {
            return error.message || 'An unexpected error occurred.';
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
}

// ========================================
// GLOBAL API INSTANCE
// ========================================

// Create global API instance
window.dentalAPI = new DentalClinicAPI();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DentalClinicAPI;
}
