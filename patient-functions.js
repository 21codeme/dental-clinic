// ========================================
// COMPREHENSIVE PATIENT DASHBOARD FUNCTIONS
// ========================================

// Global variables
let currentUser = null;
let appointments = [];
let treatments = [];
let payments = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadUserData();
    loadAppointments();
    loadTreatments();
    loadPayments();
});

// ========================================
// DASHBOARD INITIALIZATION
// ========================================

function initializeDashboard() {
    // Load user data from localStorage or Firebase
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserInfo();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
}

function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name || 'Patient';
        document.getElementById('userEmail').textContent = currentUser.email || 'patient@email.com';
    }
}

function setupEventListeners() {
    // Navigation clicks
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(section);
        });
    });
}

// ========================================
// SECTION NAVIGATION
// ========================================

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Find and activate the corresponding nav item
        const navItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (navItem) {
            navItem.parentElement.classList.add('active');
        }
        
        // Load section-specific data
        loadSectionData(sectionName);
    }
}

function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'qr-code':
            loadQRCode();
            break;
        case 'treatments':
            loadTreatments();
            break;
        case 'payments':
            loadPayments();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ========================================
// DASHBOARD DATA
// ========================================

async function loadDashboardData() {
    try {
        // Load statistics
        const stats = await getDashboardStats();
        updateDashboardStats(stats);
        
        // Load recent appointments
        const recentAppointments = await getRecentAppointments(3);
        displayRecentAppointments(recentAppointments);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

async function getDashboardStats() {
    try {
        if (window.firebaseFirestore && currentUser) {
            // Get real data from Firebase
            const appointments = await window.firebaseFirestore.getAppointmentsByUser(currentUser.uid, 'patient');
            const treatments = await getTreatmentsFromFirebase();
            const payments = await getPaymentsFromFirebase();
            
            return {
                totalAppointments: appointments.length,
                treatmentsDone: treatments.length,
                totalPayments: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
                medicalRecords: treatments.length
            };
        } else {
            // Fallback to local data
            return {
                totalAppointments: appointments.length,
                treatmentsDone: treatments.length,
                totalPayments: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
                medicalRecords: treatments.length
            };
        }
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {
            totalAppointments: 0,
            treatmentsDone: 0,
            totalPayments: 0,
            medicalRecords: 0
        };
    }
}

function updateDashboardStats(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.stat-number').textContent = stats.totalAppointments;
        statCards[1].querySelector('.stat-number').textContent = stats.treatmentsDone;
        statCards[2].querySelector('.stat-number').textContent = `₱${stats.totalPayments.toLocaleString()}`;
        statCards[3].querySelector('.stat-number').textContent = stats.medicalRecords;
    }
}

// ========================================
// APPOINTMENTS MANAGEMENT
// ========================================

async function loadAppointments() {
    try {
        if (window.firebaseFirestore && currentUser) {
            appointments = await window.firebaseFirestore.getAppointmentsByUser(currentUser.uid, 'patient');
        } else {
            // Load from localStorage
            appointments = JSON.parse(localStorage.getItem('patientAppointments') || '[]');
        }
        
        displayAppointments();
    } catch (error) {
        console.error('Error loading appointments:', error);
        showToast('Error loading appointments', 'error');
    }
}

function displayAppointments() {
    const appointmentsContainer = document.querySelector('#appointments .appointments-list');
    if (!appointmentsContainer) return;
    
    if (appointments.length === 0) {
        appointmentsContainer.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3em; margin-bottom: 20px;">📅</div>
                <h3>No Appointments Yet</h3>
                <p>You haven't booked any appointments yet.</p>
                <button class="btn" onclick="bookNewAppointment()">Book Your First Appointment</button>
            </div>
        `;
        return;
    }
    
    const appointmentsHTML = appointments.map(appointment => `
        <div class="appointment-card">
            <div class="appointment-header">
                <h3>${appointment.service || 'Dental Service'}</h3>
                <span class="status status-${appointment.status || 'pending'}">${appointment.status || 'Pending'}</span>
            </div>
            <div class="appointment-details">
                <p><strong>Date:</strong> ${formatDate(appointment.appointmentDate)}</p>
                <p><strong>Time:</strong> ${appointment.appointmentTime || 'TBD'}</p>
                <p><strong>Dentist:</strong> ${appointment.dentist || 'Dr. TBD'}</p>
                <p><strong>Location:</strong> ${appointment.location || 'DeLas Alas Dental Clinic'}</p>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-secondary" onclick="rescheduleAppointment('${appointment.id}')">
                    📅 Reschedule
                </button>
                <button class="btn btn-danger" onclick="cancelAppointment('${appointment.id}')">
                    ❌ Cancel
                </button>
            </div>
        </div>
    `).join('');
    
    appointmentsContainer.innerHTML = appointmentsHTML;
}

async function bookNewAppointment() {
    // Show booking modal
    showBookingModal();
}

function showBookingModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bookingModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeBookingModal()">&times;</span>
            <h2>Book New Appointment</h2>
            <form id="bookingForm">
                <div class="form-group">
                    <label for="serviceType">Service Type:</label>
                    <select id="serviceType" required>
                        <option value="">Select Service</option>
                        <option value="cleaning">Dental Cleaning</option>
                        <option value="whitening">Teeth Whitening</option>
                        <option value="extraction">Tooth Extraction</option>
                        <option value="checkup">Dental Checkup</option>
                        <option value="filling">Dental Filling</option>
                        <option value="crown">Dental Crown</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="preferredDentist">Preferred Dentist:</label>
                    <select id="preferredDentist" required>
                        <option value="">Select Dentist</option>
                        <option value="dr-maria-santos">Dr. Maria Santos</option>
                        <option value="dr-john-smith">Dr. John Smith</option>
                        <option value="dr-ana-rodriguez">Dr. Ana Rodriguez</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="contactMethod">Contact Method:</label>
                    <select id="contactMethod" required>
                        <option value="">Select Contact Method</option>
                        <option value="phone">Phone Call</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Additional Notes:</label>
                    <textarea id="notes" placeholder="Any specific concerns or requests..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn">Book Appointment</button>
                    <button type="button" class="btn btn-secondary" onclick="closeBookingModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmission);
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.remove();
    }
}

async function handleBookingSubmission(e) {
    e.preventDefault();
    
    const formData = {
        serviceType: document.getElementById('serviceType').value,
        preferredDentist: document.getElementById('preferredDentist').value,
        contactMethod: document.getElementById('contactMethod').value,
        notes: document.getElementById('notes').value,
        patientId: currentUser?.uid || 'patient-001',
        patientName: currentUser?.name || 'Patient',
        patientEmail: currentUser?.email || 'patient@email.com',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    try {
        if (window.firebaseFirestore && currentUser) {
            // Save to Firebase
            const appointmentId = await window.firebaseFirestore.createAppointment(formData);
            showToast('Appointment booked successfully!', 'success');
        } else {
            // Save to localStorage
            const newAppointment = {
                id: 'apt-' + Date.now(),
                ...formData
            };
            appointments.push(newAppointment);
            localStorage.setItem('patientAppointments', JSON.stringify(appointments));
            showToast('Appointment booked successfully!', 'success');
        }
        
        closeBookingModal();
        loadAppointments();
        
    } catch (error) {
        console.error('Error booking appointment:', error);
        showToast('Error booking appointment', 'error');
    }
}

async function rescheduleAppointment(appointmentId) {
    showToast('Reschedule function coming soon!', 'info');
}

async function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            if (window.firebaseFirestore && currentUser) {
                await window.firebaseFirestore.updateAppointment(appointmentId, { status: 'cancelled' });
            } else {
                const appointment = appointments.find(apt => apt.id === appointmentId);
                if (appointment) {
                    appointment.status = 'cancelled';
                    localStorage.setItem('patientAppointments', JSON.stringify(appointments));
                }
            }
            
            showToast('Appointment cancelled', 'success');
            loadAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            showToast('Error cancelling appointment', 'error');
        }
    }
}

// ========================================
// QR CODE MANAGEMENT
// ========================================

function loadQRCode() {
    // QR code is already generated in the HTML
    // This function can be used to refresh or update QR codes
}

function generateQRCode() {
    // Generate QR Code (using same format as Excel template)
    const appointmentData = {
        patientId: currentUser?.uid || "P001",
        name: currentUser?.name || "Juan Dela Cruz",
        phone: currentUser?.phone || "+63 912 345 6789",
        email: currentUser?.email || "juan.delacruz@email.com",
        date: "2025-03-25",
        time: "10:00 AM",
        dentist: "Dr. Maria Santos",
        service: "Dental Cleaning",
        room: "Room 2",
        status: "Confirmed",
        qrCode: "QR001",
        clinic: "DeLas Alas Dental Clinic"
    };

    // Generate QR code URL using same format as Excel template
    const qrData = `${appointmentData.patientId}-${appointmentData.name}-${appointmentData.date}-${appointmentData.time}-${appointmentData.dentist}-${appointmentData.service}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    // Update all QR containers
    updateQRContainersWithImage(qrUrl, appointmentData);
    showToast('QR Code updated successfully!', 'success');
}

function updateQRContainersWithImage(qrUrl, appointmentData) {
    const qrText = `
        PATIENT: ${appointmentData.name}
        PATIENT ID: ${appointmentData.patientId}
        QR CODE: ${appointmentData.qrCode}
        DATE: ${appointmentData.date}
        TIME: ${appointmentData.time}
        DENTIST: ${appointmentData.dentist}
        SERVICE: ${appointmentData.service}
        ROOM: ${appointmentData.room}
        STATUS: ${appointmentData.status}
        CLINIC: ${appointmentData.clinic}
    `;

    const qrContainerHTML = `
        <div style="text-align: center; background: white; padding: 20px; border: 2px solid #667eea; border-radius: 10px;">
            <h3 style="color: #667eea; margin-bottom: 15px;">🔲 Your QR Code</h3>
            <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #333; margin: 20px auto; display: block;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 11px; text-align: left; max-width: 300px; margin: 10px auto;">
                <pre style="margin: 0; line-height: 1.3;">${qrText}</pre>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 15px;">
                Show this at the clinic for quick check-in
            </p>
        </div>
    `;

    // Update all QR containers
    const containers = ['qrContainer', 'qrContainer2', 'qrCodeDisplay'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = qrContainerHTML;
        }
    });
}

