// QR Code Generator for Delas Alas Dental Clinic
// This file handles QR code generation for patient appointments

class QRCodeGenerator {
    constructor() {
        // Load QR code library if not already loaded
        this.loadQRCodeLibrary();
    }

    // Load QR Code library dynamically
    loadQRCodeLibrary() {
        if (typeof QRCode === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }

    // Generate QR code for a patient
    async generatePatientQR(patientId, elementId) {
        try {
            // Wait for QRCode library to load
            await this.waitForQRCodeLibrary();
            
            // Create URL for patient appointments
            const appointmentUrl = `${window.location.origin}/patient-appointments.html?id=${patientId}`;
            
            // Generate QR code
            QRCode.toCanvas(document.getElementById(elementId), appointmentUrl, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#2c3e50',
                    light: '#ffffff'
                }
            }, (error) => {
                if (error) {
                    console.error('Error generating QR code:', error);
                }
            });
            
            return appointmentUrl;
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    }

    // Generate QR code as data URL
    async generateQRDataURL(patientId) {
        try {
            // Wait for QRCode library to load
            await this.waitForQRCodeLibrary();
            
            // Create URL for patient appointments
            const appointmentUrl = `${window.location.origin}/patient-appointments.html?id=${patientId}`;
            
            // Generate QR code as data URL
            return new Promise((resolve, reject) => {
                QRCode.toDataURL(appointmentUrl, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#2c3e50',
                        light: '#ffffff'
                    }
                }, (error, url) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(url);
                    }
                });
            });
        } catch (error) {
            console.error('Error generating QR code data URL:', error);
            return null;
        }
    }

    // Wait for QR Code library to load
    waitForQRCodeLibrary() {
        return new Promise((resolve) => {
            const checkLibrary = () => {
                if (typeof QRCode !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkLibrary, 100);
                }
            };
            checkLibrary();
        });
    }

    // Download QR code as image
    async downloadQRCode(patientId, patientName) {
        try {
            const dataUrl = await this.generateQRDataURL(patientId);
            if (!dataUrl) return;
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${patientName.replace(/\s+/g, '_')}_appointment_qr.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading QR code:', error);
        }
    }
}

// Create global instance
const qrCodeGenerator = new QRCodeGenerator();