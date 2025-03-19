const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  picture: String,
  vehicleDetails: {
    make: String,
    model: String,
    year: Number,
    batteryCapacity: Number, // in kWh
    maxChargingRate: Number  // in kW
  },
  chargingPreferences: {
    preferredConnectorType: String,
    preferredChargingTime: String,
    maxChargingCost: Number
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  favoriteStations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargingStation'
  }],
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema); 