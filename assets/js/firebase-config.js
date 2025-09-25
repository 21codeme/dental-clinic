// Firebase Configuration for Delas Alas Dental Clinic
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCSwv4aOdAKg31Xo5TYQuhW85sNykuuXus",
    authDomain: "delas-alas-dental-clinic.firebaseapp.com",
    projectId: "delas-alas-dental-clinic",
    storageBucket: "delas-alas-dental-clinic.firebasestorage.app",
    messagingSenderId: "1026904695217",
    appId: "1:1026904695217:web:fbf79e3ffde3810a0b5d90",
    measurementId: "G-PEX2SJXNJ7"
};

// Initialize Firebase
let auth, db;
if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = firebase.auth();
    db = firebase.firestore();
} else {
    console.error('Firebase SDK not loaded');
    // Create mock services for local development
    auth = {
        currentUser: null,
        signInWithEmailAndPassword: function() { return Promise.reject(new Error('Firebase not available')); },
        createUserWithEmailAndPassword: function() { return Promise.reject(new Error('Firebase not available')); },
        signOut: function() { return Promise.resolve(); },
        onAuthStateChanged: function(callback) { callback(null); return function() {}; }
    };
    db = {
        collection: function(name) {
            return {
                doc: function(id) {
                    return {
                        set: function(data) { return Promise.resolve(); },
                        get: function() { return Promise.resolve({ exists: false, data: function() { return null; } }); }
                    };
                },
                add: function(data) { return Promise.resolve({ id: 'mock-id' }); },
                get: function() { return Promise.resolve({ docs: [], forEach: function() {} }); }
            };
        }
    };
}

// Firebase Authentication Functions
class FirebaseAuth {
    constructor() {
        this.currentUser = null;
        this.authStateListener = null;
        if (typeof firebase !== 'undefined') {
            this.setupAuthStateListener();
        }
    }

