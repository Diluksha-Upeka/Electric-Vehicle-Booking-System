require('dotenv').config();
const mongoose = require('mongoose');
const Station = require('../models/Station');

const createSampleStation = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb+srv://dilukshaupeka:sQ5MA35goqZ3D5BL@cluster0.x8ywl1u.mongodb.net/EVCBS?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create a sample station
    const sampleStation = new Station({
      name: 'Sample Station',
      location: {
        type: 'Point',
        coordinates: [79.8612, 6.9271] // Colombo coordinates [longitude, latitude]
      },
      openingTime: '08:00 AM',
      closingTime: '08:00 PM',
      totalChargers: 5,
      status: 'Active'
    });

    await sampleStation.save();
    console.log('Sample station created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample station:', error);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }
};

// Run the script
createSampleStation(); 