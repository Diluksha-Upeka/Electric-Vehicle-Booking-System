const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Admin route to clean up all old bookings
router.post('/cleanup', adminAuth, async (req, res) => {
  try {
    const result = await bookingService.cleanupAllBookings();
    res.json(result);
  } catch (error) {
    console.error('Error in cleanup route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available time slots
router.get('/slots/:stationId/:date', auth, async (req, res) => {
  try {
    const { stationId, date } = req.params;
    const slots = await bookingService.getAvailableSlots(stationId, date);
    res.json(slots);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new booking
router.post('/', auth, async (req, res) => {
  try {
    const { stationId, timeSlotId, paymentDetails } = req.body;
    const booking = await bookingService.createBooking(req.user._id, stationId, timeSlotId, paymentDetails);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user._id);
    res.json(bookings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user._id);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get booking details
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingDetails(req.params.id, req.user._id);
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 