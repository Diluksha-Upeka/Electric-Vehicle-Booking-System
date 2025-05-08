const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const { authenticateJWT, authorize } = require('./auth');
const bookingService = require('../services/bookingService');
const TimeSlot = require('../models/TimeSlot');

// Create a new booking
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { stationId, timeSlotId, paymentDetails } = req.body;
    const userId = req.user._id;

    console.log('Received booking request:', {
      userId,
      stationId,
      timeSlotId,
      paymentDetails
    });

    // Validate required fields
    if (!stationId || !timeSlotId) {
      console.error('Missing required fields:', { stationId, timeSlotId });
      return res.status(400).json({ error: 'Station ID and Time Slot ID are required' });
    }

    // Create the booking
    const booking = await bookingService.createBooking(userId, stationId, timeSlotId, paymentDetails);

    // Return the created booking
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        station: {
          id: booking.station._id,
          name: booking.station.name,
          location: booking.station.location
        },
        date: booking.date,
        timeSlot: {
          startTime: booking.timeSlot.startTime,
          endTime: booking.timeSlot.endTime
        },
        totalAmount: booking.totalAmount,
        advanceAmount: booking.advanceAmount,
        remainingAmount: booking.remainingAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateJWT, async (req, res) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user._id);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking details
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const booking = await bookingService.getBookingDetails(req.params.id, req.user._id);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', authenticateJWT, async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user._id);
    res.json(booking);
  } catch (error) {
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

    console.log('Fetching time slots for station:', stationId, 'date:', date);

    if (!stationId || !date) {
      console.log('Missing required parameters:', { stationId, date });
      return res.status(400).json({ error: 'Station ID and date are required' });
    }

    const station = await ChargingStation.findById(stationId);
    if (!station) {
      console.log('Station not found:', stationId);
      return res.status(404).json({ error: 'Station not found' });
    }

    console.log('Found station:', {
      id: station._id,
      name: station.name,
      connectors: station.numberOfConnectors,
      status: station.status
    });

    if (station.status !== 'active') {
      console.log('Station is not active:', station.status);
      return res.status(400).json({ error: 'Station is not active' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid date format:', date);
      return res.status(400).json({ error: 'Invalid date format' });
    }

    console.log('Parsed date:', parsedDate.toISOString());

    const availableSlots = await bookingService.getAvailableSlots(stationId, parsedDate);
    console.log('Available slots found:', availableSlots.slots?.length || 0);
    
    // Ensure each slot has all required fields
    const formattedSlots = (availableSlots.slots || []).map(slot => ({
      _id: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      availableSpots: slot.availableSpots || 0,
      totalSpots: slot.totalSpots || 0,
      status: slot.status || 'Available'
    }));

    // Create the response object
    const response = {
      stationId,
      date: parsedDate.toISOString(),
      stationName: station.name,
      slots: formattedSlots
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up random bookings
router.post('/cleanup', async (req, res) => {
  try {
    const result = await bookingService.cleanupRandomBookings();
    res.json(result);
  } catch (error) {
    console.error('Error in cleanup route:', error);
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