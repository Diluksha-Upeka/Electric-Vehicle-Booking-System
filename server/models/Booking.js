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
  date: {
    type: Date,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  advanceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Advance Paid', 'Fully Paid'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED'],
    default: 'CONFIRMED'
  },
  paymentId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for remaining amount
bookingSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.advanceAmount;
});

// Add indexes for better query performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ station: 1 });
bookingSchema.index({ timeSlot: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ date: 1 });

module.exports = mongoose.model('Booking', bookingSchema); 