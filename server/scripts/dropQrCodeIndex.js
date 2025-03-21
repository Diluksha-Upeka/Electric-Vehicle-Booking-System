const mongoose = require('mongoose');
require('dotenv').config();

async function dropQrCodeIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evcbs');
    console.log('Connected to MongoDB');

    // Drop the existing qrCode index
    await mongoose.connection.collection('bookings').dropIndex('qrCode_1');
    console.log('Successfully dropped qrCode_1 index');

    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

dropQrCodeIndex(); 