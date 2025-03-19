const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const { authenticateJWT } = require('./auth');

// Get user profile
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { vehicleDetails, chargingPreferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { vehicleDetails, chargingPreferences },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile' });
  }
});

// Get user's booking history
router.get('/bookings', authenticateJWT, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('station')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking history' });
  }
});

module.exports = router; 