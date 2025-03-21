require('dotenv').config();
const mongoose = require('mongoose');
const ChargingStation = require('../models/ChargingStation');
const TimeSlot = require('../models/TimeSlot');

const generateTimeSlots = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all stations
    const stations = await ChargingStation.find();
    console.log(`Found ${stations.length} stations`);

    // Delete existing time slots
    console.log('Deleting existing time slots...');
    await TimeSlot.deleteMany({});
    console.log('Deleted existing time slots');

    // Default business hours
    const openingHour = 6;  // 6 AM
    const closingHour = 22; // 10 PM

    // Generate time slots for each station
    for (const station of stations) {
      console.log(`Generating slots for station: ${station.name}`);
      const slots = [];
      
      // Create Date objects for the current day
      const today = new Date();
      const startTime = new Date(today);
      startTime.setHours(openingHour, 0, 0, 0);
      
      const endTime = new Date(today);
      endTime.setHours(closingHour, 0, 0, 0);
      
      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const slotStartTime = currentTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        currentTime.setHours(currentTime.getHours() + 1);
        const slotEndTime = currentTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        // Generate slots for the next 30 days
        for (let i = 0; i < 30; i++) {
          const slotDate = new Date();
          slotDate.setDate(slotDate.getDate() + i);
          
          slots.push({
            station: station._id,
            date: slotDate,
            startTime: slotStartTime,
            endTime: slotEndTime,
            availableSpots: station.numberOfConnectors,
            status: 'Available'
          });
        }
      }

      // Insert slots for this station
      if (slots.length > 0) {
        await TimeSlot.insertMany(slots);
        console.log(`Generated ${slots.length} slots for station: ${station.name}`);
      }
    }

    console.log('Time slot generation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error generating time slots:', error);
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
generateTimeSlots(); 