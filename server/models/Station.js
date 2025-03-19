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
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  connectors: [{
    type: {
      type: String,
      required: true,
      enum: ['Type 1', 'Type 2', 'CCS', 'CHAdeMO']
    },
    powerOutput: {
      type: Number, // in kW
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'offline'],
      default: 'available'
    }
  }],
  operatingHours: {
    start: String, // Format: "HH:mm"
    end: String,   // Format: "HH:mm"
    timezone: String
  },
  pricing: {
    ratePerHour: Number,
    ratePerKWh: Number,
    minimumCharge: Number
  },
  amenities: [{
    type: String,
    enum: ['restaurant', 'cafe', 'restroom', 'parking', 'wifi']
  }],
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add geospatial index for location-based queries
stationSchema.index({ location: '2dsphere' });

// Calculate average rating before saving
stationSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    this.averageRating = this.reviews.reduce((acc, review) => acc + review.rating, 0) / this.reviews.length;
  }
  next();
});

module.exports = mongoose.model('Station', stationSchema); 