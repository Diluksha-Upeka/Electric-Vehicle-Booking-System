const express = require('express');
const router = express.Router();
const stationService = require('../services/stationService');
const { isAdmin } = require('../middleware/auth');
const { validateStationData } = require('../middleware/validation');

// Apply admin middleware to all routes
router.use(isAdmin);

// Get all stations with optional filters
router.get('/stations', async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    const stations = await stationService.getAllStations(filters);
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get station by ID with time slots
router.get('/stations/:id', async (req, res) => {
  try {
    const station = await stationService.getStationById(req.params.id);
    res.json(station);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Create new station with validation
router.post('/stations', validateStationData, async (req, res) => {
  try {
    const station = await stationService.createStation(req.body);
    res.status(201).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update station with validation
router.put('/stations/:id', validateStationData, async (req, res) => {
  try {
    const station = await stationService.updateStation(req.params.id, req.body);
    res.json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete station
router.delete('/stations/:id', async (req, res) => {
  try {
    await stationService.deleteStation(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get station statistics
router.get('/stations/:id/stats', async (req, res) => {
  try {
    const stats = await stationService.getStationStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 