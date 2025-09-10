# Delas Alas Dental Clinic - Online Appointment and Patient Management System

A comprehensive full-stack web application for managing dental clinic operations, built with PHP, HTML, CSS, JavaScript, and Firebase.

## 🏗️ Project Structure

The application has been restructured to use separate PHP files for different screens, making it more organized and maintainable:

```
dental-clinic/
├── index.php                 # Home page
├── login.php                 # Login page
├── register.php              # Registration page with role selection
├── dashboard.php             # Dashboard router (redirects based on role)
├── patient-dashboard.php     # Patient dashboard
├── dentist-dashboard.php     # Dentist dashboard
├── services.php              # Services page
├── about.php                 # About us page
├── contact.php               # Contact page
├── auth-handler.php          # PHP authentication handler
├── server.js                 # Node.js backend server
├── package.json              # Node.js dependencies
├── assets/
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   └── js/
│       ├── app.js           # Main JavaScript application
│       └── firebase-config.js # Firebase configuration
├── firebase.json             # Firebase hosting configuration
└── .gitignore               # Git ignore file
```

## 🚀 Features

### Patient Features
- User registration and login
- Browse dental services
- Book appointments
- View appointment history
- Edit profile information
- QR code scanning interface

### Dentist Features
- Professional dashboard with statistics
- Patient management
- Appointment approval/rejection
- Schedule management
- Patient consultation tools
- Report generation

### General Features
- Responsive design for mobile and desktop
- Role-based access control
- Secure authentication
- Modern UI/UX design
- Toast notifications
- Loading states

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4+, Node.js with Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Hosting**: Firebase Hosting
- **Styling**: Custom CSS with Font Awesome icons

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- All modern web browsers

## 🔐 Authentication & Security

- **Role-based Access Control**: Separate dashboards for patients and dentists
- **Secure Sessions**: PHP session management
- **Firebase Security**: Firestore security rules
- **Input Validation**: Client and server-side validation

## 🚀 Getting Started

### Prerequisites
- PHP 7.4 or higher
- Node.js 14 or higher
- Firebase account
- Web server (Apache/Nginx) or PHP built-in server

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dental-clinic
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Update `assets/js/firebase-config.js` with your credentials

4. **Start the development server**
   ```bash
   # Start PHP server
   php -S localhost:8000
   
   # Start Node.js server (in another terminal)
   npm start
   ```

5. **Access the application**
   - Open `http://localhost:8000` in your browser

## 🔧 Configuration

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Update `assets/js/firebase-config.js` with your project credentials

### Environment Variables
Create a `.env` file in the root directory:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## 📁 File Descriptions

### PHP Files
- **index.php**: Main landing page with hero section and service previews
- **login.php**: User authentication page
- **register.php**: User registration with role selection (patient/dentist)
- **dashboard.php**: Router that redirects users to appropriate dashboard
- **patient-dashboard.php**: Patient-specific dashboard with appointments and booking
- **dentist-dashboard.php**: Dentist dashboard with patient management and statistics
- **services.php**: Detailed services page
- **about.php**: Clinic information and team details
- **contact.php**: Contact form and clinic information
- **auth-handler.php**: PHP backend for authentication

### JavaScript Files
- **app.js**: Main application logic and dashboard functionality
- **firebase-config.js**: Firebase configuration and data management

### CSS Files
- **style.css**: Complete styling for all pages and components

## 🎨 Design Features

- **Modern UI**: Clean, professional dental clinic design
- **Color Scheme**: Medical blue and white theme
- **Typography**: Readable fonts with proper hierarchy
- **Icons**: Font Awesome icons throughout the interface
- **Animations**: Smooth transitions and hover effects
- **Cards**: Modern card-based layout for information display

## 🔄 Dashboard Navigation

### Patient Dashboard
- Contact Information
- Scan QR Code
- My Appointments
- Book Appointment
- Profile Management

### Dentist Dashboard
- Overview Statistics
- Next Patient Information
- Approval Requests
- Schedule Management
- Patient History
- Reports and Analytics

## 📊 Statistics Dashboard

The dentist dashboard includes:
- Total Patients count
- Total Services count
- Pending Approvals count
- Total Dentists count
- Interactive report generation

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Deploy: `firebase deploy`

### Traditional Hosting
1. Upload files to your web server
2. Ensure PHP is enabled
3. Configure database connections
4. Set proper file permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: info@delasalasdental.com
- Phone: +1 234 567 8900
- Create an issue in the repository

## 🔮 Future Enhancements

- **Real-time Chat**: Patient-dentist communication
- **Payment Integration**: Online payment processing
- **Telemedicine**: Video consultation capabilities
- **Mobile App**: Native mobile applications
- **Analytics Dashboard**: Advanced reporting and insights
- **Multi-language Support**: Internationalization
- **Advanced Scheduling**: Calendar integration and reminders

---

**Built with ❤️ for Delas Alas Dental Clinic**
