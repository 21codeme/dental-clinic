// ========================================
// COMPREHENSIVE DENTIST DASHBOARD FUNCTIONS
// ========================================

// Global variables
let currentDentist = null;
let appointments = [];
let patients = [];
let services = [];
let reports = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDentistDashboard();
    loadDentistData();
    loadAppointments();
    loadPatients();
    loadServices();
    loadReports();
});

// ========================================
// DASHBOARD INITIALIZATION
// ========================================

function initializeDentistDashboard() {
    // Load dentist data from localStorage or Firebase
    const dentistData = localStorage.getItem('currentUser');
    if (dentistData) {
        currentDentist = JSON.parse(dentistData);
        updateDentistInfo();
    }
    
    // Set up event listeners
    setupDentistEventListeners();
    
    // Load initial data
    loadDentistDashboardData();
}

function updateDentistInfo() {
    if (currentDentist) {
        // Update dentist name in header
        const dentistNameElements = document.querySelectorAll('.dentist-name');
        dentistNameElements.forEach(element => {
            element.textContent = currentDentist.name || 'Dr. Dentist';
        });
    }
}

function setupDentistEventListeners() {
    // Navigation clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (section) {
                showDentistSection(section);
            }
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('dentistLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ========================================
// SECTION NAVIGATION
// ========================================

function showDentistSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Find and activate the corresponding nav item
        const navItem = document.querySelector(`[onclick="showDentistSection('${sectionName}')"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Load section-specific data
        loadDentistSectionData(sectionName);
    }
}

function loadDentistSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDentistDashboardData();
            break;
        case 'schedule':
            loadSchedule();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'patients':
            loadPatients();
            break;
        case 'services':
            loadServices();
            break;
        case 'reports':
            loadReports();
            break;
        case 'settings':
            loadDentistSettings();
            break;
    }
}

// ========================================
// DASHBOARD DATA
// ========================================

async function loadDentistDashboardData() {
    try {
        // Load statistics
        const stats = await getDentistDashboardStats();
        updateDentistDashboardStats(stats);
        
        // Load recent appointments
        const recentAppointments = await getRecentAppointments(5);
        displayRecentAppointments(recentAppointments);
        
        // Load pending appointments
        const pendingAppointments = await getPendingAppointments();
        displayPendingAppointments(pendingAppointments);
        
    } catch (error) {
        console.error('Error loading dentist dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

async function getDentistDashboardStats() {
    try {
        if (window.firebaseFirestore && currentDentist) {
            // Get real data from Firebase
            const appointments = await window.firebaseFirestore.getAppointmentsByUser(currentDentist.uid, 'dentist');
            const patients = await getPatientsFromFirebase();
            const services = await getServicesFromFirebase();
            
            return {
                totalAppointments: appointments.length,
                pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
                completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
                totalPatients: patients.length,
                totalServices: services.length,
                todayAppointments: appointments.filter(apt => {
                    const today = new Date();
                    const aptDate = new Date(apt.appointmentDate);
                    return aptDate.toDateString() === today.toDateString();
                }).length
            };
        } else {
            // Fallback to local data
            return {
                totalAppointments: appointments.length,
                pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
                completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
                totalPatients: patients.length,
                totalServices: services.length,
                todayAppointments: 0
            };
        }
    } catch (error) {
        console.error('Error getting dentist dashboard stats:', error);
        return {
            totalAppointments: 0,
            pendingAppointments: 0,
            completedAppointments: 0,
            totalPatients: 0,
            totalServices: 0,
            todayAppointments: 0
        };
    }
}

function updateDentistDashboardStats(stats) {
    // Update stats cards
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
// APPOINTMENTS MANAGEMENT
// ========================================

async function loadAppointments() {
    try {
        if (window.firebaseFirestore && currentDentist) {
            appointments = await window.firebaseFirestore.getAppointmentsByUser(currentDentist.uid, 'dentist');
        } else {
            // Load from localStorage
            appointments = JSON.parse(localStorage.getItem('dentistAppointments') || '[]');
        }
        
        displayDentistAppointments();
    } catch (error) {
        console.error('Error loading appointments:', error);
        showToast('Error loading appointments', 'error');
    }
}

function displayDentistAppointments() {
    const appointmentsContainer = document.querySelector('#appointments-section .appointments-table tbody');
    if (!appointmentsContainer) return;
    
    if (appointments.length === 0) {
        appointmentsContainer.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div style="font-size: 3em; margin-bottom: 20px;">📅</div>
                        <h3>No Appointments Yet</h3>
                        <p>No appointments have been scheduled yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const appointmentsHTML = appointments.map(appointment => `
        <tr>
            <td>${appointment.patientName || 'Patient'}</td>
            <td>${appointment.service || 'Service'}</td>
            <td>${formatDate(appointment.appointmentDate)}</td>
            <td>${appointment.appointmentTime || 'TBD'}</td>
            <td>
                <span class="status status-${appointment.status || 'pending'}">
                    ${appointment.status || 'Pending'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewAppointment('${appointment.id}')">
                        View
                    </button>
                    <button class="btn btn-sm btn-success" onclick="confirmAppointment('${appointment.id}')">
                        Confirm
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="rescheduleAppointment('${appointment.id}')">
                        Reschedule
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${appointment.id}')">
                        Cancel
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    appointmentsContainer.innerHTML = appointmentsHTML;
}

function viewAppointment(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        showAppointmentModal(appointment);
    }
}

function showAppointmentModal(appointment) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'appointmentModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeAppointmentModal()">&times;</span>
            <h2>Appointment Details</h2>
            <div class="appointment-details">
                <div class="detail-row">
                    <strong>Patient:</strong> ${appointment.patientName || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Service:</strong> ${appointment.service || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Date:</strong> ${formatDate(appointment.appointmentDate)}
                </div>
                <div class="detail-row">
                    <strong>Time:</strong> ${appointment.appointmentTime || 'TBD'}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> ${appointment.status || 'Pending'}
                </div>
                <div class="detail-row">
                    <strong>Notes:</strong> ${appointment.notes || 'No notes'}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="confirmAppointment('${appointment.id}')">
                    Confirm
                </button>
                <button class="btn btn-warning" onclick="rescheduleAppointment('${appointment.id}')">
                    Reschedule
                </button>
                <button class="btn btn-danger" onclick="cancelAppointment('${appointment.id}')">
                    Cancel
                </button>
                <button class="btn btn-secondary" onclick="closeAppointmentModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.remove();
    }
}

async function confirmAppointment(appointmentId) {
    try {
        if (window.firebaseFirestore && currentDentist) {
            await window.firebaseFirestore.updateAppointment(appointmentId, { 
                status: 'confirmed',
                confirmedBy: currentDentist.uid,
                confirmedAt: new Date().toISOString()
            });
        } else {
            const appointment = appointments.find(apt => apt.id === appointmentId);
            if (appointment) {
                appointment.status = 'confirmed';
                localStorage.setItem('dentistAppointments', JSON.stringify(appointments));
            }
        }
        
        showToast('Appointment confirmed!', 'success');
        loadAppointments();
        closeAppointmentModal();
    } catch (error) {
        console.error('Error confirming appointment:', error);
        showToast('Error confirming appointment', 'error');
    }
}

async function rescheduleAppointment(appointmentId) {
    showToast('Reschedule appointment coming soon!', 'info');
}

async function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            if (window.firebaseFirestore && currentDentist) {
                await window.firebaseFirestore.updateAppointment(appointmentId, { 
                    status: 'cancelled',
                    cancelledBy: currentDentist.uid,
                    cancelledAt: new Date().toISOString()
                });
            } else {
                const appointment = appointments.find(apt => apt.id === appointmentId);
                if (appointment) {
                    appointment.status = 'cancelled';
                    localStorage.setItem('dentistAppointments', JSON.stringify(appointments));
                }
            }
            
            showToast('Appointment cancelled', 'success');
            loadAppointments();
            closeAppointmentModal();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            showToast('Error cancelling appointment', 'error');
        }
    }
}

