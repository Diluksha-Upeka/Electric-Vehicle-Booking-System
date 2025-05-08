const ChargingStation = require('../models/ChargingStation');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');

class StationService {
  // Create a new station and generate time slots
  async createStation(stationData) {
    try {
      // Set fixed operating hours
      stationData.openingTime = '08:00 AM';
      stationData.closingTime = '08:00 PM';
      
      const station = await ChargingStation.create(stationData);
      await this.generateTimeSlots(station);
      return station;
    } catch (error) {
      throw error;
    }
  }

  // Update a station
  async updateStation(stationId, updateData) {
    try {
      const station = await ChargingStation.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      // Validate opening and closing times if they're being updated
      if (updateData.openingTime || updateData.closingTime) {
        this.validateOperatingHours(
          updateData.openingTime || station.openingTime,
          updateData.closingTime || station.closingTime
        );
      }

      // If status is being updated to inactive, check for active bookings
      if (updateData.status && updateData.status.toLowerCase() === 'inactive') {
        const activeBookings = await Booking.find({
          station: stationId,
          status: { $in: ['confirmed', 'checked-in'] }
        });

        if (activeBookings.length > 0) {
          throw new Error('Cannot set station to inactive while it has active bookings');
        }
      }

      // Update station with new data, preserving existing location if not provided
      const updatedData = {
        ...updateData,
        location: updateData.location || station.location
      };

      Object.assign(station, updatedData);
      
      // Ensure status is lowercase
      if (updateData.status) {
        station.status = updateData.status.toLowerCase();
      }

      // Save the updated station
      const savedStation = await station.save();
      
      // If opening/closing times or number of connectors changed, regenerate time slots
      if (updateData.openingTime || updateData.closingTime || updateData.numberOfConnectors) {
        await this.regenerateTimeSlots(savedStation);
      }

      return savedStation;
    } catch (error) {
      console.error('Error updating station:', error);
      throw error;
    }
  }

  // Validate operating hours
  validateOperatingHours(openingTime, closingTime) {
    // Fixed operating hours: 8 AM to 8 PM
    const fixedOpeningTime = '08:00 AM';
    const fixedClosingTime = '08:00 PM';

    if (openingTime !== fixedOpeningTime || closingTime !== fixedClosingTime) {
      throw new Error('Station operating hours are fixed from 8:00 AM to 8:00 PM');
    }
  }

