const express = require('express');
const router = express.Router();
const ChargingStation = require('../models/ChargingStation');
const { authenticateJWT, authorize } = require('./auth');
const User = require('../models/User');
const TimeSlot = require('../models/TimeSlot');
const stationService = require('../services/stationService');
const bookingService = require('../services/bookingService');

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
    console.log('Received update request for station:', req.params.id);
    console.log('Update data:', req.body);

    // Ensure status is lowercase
    if (req.body.status) {
      req.body.status = req.body.status.toLowerCase();
    }

    const updatedStation = await stationService.updateStation(req.params.id, req.body);
    
    if (!updatedStation) {
      console.log('Failed to update station:', req.params.id);
      return res.status(500).json({ message: 'Failed to update station' });
    }

    console.log('Successfully updated station:', updatedStation);
    res.json(updatedStation);
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({ 
      message: 'Error updating station',
      error: error.message,
      details: error.errors
    });
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
    const stations = await ChargingStation.find();
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
      }
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

// Generate time slots for a station
router.post('/:id/generate-slots', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const stationId = req.params.id;
    const result = await stationService.generateDailyTimeSlots(stationId);
    res.json(result);
  } catch (error) {
    console.error('Error generating time slots:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available time slots for a station
router.get('/:id/time-slots', authenticateJWT, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      console.log('No date provided in request');
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid date format:', date);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Set to start of day in local timezone
    parsedDate.setHours(0, 0, 0, 0);

    console.log('Fetching time slots for station:', req.params.id, 'date:', parsedDate.toISOString());

    const stationId = req.params.id;
    const station = await ChargingStation.findById(stationId);
    if (!station) {
      console.log('Station not found:', stationId);
      return res.status(404).json({ error: 'Station not found' });
    }

    console.log('Found station:', {
      id: station._id,
      name: station.name,
      connectors: station.numberOfConnectors,
      status: station.status,
      ratePerHour: station.ratePerHour
    });

    if (station.status !== 'active') {
      console.log('Station is not active:', station.status);
      return res.status(400).json({ error: 'Station is not active' });
    }

    // Create start and end of day dates
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Date range:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // Check existing slots first
    const existingSlots = await TimeSlot.find({
      station: stationId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ startTime: 1 });

    console.log('Existing slots found:', existingSlots.length);

    // If no slots exist, generate them
    if (existingSlots.length === 0) {
      console.log('No slots found, generating new slots...');
      const newSlots = [];
      
      for (let hour = 8; hour <= 19; hour++) {
        const startTime = new Date(startOfDay);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startOfDay);
        endTime.setHours(hour + 1, 0, 0, 0);

        const startTimeStr = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        const endTimeStr = endTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        newSlots.push({
          station: stationId,
          date: startOfDay,
          startTime: startTimeStr,
          endTime: endTimeStr,
          totalSpots: station.numberOfConnectors || 1,
          availableSpots: station.numberOfConnectors || 1,
          status: 'Available'
        });
      }

      console.log('Generated new slots:', newSlots.length);
      if (newSlots.length > 0) {
        console.log('Sample new slot:', {
          date: newSlots[0].date.toISOString(),
          startTime: newSlots[0].startTime,
          endTime: newSlots[0].endTime,
          availableSpots: newSlots[0].availableSpots
        });
      }

      // Save the new slots
      if (newSlots.length > 0) {
        try {
          const savedSlots = await TimeSlot.insertMany(newSlots);
          console.log('Successfully saved new slots:', savedSlots.length);
          return res.json({
            stationId,
            date: parsedDate.toISOString(),
            stationName: station.name,
            slots: savedSlots.map(slot => ({
              _id: slot._id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              availableSpots: slot.availableSpots,
              totalSpots: slot.totalSpots,
              status: slot.status
            }))
          });
        } catch (error) {
          console.error('Error saving slots:', error);
          return res.status(500).json({ error: 'Failed to save time slots' });
        }
      }
    }

    // Return existing slots
    console.log('Returning existing slots:', existingSlots.length);
    if (existingSlots.length > 0) {
      console.log('Sample existing slot:', {
        date: existingSlots[0].date.toISOString(),
        startTime: existingSlots[0].startTime,
        endTime: existingSlots[0].endTime,
        availableSpots: existingSlots[0].availableSpots
      });
    }

    res.json({
      stationId,
      date: parsedDate.toISOString(),
      stationName: station.name,
      slots: existingSlots.map(slot => ({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableSpots: slot.availableSpots,
        totalSpots: slot.totalSpots,
        status: slot.status
      }))
    });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: error.message });
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

