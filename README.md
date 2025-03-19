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

### Charging Station Features
- Station Management
  - View all available charging stations
  - Detailed station information
  - Station status and availability
- Booking System
  - Real-time station booking
  - Booking history tracking
  - Booking status management
- Station Categories
  - Different types of charging stations
  - Station specifications
  - Pricing information

### Admin Features
- Station Management
  - Add new charging stations
  - Update station details
  - Manage station availability
- User Management
  - View all users
  - Manage user roles
  - User activity monitoring
- Booking Management
  - View all bookings
  - Manage booking status
  - Booking analytics

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI

## Project Structure

```
EVCBSNEW/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   └── server.js         # Main server file
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
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd client
   npm start
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile

### Stations
- GET `/api/stations` - Get all stations
- GET `/api/stations/:id` - Get station details
- POST `/api/stations` - Create new station (Admin)
- PUT `/api/stations/:id` - Update station (Admin)
- DELETE `/api/stations/:id` - Delete station (Admin)

### Bookings
- GET `/api/bookings` - Get all bookings
- POST `/api/bookings` - Create new booking
- PUT `/api/bookings/:id` - Update booking status
- GET `/api/bookings/user/:userId` - Get user's bookings

### Users
- GET `/api/users` - Get all users (Admin)
- PUT `/api/users/:id` - Update user (Admin)
- DELETE `/api/users/:id` - Delete user (Admin)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 