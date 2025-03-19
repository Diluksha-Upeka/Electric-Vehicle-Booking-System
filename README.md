# EV Charging Booking System

A full-stack MERN application for electric vehicle charging station booking and management.

## Features

- User Authentication & Management
  - Google OAuth integration
  - JWT authentication
  - User profile management
- EV Charging Station Booking
  - Find nearby charging stations
  - View station details
  - Real-time availability
  - Booking management
- Battery & Charging Time Calculator
  - Battery percentage input
  - Estimated charging time calculation

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT, Google OAuth
- Maps: Google Maps API
- Real-time updates: Socket.io

## Project Structure

```
evcbs/
├── client/             # React frontend
├── server/             # Node.js backend
├── .env                # Environment variables
└── README.md          # Project documentation
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
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
   ```

## API Documentation

The API documentation will be available at `/api-docs` when the server is running.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 