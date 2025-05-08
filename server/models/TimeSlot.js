const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargingStation',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:mm AM/PM"
    required: true
  },
  endTime: {
    type: String, // Format: "HH:mm AM/PM"
    required: true
  },
  totalSpots: {
    type: Number,
    required: true,
    min: 1
  },
  availableSpots: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Booked'],
    default: 'Available'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Add indexes for better query performance
timeSlotSchema.index({ station: 1, date: 1, startTime: 1, endTime: 1 });
timeSlotSchema.index({ status: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema); 