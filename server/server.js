const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "https://electric-vehicle-booking-system.vercel.app",
  "https://electric-vehicle-booking-sy-git-90e642-diluksha-upekas-projects.vercel.app",
  "https://evcbs-backend.onrender.com"
].filter(Boolean); // Remove any undefined values

// Log allowed origins for debugging
console.log('Allowed Origins:', allowedOrigins);

const io = socketIo(server, {
  cors: {
    origin: "*",  // Allow all origins for Socket.IO
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Log the origin for debugging
    console.log('Request Origin:', origin);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked by CORS:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400 // 24 hours
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/stations', require('./routes/stations'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-station', (stationId) => {
    socket.join(`station-${stationId}`);
  });

  socket.on('leave-station', (stationId) => {
    socket.leave(`station-${stationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evcbs', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 