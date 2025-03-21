const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChargingStation',
    required: true
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'Checked-in', 'Completed', 'No Show'],
    default: 'Confirmed'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ station: 1 });
bookingSchema.index({ timeSlot: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema); 