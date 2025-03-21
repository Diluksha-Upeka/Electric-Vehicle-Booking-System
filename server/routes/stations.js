const express = require('express');
const router = express.Router();
const ChargingStation = require('../models/ChargingStation');
const { authenticateJWT, authorize } = require('./auth');
const User = require('../models/User');
const TimeSlot = require('../models/TimeSlot');
const stationService = require('../services/stationService');

// Create a new station (admin only)
router.post('/', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const station = await stationService.createStation(req.body);
    res.status(201).json(station);
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ message: error.message || 'Error creating station' });
  }
});

// Update a station (admin only)
router.put('/:id', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const station = await ChargingStation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    
    res.json(station);
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({ message: 'Error updating station' });
  }
});

// Delete a station (admin only)
router.delete('/:id', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const station = await ChargingStation.findByIdAndDelete(req.params.id);
    
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    
    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ message: 'Error deleting station' });
  }
});

// Get all stations
router.get('/', async (req, res) => {
  try {
    const stations = await ChargingStation.find({ status: 'active' });
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stations' });
  }
});

// Get user's favorite stations
router.get('/favorites', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteStations');
    res.json(user.favoriteStations || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorite stations' });
  }
});

// Get nearby charging stations
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query; // maxDistance in meters

    const stations = await ChargingStation.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: 'active'
    });

    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Error finding nearby stations' });
  }
});

// Get station details
router.get('/:id', async (req, res) => {
  try {
    const station = await ChargingStation.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.json(station);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching station details' });
  }
});

// Get available time slots for a station
router.get('/:id/time-slots', async (req, res) => {
  try {
    const { date } = req.query;
    const station = await ChargingStation.findById(req.params.id);
    
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    // Get time slots for the selected date
    const timeSlots = await TimeSlot.find({
      station: req.params.id,
      date: new Date(date),
      status: 'Available',
      availableSpots: { $gt: 0 }
    }).sort({ startTime: 1 });

    res.json({ slots: timeSlots });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ message: 'Error fetching time slots', error: error.message });
  }
});

// Calculate charging time
router.post('/:id/calculate-charging-time', async (req, res) => {
  try {
    const { currentBatteryPercentage, targetBatteryPercentage } = req.body;
    const station = await ChargingStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    // Get the highest power output from available connectors
    const maxPowerOutput = Math.max(...station.connectors.map(c => c.powerOutput));

    // Calculate charging time (simplified)
    // This is a basic calculation and should be adjusted based on actual charging curves
    const batteryCapacity = 75; // Example battery capacity in kWh
    const powerEfficiency = 0.9; // Charging efficiency factor
    const batteryDifference = targetBatteryPercentage - currentBatteryPercentage;
    const energyNeeded = (batteryCapacity * batteryDifference) / 100;
    const chargingTimeHours = energyNeeded / (maxPowerOutput * powerEfficiency);
    const chargingTimeMinutes = Math.round(chargingTimeHours * 60);

    res.json({
      estimatedChargingTime: chargingTimeMinutes,
      powerOutput: maxPowerOutput
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating charging time' });
  }
});

// Add a review for a station
router.post('/:id/reviews', authenticateJWT, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const station = await ChargingStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    station.reviews.push({
      user: req.user._id,
      rating,
      comment
    });

    // Update average rating
    const totalRating = station.reviews.reduce((sum, review) => sum + review.rating, 0);
    station.rating = totalRating / station.reviews.length;

    await station.save();
    res.json(station);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review' });
  }
});

module.exports = router; 