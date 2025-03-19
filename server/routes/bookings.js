const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { authenticateJWT, authorize } = require('./auth');

// Create a new booking (authenticated)
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { stationId, connector, startTime, endTime, batteryDetails } = req.body;

    // Check if station exists and is available
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    // Check if time slot is available
    const isAvailable = await checkSlotAvailability(stationId, startTime, endTime);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Time slot is not available' });
    }

    // Calculate estimated cost
    const estimatedCost = await calculateEstimatedCost(station, startTime, endTime);

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      station: stationId,
      connector,
      startTime,
      endTime,
      batteryDetails,
      cost: {
        estimated: estimatedCost
      }
    });

    await booking.save();

    // Update station time slots
    await updateStationTimeSlots(stationId, startTime, endTime);

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking' });
  }
});

// Get user's bookings (authenticated)
router.get('/my-bookings', authenticateJWT, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('station')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Cancel booking (authenticated)
router.post('/:id/cancel', authenticateJWT, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns the booking or is admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason;
    await booking.save();

    // Free up the time slot
    await freeUpTimeSlot(booking.station, booking.startTime, booking.endTime);

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

// Admin routes
// Get all bookings (admin only)
router.get('/', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'firstName lastName email')
      .populate('station', 'name location')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Update booking status (admin only)
router.put('/:id/status', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

// Helper functions
async function checkSlotAvailability(stationId, startTime, endTime) {
  const conflictingBookings = await Booking.find({
    station: stationId,
    status: { $ne: 'cancelled' },
    $or: [
      {
        startTime: { $lte: endTime },
        endTime: { $gte: startTime }
      }
    ]
  });

  return conflictingBookings.length === 0;
}

async function calculateEstimatedCost(station, startTime, endTime) {
  const duration = (endTime - startTime) / (1000 * 60 * 60); // in hours
  const cost = duration * station.pricing.ratePerHour;
  return Math.max(cost, station.pricing.minimumCharge);
}

async function updateStationTimeSlots(stationId, startTime, endTime) {
  // Implementation for updating station time slots
  // This would mark the time slot as booked
}

async function freeUpTimeSlot(stationId, startTime, endTime) {
  // Implementation for freeing up time slots
  // This would mark the time slot as available
}

module.exports = router; 