function downloadQRCode() {
    showToast('QR Code download coming soon!', 'info');
}

function printQRCode() {
    showToast('QR Code print coming soon!', 'info');
}

// ========================================
// TREATMENTS MANAGEMENT
// ========================================

async function loadTreatments() {
    try {
        if (window.firebaseFirestore && currentUser) {
            treatments = await getTreatmentsFromFirebase();
        } else {
            treatments = JSON.parse(localStorage.getItem('patientTreatments') || '[]');
        }
        
        displayTreatments();
    } catch (error) {
        console.error('Error loading treatments:', error);
        showToast('Error loading treatments', 'error');
    }
}

async function getTreatmentsFromFirebase() {
    // This would connect to Firebase to get treatment history
    return [
        {
            id: 'treat-001',
            name: 'Dental Cleaning',
            date: '2025-01-15',
            dentist: 'Dr. Maria Santos',
            cost: 2500,
            status: 'completed'
        },
        {
            id: 'treat-002',
            name: 'Teeth Whitening',
            date: '2025-02-10',
            dentist: 'Dr. John Smith',
            cost: 8000,
            status: 'completed'
        }
    ];
}

function displayTreatments() {
    const treatmentsContainer = document.querySelector('#treatments .treatments-list');
    if (!treatmentsContainer) return;
    
    if (treatments.length === 0) {
        treatmentsContainer.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3em; margin-bottom: 20px;">🦷</div>
                <h3>No Treatments Yet</h3>
                <p>You haven't had any treatments yet.</p>
            </div>
        `;
        return;
    }
    
    const treatmentsHTML = treatments.map(treatment => `
        <div class="treatment-card">
            <div class="treatment-header">
                <h3>${treatment.name}</h3>
                <span class="status status-${treatment.status}">${treatment.status}</span>
            </div>
            <div class="treatment-details">
                <p><strong>Date:</strong> ${formatDate(treatment.date)}</p>
                <p><strong>Dentist:</strong> ${treatment.dentist}</p>
                <p><strong>Cost:</strong> ₱${treatment.cost.toLocaleString()}</p>
            </div>
            <div class="treatment-actions">
                <button class="btn btn-secondary" onclick="viewTreatmentDetails('${treatment.id}')">
                    📋 View Details
                </button>
            </div>
        </div>
    `).join('');
    
    treatmentsContainer.innerHTML = treatmentsHTML;
}

function viewTreatmentDetails(treatmentId) {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (treatment) {
        showToast(`Treatment details for ${treatment.name}`, 'info');
    }
}

function bookNewTreatment() {
    showToast('Book new treatment coming soon!', 'info');
}

function downloadTreatmentHistory() {
    showToast('Download treatment history coming soon!', 'info');
}

// ========================================
// PAYMENTS MANAGEMENT
// ========================================

async function loadPayments() {
    try {
        if (window.firebaseFirestore && currentUser) {
            payments = await getPaymentsFromFirebase();
        } else {
            payments = JSON.parse(localStorage.getItem('patientPayments') || '[]');
        }
        
        displayPayments();
    } catch (error) {
        console.error('Error loading payments:', error);
        showToast('Error loading payments', 'error');
    }
}

async function getPaymentsFromFirebase() {
    // This would connect to Firebase to get payment history
    return [
        {
            id: 'pay-001',
            service: 'Dental Cleaning',
            amount: 2500,
            date: '2025-01-15',
            status: 'paid',
            method: 'Credit Card'
        },
        {
            id: 'pay-002',
            service: 'Teeth Whitening',
            amount: 8000,
            date: '2025-02-10',
            status: 'paid',
            method: 'Bank Transfer'
        }
    ];
}

function displayPayments() {
    const paymentsContainer = document.querySelector('#payments .payments-list');
    if (!paymentsContainer) return;
    
    if (payments.length === 0) {
        paymentsContainer.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3em; margin-bottom: 20px;">💳</div>
                <h3>No Payments Yet</h3>
                <p>You haven't made any payments yet.</p>
            </div>
        `;
        return;
    }
    
    const paymentsHTML = payments.map(payment => `
        <div class="payment-card">
            <div class="payment-header">
                <h3>${payment.service}</h3>
                <span class="status status-${payment.status}">${payment.status}</span>
            </div>
            <div class="payment-details">
                <p><strong>Amount:</strong> ₱${payment.amount.toLocaleString()}</p>
                <p><strong>Date:</strong> ${formatDate(payment.date)}</p>
                <p><strong>Method:</strong> ${payment.method}</p>
            </div>
            <div class="payment-actions">
                <button class="btn btn-secondary" onclick="viewPaymentDetails('${payment.id}')">
                    📋 View Receipt
                </button>
            </div>
        </div>
    `).join('');
    
    paymentsContainer.innerHTML = paymentsHTML;
}

