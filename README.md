# Electric Vehicle Charging Booking System

A comprehensive MERN stack application for managing electric vehicle charging stations and bookings. This system allows users to find, book, and manage charging stations while providing administrators with tools to manage stations and users.

## Features

### User Features
- User Authentication & Authorization
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Secure password handling
- User Profile Management
  - View and update personal information
  - View booking history
  - Manage account settings
- Real-time Notifications
  - Booking confirmations
  - Station availability alerts
  - Payment confirmations

### Charging Station Features
- Station Management
  - View all available charging stations
  - Detailed station information
  - Station status and availability
  - Real-time availability updates
- Booking System
  - Real-time station booking
  - Booking history tracking
  - Booking status management
  - Automated booking reminders
- Station Categories
  - Different types of charging stations
  - Station specifications
  - Pricing information
  - Station ratings and reviews

### Admin Features
- Station Management
  - Add new charging stations
  - Update station details
  - Manage station availability
  - Station performance analytics
- User Management
  - View all users
  - Manage user roles
  - User activity monitoring
  - User feedback management
- Booking Management
  - View all bookings
  - Manage booking status
  - Booking analytics
  - Revenue tracking

### Mobile App Features
- Cross-platform mobile application
- Real-time station location tracking
- Push notifications
- Offline mode support
- QR code scanning for quick station access
- Mobile payment integration

## Tech Stack

- **Frontend**: 
  - React.js
  - Material-UI
  - Redux for state management
  - Axios for API calls
- **Backend**: 
  - Node.js with Express
  - MongoDB with Mongoose
  - Socket.IO for real-time features
- **Mobile**: 
  - React Native
  - Expo
- **Database**: MongoDB
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI
- **Payment Integration**: Stripe
- **Maps Integration**: Google Maps API

## Project Structure

```
EVCBSNEW/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── context/      # React context
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── mobile/               # React Native mobile app
│   ├── src/
│   │   ├── components/   # Mobile components
│   │   ├── screens/      # Mobile screens
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
└── README.md             # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/Diluksha-Upeka/Electric-Vehicle-Booking-System.git
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install

   # Install mobile app dependencies
   cd ../mobile
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   STRIPE_SECRET_KEY=your_stripe_secret_key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd client
   npm start

   # Start mobile app
   cd mobile
   npm start
   ```

## Deployment Instructions

### Backend Deployment (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to `/server`
4. Add environment variables
5. Deploy

### Frontend Deployment (Vercel)
1. Create a new project on Vercel
2. Connect your GitHub repository
3. Set the root directory to `/client`
4. Add environment variables
5. Deploy

### Mobile App Deployment
1. Build the app using Expo:
   ```bash
   cd mobile
   expo build:android
   expo build:ios
   ```
2. Submit to app stores:
   - Google Play Store for Android
   - Apple App Store for iOS

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile
- POST `/api/auth/refresh-token` - Refresh JWT token

### Stations
- GET `/api/stations` - Get all stations
- GET `/api/stations/:id` - Get station details
- POST `/api/stations` - Create new station (Admin)
- PUT `/api/stations/:id` - Update station (Admin)
- DELETE `/api/stations/:id` - Delete station (Admin)
- GET `/api/stations/nearby` - Get nearby stations

### Bookings
- GET `/api/bookings` - Get all bookings
- POST `/api/bookings` - Create new booking
- PUT `/api/bookings/:id` - Update booking status
- GET `/api/bookings/user/:userId` - Get user's bookings
- POST `/api/bookings/:id/cancel` - Cancel booking

### Users
- GET `/api/users` - Get all users (Admin)
- PUT `/api/users/:id` - Update user (Admin)
- DELETE `/api/users/:id` - Delete user (Admin)
- GET `/api/users/:id/bookings` - Get user's booking history

### Payments
- POST `/api/payments/create-intent` - Create payment intent
- POST `/api/payments/confirm` - Confirm payment
- GET `/api/payments/history` - Get payment history

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- Material-UI for the frontend components
- MongoDB for the database
- Expo for mobile app development
- Stripe for payment processing
- Google Maps for location services 