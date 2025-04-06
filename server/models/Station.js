const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  openingTime: {
    type: String, // Format: "HH:mm AM/PM"
    required: true
  },
  closingTime: {
    type: String, // Format: "HH:mm AM/PM"
    required: true
  },
  totalChargers: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Add indexes for better query performance
stationSchema.index({ name: 1 });
stationSchema.index({ status: 1 });
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema); 