function viewPaymentDetails(paymentId) {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
        showToast(`Payment details for ${payment.service}`, 'info');
    }
}

function makePayment() {
    showToast('Make payment coming soon!', 'info');
}

function downloadPaymentHistory() {
    showToast('Download payment history coming soon!', 'info');
}

function viewBillingInfo() {
    showToast('Billing information coming soon!', 'info');
}

// ========================================
// SETTINGS MANAGEMENT
// ========================================

function loadSettings() {
    // Settings are already loaded in the HTML
    // This function can be used to refresh settings data
}

function openEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function changeEmail() {
    showToast('Change email coming soon!', 'info');
}

function changePhone() {
    showToast('Change phone coming soon!', 'info');
}

function changePassword() {
    showToast('Change password coming soon!', 'info');
}

function enable2FA() {
    showToast('Enable 2FA coming soon!', 'info');
}

function saveSettings() {
    showToast('Settings saved!', 'success');
}

function exportData() {
    showToast('Export data coming soon!', 'info');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        showToast('Delete account coming soon!', 'info');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showToast(message, type = 'info') {
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

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear user data
        localStorage.removeItem('currentUser');
        
        // Sign out from Firebase if available
        if (window.firebaseAuth) {
            window.firebaseAuth.signOut();
        }
        
        // Redirect to home page
        window.location.href = 'index.html';
    }
}

