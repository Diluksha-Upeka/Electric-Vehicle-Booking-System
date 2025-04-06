const mongoose = require('mongoose');
const ChargingStation = require('../models/ChargingStation');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/evcbs', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateStations() {
  try {
    // Update all stations that don't have openingTime or closingTime
    const result = await ChargingStation.updateMany(
      {
        $or: [
          { openingTime: { $exists: false } },
          { closingTime: { $exists: false } }
        ]
      },
      {
        $set: {
          openingTime: '08:00 AM',
          closingTime: '08:00 PM'
        }
      }
    );

    console.log(`Updated ${result.nModified} stations with default times`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating stations:', error);
    process.exit(1);
  }
}

updateStations(); 