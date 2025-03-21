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

      // Check if there are any active bookings before allowing status change
      if (updateData.status === 'Inactive' && station.status === 'Active') {
        const activeBookings = await Booking.find({
          station: stationId,
          status: { $in: ['Confirmed', 'Checked-in'] }
        });

        if (activeBookings.length > 0) {
          throw new Error('Cannot deactivate station with active bookings');
        }
      }

      // Check if time-related fields are being updated
      const needsTimeSlotUpdate = 
        updateData.openingTime !== undefined || 
        updateData.closingTime !== undefined || 
        updateData.numberOfConnectors !== undefined;

      // If only numberOfConnectors is updated, update availableSpots in existing slots
      if (updateData.numberOfConnectors !== undefined && 
          !updateData.openingTime && 
          !updateData.closingTime) {
        const chargerDiff = updateData.numberOfConnectors - station.numberOfConnectors;
        await TimeSlot.updateMany(
          { 
            station: stationId,
            date: { $gte: new Date() } // Only update future slots
          },
          { 
            $inc: { availableSpots: chargerDiff },
            $set: { 
              status: updateData.numberOfConnectors > 0 ? 'Available' : 'Booked'
            }
          }
        );
      }

      // Update station
      Object.assign(station, updateData);
      await station.save();

      // If opening/closing times changed, regenerate all slots
      if (updateData.openingTime || updateData.closingTime) {
        await this.regenerateTimeSlots(station);
      }

      return station;
    } catch (error) {
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
      const query = {};
      if (filters.status) {
        query.status = filters.status;
      }
      return await ChargingStation.find(query).sort({ name: 1 });
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