// ========================================
// FALLBACK FUNCTIONS
// ========================================

function showFallbackQRCode() {
    // Use same appointment data format as Excel template
    const appointmentData = {
        patientId: currentUser?.uid || "P001",
        name: currentUser?.name || "Juan Dela Cruz",
        phone: currentUser?.phone || "+63 912 345 6789",
        email: currentUser?.email || "juan.delacruz@email.com",
        date: "2025-03-25",
        time: "10:00 AM",
        dentist: "Dr. Maria Santos",
        service: "Dental Cleaning",
        room: "Room 2",
        status: "Confirmed",
        qrCode: "QR001",
        clinic: "DeLas Alas Dental Clinic"
    };

    // Generate QR code URL using same format as Excel template
    const qrData = `${appointmentData.patientId}-${appointmentData.name}-${appointmentData.date}-${appointmentData.time}-${appointmentData.dentist}-${appointmentData.service}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    // Update all QR containers with real QR code from API
    updateQRContainersWithImage(qrUrl, appointmentData);
    
    showToast('QR Code generated successfully!', 'success');
}

// ========================================
// CSS FOR TOAST NOTIFICATIONS
// ========================================

const toastCSS = `
<style>
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.toast.show {
    transform: translateX(0);
}

.toast-success {
    background: #27ae60;
}

.toast-error {
    background: #e74c3c;
}

.toast-info {
    background: #3498db;
}

.toast-warning {
    background: #f39c12;
}
</style>
`;

// Add toast CSS to page
document.head.insertAdjacentHTML('beforeend', toastCSS);