    setupAuthStateListener() {
        if (typeof firebase !== 'undefined' && typeof auth !== 'undefined') {
            this.authStateListener = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    
                    // Get fresh token for backend authentication
                    try {
                        const token = await user.getIdToken();
                        if (window.apiClient) {
                            window.apiClient.setToken(token);
                        }
                    } catch (error) {
                        console.error('Error getting ID token:', error);
                    }
                    
                    this.updateUIForAuthenticatedUser(user);
                    console.log('User signed in:', user.email);
                } else {
                    this.currentUser = null;
                    if (window.apiClient) {
                        window.apiClient.clearToken();
                    }
                    this.updateUIForUnauthenticatedUser();
                    console.log('User signed out');
                }
            });
        }
    }

    // Refresh Firebase token
    async refreshToken() {
        if (this.currentUser) {
            try {
                const token = await this.currentUser.getIdToken(true); // Force refresh
                if (window.apiClient) {
                    window.apiClient.setToken(token);
                }
                return token;
            } catch (error) {
                console.error('Error refreshing token:', error);
                throw error;
            }
        }
        return null;
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            await this.saveUserData(user.uid, userData);
            
            return user;
        } catch (error) {
            console.error('Error during sign up:', error);
            throw error;
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get Firebase ID token for backend authentication
            const token = await user.getIdToken();
            if (window.apiClient) {
                window.apiClient.setToken(token);
            }
            
            return user;
        } catch (error) {
            console.error('Error during sign in:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            
            // Clear backend token
            if (window.apiClient) {
                window.apiClient.clearToken();
            }
        } catch (error) {
            console.error('Error during sign out:', error);
            throw error;
        }
    }

    async saveUserData(uid, userData) {
        try {
            await db.collection('users').doc(uid).set({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }

    async getUserData(uid) {
        try {
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                return doc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting user data:', error);
            throw error;
        }
    }

    updateUIForAuthenticatedUser(user) {
        // Update navigation
        const authLinks = document.querySelectorAll('.auth-links');
        const userInfo = document.querySelectorAll('.user-info');
        
        authLinks.forEach(link => {
            link.innerHTML = `
                <div class="user-menu">
                    <span>Welcome, ${user.email}</span>
                    <button onclick="firebaseAuth.signOut()" class="btn btn-secondary">Logout</button>
                </div>
            `;
        });

        // Show user-specific elements
        const userElements = document.querySelectorAll('.user-only');
        userElements.forEach(element => {
            element.style.display = 'block';
        });

        // Hide guest-only elements
        const guestElements = document.querySelectorAll('.guest-only');
        guestElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    updateUIForUnauthenticatedUser() {
        // Update navigation
        const authLinks = document.querySelectorAll('.auth-links');
        
        authLinks.forEach(link => {
            link.innerHTML = `
                <a href="login.php" class="btn btn-secondary">Login</a>
                <a href="register.php" class="btn btn-primary">Register</a>
            `;
        });

        // Hide user-specific elements
        const userElements = document.querySelectorAll('.user-only');
        userElements.forEach(element => {
            element.style.display = 'none';
        });

        // Show guest-only elements
        const guestElements = document.querySelectorAll('.guest-only');
        guestElements.forEach(element => {
            element.style.display = 'block';
        });
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Firebase Firestore Functions
class FirebaseFirestore {
    constructor() {
        this.db = db;
    }

    // User Management
    async createUser(userData) {
        try {
            const docRef = await this.db.collection('users').add({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            await this.db.collection('users').doc(userId).update({
                ...userData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
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
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    }

    // Appointment Management
    async createAppointment(appointmentData) {
        try {
            const docRef = await this.db.collection('appointments').add({
                ...appointmentData,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    async updateAppointment(appointmentId, appointmentData) {
        try {
            await this.db.collection('appointments').doc(appointmentId).update({
                ...appointmentData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    async getAppointment(appointmentId) {
        try {
            const doc = await this.db.collection('appointments').doc(appointmentId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting appointment:', error);
            throw error;
        }
    }

    async getAppointmentsByUser(userId, role = 'patient') {
        try {
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
            
            return appointments;
        } catch (error) {
            console.error('Error getting appointments:', error);
            throw error;
        }
    }

    async getPendingAppointments() {
        try {
            const querySnapshot = await this.db.collection('appointments')
                .where('status', '==', 'pending')
                .orderBy('appointmentDate', 'asc')
                .get();
            
            const appointments = [];
            querySnapshot.forEach(doc => {
                appointments.push({ id: doc.id, ...doc.data() });
            });
            
            return appointments;
        } catch (error) {
            console.error('Error getting pending appointments:', error);
            throw error;
        }
    }

    // Service Management
    async createService(serviceData) {
        try {
            const docRef = await this.db.collection('services').add({
                ...serviceData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating service:', error);
            throw error;
        }
    }

    async getServices() {
        try {
            const querySnapshot = await this.db.collection('services')
                .orderBy('name', 'asc')
                .get();
            
            const services = [];
            querySnapshot.forEach(doc => {
                services.push({ id: doc.id, ...doc.data() });
            });
            
            return services;
        } catch (error) {
            console.error('Error getting services:', error);
            throw error;
        }
    }

    // Contact Form Submissions
    async submitContactForm(contactData) {
        try {
            const docRef = await this.db.collection('contactSubmissions').add({
                ...contactData,
            status: 'new',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }
}

// Dashboard Statistics
async getDashboardStats(userId, role) {
    try {
        let stats = {
            totalAppointments: 0,
            pendingAppointments: 0,
            completedAppointments: 0,
            todayAppointments: 0
        };

        const appointments = await this.getAppointmentsByUser(userId, role);
        
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

        return stats;
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        throw error;
    }
}

// Real-time Updates
setupRealtimeUpdates(collection, callback) {
    return this.db.collection(collection)
        .onSnapshot((snapshot) => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            callback(data);
        });
}
}

// Initialize Firebase services
let authService, firestoreService;

if (typeof firebase !== 'undefined') {
    authService = new FirebaseAuth();
    firestoreService = new FirebaseFirestore();
} else {
    // Create dummy objects when Firebase is not available
    authService = {
        signUp: () => Promise.reject('Firebase not loaded'),
        signIn: () => Promise.reject('Firebase not loaded'),
        signOut: () => Promise.reject('Firebase not loaded'),
        getCurrentUser: () => null,
        isAuthenticated: () => false
    };
    firestoreService = {
        createUser: () => Promise.reject('Firebase not loaded'),
        updateUser: () => Promise.reject('Firebase not loaded'),
        getUser: () => Promise.reject('Firebase not loaded')
    };
}

// Global functions for use in HTML
window.firebaseAuth = authService;
window.firebaseFirestore = firestoreService;

// Utility functions
window.formatFirebaseTimestamp = (timestamp) => {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
    }
    return 'N/A';
};

window.formatFirebaseDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FirebaseAuth,
        FirebaseFirestore,
        firebaseAuth,
        firebaseFirestore
    };
}