  // Delete a station and its associated time slots
  async deleteStation(stationId) {
    try {
      const station = await ChargingStation.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      // Check for active bookings
      const activeBookings = await Booking.find({
        station: stationId,
        status: { $in: ['Confirmed', 'Checked-in'] }
      });

      if (activeBookings.length > 0) {
        throw new Error('Cannot delete station with active bookings');
      }

      // Delete all associated time slots and bookings
      await TimeSlot.deleteMany({ station: stationId });
      await Booking.deleteMany({ station: stationId });
      await station.deleteOne();
      
      return { message: 'Station deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Generate time slots for a station
  async generateTimeSlots(station) {
    try {
      const slots = [];
      
      // Fixed operating hours: 8 AM to 8 PM
      const startHour = 8;  // 8 AM
      const endHour = 20;   // 8 PM
      
      // Create base date for time calculations
      const baseDate = new Date();
      baseDate.setHours(startHour, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(endHour, 0, 0, 0);
      
      // Generate hourly slots
      while (baseDate < endDate) {
        const slotStartTime = baseDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        baseDate.setHours(baseDate.getHours() + 1);
        const slotEndTime = baseDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });

        // Generate slots for the next 30 days
        for (let i = 0; i < 30; i++) {
          const slotDate = new Date();
          slotDate.setDate(slotDate.getDate() + i);
          slotDate.setHours(0, 0, 0, 0); // Reset time part to start of day
          
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

      console.log(`Generating ${slots.length} slots for station ${station.name}`);

      // Delete any existing slots for this station
      await TimeSlot.deleteMany({ station: station._id });
      
      // Insert new slots
      if (slots.length > 0) {
        await TimeSlot.insertMany(slots);
        console.log(`Successfully created ${slots.length} slots for station ${station.name}`);
      }
      
      return slots;
    } catch (error) {
      console.error('Error generating time slots:', error);
      throw error;
    }
  }

  // Regenerate time slots for a station
  async regenerateTimeSlots(station) {
    try {
      // Delete existing slots
      await TimeSlot.deleteMany({ station: station._id });
      // Generate new slots
      return await this.generateTimeSlots(station);
    } catch (error) {
      throw error;
    }
  }

  // Get all stations with optional filters
  async getAllStations(filters = {}) {
    try {
      return await ChargingStation.find().sort({ name: 1 });
    } catch (error) {
      throw error;
    }
  }

  // Get station by ID with time slots
  async getStationById(stationId) {
    try {
      const station = await ChargingStation.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      const timeSlots = await TimeSlot.find({ station: stationId })
        .sort({ date: 1, startTime: 1 });

      return {
        ...station.toObject(),
        timeSlots
      };
    } catch (error) {
      throw error;
    }
  }

  // Get station statistics
  async getStationStats(stationId) {
    try {
      const station = await ChargingStation.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      const totalBookings = await Booking.countDocuments({ station: stationId });
      const activeBookings = await Booking.countDocuments({
        station: stationId,
        status: { $in: ['Confirmed', 'Checked-in'] }
      });
      const completedBookings = await Booking.countDocuments({
        station: stationId,
        status: 'Completed'
      });

      return {
        totalBookings,
        activeBookings,
        completedBookings,
        utilizationRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate daily time slots for a station
  async generateDailyTimeSlots(stationId) {
    try {
      const station = await ChargingStation.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Generate slots for the next 7 days
      for (let day = 0; day < 7; day++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + day);

        // Generate 12 hourly slots (8 AM to 8 PM)
        for (let hour = 8; hour <= 19; hour++) {
          const startTime = new Date(slotDate);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(slotDate);
          endTime.setHours(hour + 1, 0, 0, 0);

          // Format times for display
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

          // Check if slot already exists
          const existingSlot = await TimeSlot.findOne({
            station: stationId,
            date: slotDate,
            startTime: startTimeStr,
            endTime: endTimeStr
          });

          if (!existingSlot) {
            // Create new time slot with total spots equal to number of connectors
            await TimeSlot.create({
              station: stationId,
              date: slotDate,
              startTime: startTimeStr,
              endTime: endTimeStr,
              totalSpots: station.numberOfConnectors,
              availableSpots: station.numberOfConnectors,
              status: 'Available'
            });
          } else {
            // Update existing slot if number of connectors has changed
            if (existingSlot.totalSpots !== station.numberOfConnectors) {
              const spotsDifference = station.numberOfConnectors - existingSlot.totalSpots;
              existingSlot.totalSpots = station.numberOfConnectors;
              existingSlot.availableSpots += spotsDifference;
              await existingSlot.save();
            }
          }
        }
      }

      return { message: 'Time slots generated successfully' };
    } catch (error) {
      console.error('Error generating time slots:', error);
      throw error;
    }
  }

  // Get available time slots for a station on a specific date
  async getAvailableTimeSlots(stationId, date) {
    try {
      const timeSlots = await TimeSlot.find({
        station: stationId,
        date: new Date(date),
        status: 'Available',
        availableSpots: { $gt: 0 }
      }).sort({ startTime: 1 });

      return timeSlots;
    } catch (error) {
      throw error;
    }
  }

  // Update time slot availability
  async updateTimeSlotAvailability(timeSlotId, changeInSpots) {
    try {
      const timeSlot = await TimeSlot.findById(timeSlotId);
      if (!timeSlot) {
        throw new Error('Time slot not found');
      }

      timeSlot.availableSpots += changeInSpots;
      if (timeSlot.availableSpots <= 0) {
        timeSlot.status = 'Booked';
      } else {
        timeSlot.status = 'Available';
      }

      await timeSlot.save();
      return timeSlot;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StationService(); 