// ========================================
// PATIENTS MANAGEMENT
// ========================================

async function loadPatients() {
    try {
        if (window.firebaseFirestore && currentDentist) {
            patients = await getPatientsFromFirebase();
        } else {
            patients = JSON.parse(localStorage.getItem('dentistPatients') || '[]');
        }
        
        displayPatients();
    } catch (error) {
        console.error('Error loading patients:', error);
        showToast('Error loading patients', 'error');
    }
}

async function getPatientsFromFirebase() {
    // This would connect to Firebase to get patient data
    return [
        {
            id: 'patient-001',
            name: 'Juan Dela Cruz',
            email: 'juan.delacruz@email.com',
            phone: '+63 912 345 6789',
            lastVisit: '2025-01-15',
            totalAppointments: 5,
            status: 'active'
        },
        {
            id: 'patient-002',
            name: 'Maria Garcia',
            email: 'maria.garcia@email.com',
            phone: '+63 917 123 4567',
            lastVisit: '2025-02-10',
            totalAppointments: 3,
            status: 'active'
        }
    ];
}

function displayPatients() {
    const patientsContainer = document.querySelector('#patients-section .patients-table tbody');
    if (!patientsContainer) return;
    
    if (patients.length === 0) {
        patientsContainer.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <div style="font-size: 3em; margin-bottom: 20px;">👥</div>
                        <h3>No Patients Yet</h3>
                        <p>No patients have been registered yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const patientsHTML = patients.map(patient => `
        <tr>
            <td>${patient.name}</td>
            <td>${patient.email}</td>
            <td>${patient.phone}</td>
            <td>${formatDate(patient.lastVisit)}</td>
            <td>${patient.totalAppointments}</td>
            <td>
                <span class="status status-${patient.status}">
                    ${patient.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewPatient('${patient.id}')">
                        View
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editPatient('${patient.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewPatientHistory('${patient.id}')">
                        History
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    patientsContainer.innerHTML = patientsHTML;
}

function viewPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        showPatientModal(patient);
    }
}

function showPatientModal(patient) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'patientModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closePatientModal()">&times;</span>
            <h2>Patient Details</h2>
            <div class="patient-details">
                <div class="detail-row">
                    <strong>Name:</strong> ${patient.name}
                </div>
                <div class="detail-row">
                    <strong>Email:</strong> ${patient.email}
                </div>
                <div class="detail-row">
                    <strong>Phone:</strong> ${patient.phone}
                </div>
                <div class="detail-row">
                    <strong>Last Visit:</strong> ${formatDate(patient.lastVisit)}
                </div>
                <div class="detail-row">
                    <strong>Total Appointments:</strong> ${patient.totalAppointments}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> ${patient.status}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="editPatient('${patient.id}')">
                    Edit Patient
                </button>
                <button class="btn btn-info" onclick="viewPatientHistory('${patient.id}')">
                    View History
                </button>
                <button class="btn btn-secondary" onclick="closePatientModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closePatientModal() {
    const modal = document.getElementById('patientModal');
    if (modal) {
        modal.remove();
    }
}

function editPatient(patientId) {
    showToast('Edit patient coming soon!', 'info');
}

function viewPatientHistory(patientId) {
    showToast('Patient history coming soon!', 'info');
}

function addNewPatient() {
    showToast('Add new patient coming soon!', 'info');
}

function exportPatients() {
    showToast('Export patients coming soon!', 'info');
}

// ========================================
// SERVICES MANAGEMENT
// ========================================

async function loadServices() {
    try {
        if (window.firebaseFirestore && currentDentist) {
            services = await getServicesFromFirebase();
        } else {
            services = JSON.parse(localStorage.getItem('dentistServices') || '[]');
        }
        
        displayServices();
    } catch (error) {
        console.error('Error loading services:', error);
        showToast('Error loading services', 'error');
    }
}

async function getServicesFromFirebase() {
    // This would connect to Firebase to get services
    return [
        {
            id: 'service-001',
            name: 'Dental Cleaning',
            description: 'Professional teeth cleaning and oral hygiene maintenance',
            price: 2500,
            duration: 60,
            status: 'active'
        },
        {
            id: 'service-002',
            name: 'Teeth Whitening',
            description: 'Safe and effective teeth whitening treatment',
            price: 8000,
            duration: 120,
            status: 'active'
        },
        {
            id: 'service-003',
            name: 'Tooth Extraction',
            description: 'Safe and painless tooth extraction procedure',
            price: 3500,
            duration: 90,
            status: 'active'
        }
    ];
}

function displayServices() {
    const servicesContainer = document.querySelector('#services-section .services-table tbody');
    if (!servicesContainer) return;
    
    if (services.length === 0) {
        servicesContainer.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="empty-state">
                        <div style="font-size: 3em; margin-bottom: 20px;">🛠️</div>
                        <h3>No Services Yet</h3>
                        <p>No services have been added yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const servicesHTML = services.map(service => `
        <tr>
            <td>${service.name}</td>
            <td>${service.description}</td>
            <td>₱${service.price.toLocaleString()}</td>
            <td>${service.duration} minutes</td>
            <td>
                <span class="status status-${service.status}">
                    ${service.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewService('${service.id}')">
                        View
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editService('${service.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteService('${service.id}')">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    servicesContainer.innerHTML = servicesHTML;
}

function viewService(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        showToast(`Service: ${service.name} - ₱${service.price.toLocaleString()}`, 'info');
    }
}

function editService(serviceId) {
    showToast('Edit service coming soon!', 'info');
}

function deleteService(serviceId) {
    if (confirm('Are you sure you want to delete this service?')) {
        showToast('Delete service coming soon!', 'info');
    }
}

function addNewService() {
    showToast('Add new service coming soon!', 'info');
}

// ========================================
// REPORTS MANAGEMENT
// ========================================

async function loadReports() {
    try {
        reports = await getReportsFromFirebase();
        displayReports();
    } catch (error) {
        console.error('Error loading reports:', error);
        showToast('Error loading reports', 'error');
    }
}

async function getReportsFromFirebase() {
    // This would connect to Firebase to get reports data
    return {
        monthlyRevenue: 125000,
        totalAppointments: 45,
        completedAppointments: 42,
        pendingAppointments: 3,
        totalPatients: 28,
        averageAppointmentValue: 2778
    };
}

function displayReports() {
    const reportsContainer = document.querySelector('#reports-section .reports-content');
    if (!reportsContainer) return;
    
    reportsContainer.innerHTML = `
        <div class="reports-grid">
            <div class="report-card">
                <h3>Monthly Revenue</h3>
                <div class="report-value">₱${reports.monthlyRevenue.toLocaleString()}</div>
            </div>
            <div class="report-card">
                <h3>Total Appointments</h3>
                <div class="report-value">${reports.totalAppointments}</div>
            </div>
            <div class="report-card">
                <h3>Completed Appointments</h3>
                <div class="report-value">${reports.completedAppointments}</div>
            </div>
            <div class="report-card">
                <h3>Pending Appointments</h3>
                <div class="report-value">${reports.pendingAppointments}</div>
            </div>
            <div class="report-card">
                <h3>Total Patients</h3>
                <div class="report-value">${reports.totalPatients}</div>
            </div>
            <div class="report-card">
                <h3>Average Appointment Value</h3>
                <div class="report-value">₱${reports.averageAppointmentValue.toLocaleString()}</div>
            </div>
        </div>
    `;
}

function generateReport() {
    showToast('Generate report coming soon!', 'info');
}

function exportReport() {
    showToast('Export report coming soon!', 'info');
}

// ========================================
// SCHEDULE MANAGEMENT
// ========================================

function loadSchedule() {
    // Schedule is already loaded in the HTML
    // This function can be used to refresh schedule data
}

function addTimeSlot() {
    showToast('Add time slot coming soon!', 'info');
}

// ========================================
// SETTINGS MANAGEMENT
// ========================================

function loadDentistSettings() {
    // Settings are already loaded in the HTML
    // This function can be used to refresh settings data
}

function updateDentistProfile() {
    showToast('Update profile coming soon!', 'info');
}

function changeDentistPassword() {
    showToast('Change password coming soon!', 'info');
}

function saveDentistSettings() {
    showToast('Settings saved!', 'success');
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
