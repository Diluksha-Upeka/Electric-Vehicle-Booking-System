const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const { authenticateJWT, authorize } = require('./auth');
const bookingService = require('../services/bookingService');
const TimeSlot = require('../models/TimeSlot');

// Create a new booking (authenticated)
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { stationId, timeSlotId } = req.body;
    const userId = req.user._id; // From JWT token

    console.log('Booking request received:', { stationId, timeSlotId, userId });

    if (!stationId || !timeSlotId) {
      return res.status(400).json({ error: 'Station ID and Time Slot ID are required' });
    }

    // Verify station exists
    const station = await ChargingStation.findById(stationId);
    if (!station) {
      console.error('Station not found:', stationId);
      return res.status(404).json({ error: 'Station not found' });
    }

    // Verify time slot exists and is available
    const timeSlot = await TimeSlot.findById(timeSlotId);
    if (!timeSlot) {
      console.error('Time slot not found:', timeSlotId);
      return res.status(404).json({ error: 'Time slot not found' });
    }

    if (timeSlot.status !== 'Available' || timeSlot.availableSpots <= 0) {
      console.error('Time slot not available:', { timeSlotId, status: timeSlot.status, availableSpots: timeSlot.availableSpots });
      return res.status(400).json({ error: 'Time slot is not available' });
    }

    // Lock the time slot first
    try {
      await bookingService.lockTimeSlot(timeSlotId);
      console.log('Time slot locked successfully:', timeSlotId);
    } catch (error) {
      console.error('Error locking time slot:', error);
      return res.status(400).json({ error: error.message });
    }

    // Create the booking
    const booking = await bookingService.createBooking(userId, stationId, timeSlotId);
    console.log('Booking created successfully:', booking);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings (authenticated)
router.get('/my-bookings', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id; // From JWT token
    const bookings = await bookingService.getUserBookings(userId);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel a booking
router.post('/:bookingId/cancel', authenticateJWT, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id; // From JWT token

    const booking = await bookingService.cancelBooking(bookingId, userId);
    res.json(booking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
// Get all bookings (admin only)
router.get('/', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'firstName lastName email')
      .populate('station', 'name location address')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
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

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // Update station connector status based on new booking status
    if (status === 'completed' || status === 'cancelled') {
      await freeUpTimeSlot(booking.station, booking.startTime, booking.endTime, booking.connector);
    } else if (status === 'in_progress') {
      await updateStationTimeSlots(booking.station, booking.startTime, booking.endTime, booking.connector);
    }

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

// Get available time slots for a station
router.get('/stations/:stationId/time-slots', authenticateJWT, async (req, res) => {
  try {
    const { stationId } = req.params;
    const { date } = req.query;

    if (!stationId || !date) {
      return res.status(400).json({ error: 'Station ID and date are required' });
    }

    const station = await ChargingStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const availableSlots = await bookingService.getAvailableSlots(stationId, new Date(date));
    res.json(availableSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function checkOperatingHours(operatingHours, startTime, endTime) {
  if (!operatingHours || !operatingHours.start || !operatingHours.end) {
    return true; // If no operating hours specified, assume 24/7
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Convert operating hours to Date objects for the same day
  const [startHour, startMinute] = operatingHours.start.split(':');
  const [endHour, endMinute] = operatingHours.end.split(':');
  
  const operatingStart = new Date(start);
  operatingStart.setHours(parseInt(startHour), parseInt(startMinute), 0);
  
  const operatingEnd = new Date(start);
  operatingEnd.setHours(parseInt(endHour), parseInt(endMinute), 0);

  // Handle overnight operating hours
  if (operatingEnd < operatingStart) {
    operatingEnd.setDate(operatingEnd.getDate() + 1);
  }

  return start >= operatingStart && end <= operatingEnd;
}

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
  return Math.max(cost, station.pricing.minimumCharge || 0);
}

async function updateStationTimeSlots(stationId, startTime, endTime, connectorType) {
  const station = await ChargingStation.findById(stationId);
  if (!station) return;

  // Update connector status
  const connector = station.connectors.find(c => c.type === connectorType);
  if (connector) {
    connector.status = 'in_use';
  }

  await station.save();
}

async function freeUpTimeSlot(stationId, startTime, endTime, connectorType) {
  const station = await ChargingStation.findById(stationId);
  if (!station) return;

  // Update connector status
  const connector = station.connectors.find(c => c.type === connectorType);
  if (connector) {
    connector.status = 'available';
  }

  await station.save();
}

module.exports = router; 