// Test endpoint to check and generate slots
router.post('/:id/test-slots', authenticateJWT, async (req, res) => {
  try {
    const stationId = req.params.id;
    const { date } = req.body;

    console.log('Testing slots for station:', stationId, 'date:', date);

    // Check if station exists
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

    // Parse the date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid date format:', date);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Create start and end of day dates
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check existing slots
    const existingSlots = await TimeSlot.find({
      station: stationId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log('Existing slots found:', existingSlots.length);

    // Generate new slots if none exist
    if (existingSlots.length === 0) {
      console.log('Generating new slots...');
      const newSlots = [];
      
      for (let hour = 8; hour <= 19; hour++) {
        const startTime = new Date(startOfDay);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startOfDay);
        endTime.setHours(hour + 1, 0, 0, 0);

        const startTimeStr = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        const endTimeStr = endTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        newSlots.push({
          station: stationId,
          date: startOfDay,
          startTime: startTimeStr,
          endTime: endTimeStr,
          totalSpots: station.numberOfConnectors,
          availableSpots: station.numberOfConnectors,
          status: 'Available'
        });
      }

      console.log('Generated new slots:', newSlots.length);

      // Save the new slots
      if (newSlots.length > 0) {
        const savedSlots = await TimeSlot.insertMany(newSlots);
        console.log('Saved new slots:', savedSlots.length);
        
        return res.json({
          message: 'Slots generated successfully',
          slots: savedSlots
        });
      }
    }

    return res.json({
      message: 'Slots already exist',
      slots: existingSlots
    });

  } catch (error) {
    console.error('Error testing slots:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check slots in database
router.get('/:id/debug-slots', authenticateJWT, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const stationId = req.params.id;
    console.log('Debug: Checking slots for station:', stationId, 'date:', date);

    // Check station
    const station = await ChargingStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    console.log('Debug: Station details:', {
      id: station._id,
      name: station.name,
      connectors: station.numberOfConnectors,
      status: station.status
    });

    // Parse date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Create date range
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Debug: Date range:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // Check TimeSlot collection directly
    const slots = await TimeSlot.find({
      station: stationId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    console.log('Debug: Found slots in database:', slots.length);
    if (slots.length > 0) {
      console.log('Debug: Sample slot:', {
        id: slots[0]._id,
        date: slots[0].date,
        startTime: slots[0].startTime,
        endTime: slots[0].endTime,
        availableSpots: slots[0].availableSpots,
        totalSpots: slots[0].totalSpots
      });
    }

    // If no slots found, try to generate them
    if (slots.length === 0) {
      console.log('Debug: No slots found, attempting to generate...');
      
      const newSlots = [];
      for (let hour = 8; hour <= 19; hour++) {
        const startTime = new Date(startOfDay);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startOfDay);
        endTime.setHours(hour + 1, 0, 0, 0);

        const startTimeStr = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        const endTimeStr = endTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        newSlots.push({
          station: stationId,
          date: startOfDay,
          startTime: startTimeStr,
          endTime: endTimeStr,
          totalSpots: station.numberOfConnectors || 1,
          availableSpots: station.numberOfConnectors || 1,
          status: 'Available'
        });
      }

      console.log('Debug: Generated new slots:', newSlots.length);
      
      try {
        const savedSlots = await TimeSlot.insertMany(newSlots);
        console.log('Debug: Successfully saved new slots:', savedSlots.length);
        return res.json({
          message: 'Generated and saved new slots',
          station: {
            id: station._id,
            name: station.name,
            connectors: station.numberOfConnectors,
            status: station.status
          },
          slots: savedSlots
        });
      } catch (error) {
        console.error('Debug: Error saving slots:', error);
        return res.status(500).json({ 
          error: 'Failed to save slots',
          details: error.message
        });
      }
    }

    return res.json({
      message: 'Found existing slots',
      station: {
        id: station._id,
        name: station.name,
        connectors: station.numberOfConnectors,
        status: station.status
      },
      slots: slots
    });

  } catch (error) {
    console.error('Debug: Error checking slots:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 