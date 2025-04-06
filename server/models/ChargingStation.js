const mongoose = require('mongoose');

const chargingStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false
    },
    address: {
      type: String,
      required: false
    }
  },
  numberOfConnectors: {
    type: Number,
    required: true,
    min: 1
  },
  ratePerHour: {
    type: Number,
    required: true,
    min: 0
  },
  openingTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM AM/PM`
    }
  },
  closingTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM AM/PM`
    }
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
    lowercase: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
chargingStationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ChargingStation', chargingStationSchema); 