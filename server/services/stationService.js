const Station = require('../models/Station');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');

class StationService {
  // Create a new station and generate time slots
  async createStation(stationData) {
    try {
      // Validate opening and closing times
      this.validateOperatingHours(stationData.openingTime, stationData.closingTime);
      
      const station = await Station.create(stationData);
      await this.generateTimeSlots(station);
      return station;
    } catch (error) {
      throw error;
    }
  }

  // Update a station
  async updateStation(stationId, updateData) {
    try {
      const station = await Station.findById(stationId);
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

      // Update station
      Object.assign(station, updateData);
      await station.save();

      // If opening/closing times or total chargers changed, regenerate slots
      if (updateData.openingTime || updateData.closingTime || updateData.totalChargers) {
        await this.regenerateTimeSlots(station);
      }

      return station;
    } catch (error) {
      throw error;
    }
  }

  // Validate operating hours
  validateOperatingHours(openingTime, closingTime) {
    const openTime = new Date(`1970-01-01 ${openingTime}`);
    const closeTime = new Date(`1970-01-01 ${closingTime}`);

    if (isNaN(openTime.getTime()) || isNaN(closeTime.getTime())) {
      throw new Error('Invalid time format. Use format: HH:mm AM/PM');
    }

    if (openTime >= closeTime) {
      throw new Error('Opening time must be before closing time');
    }
  }

  // Delete a station and its associated time slots
  async deleteStation(stationId) {
    try {
      const station = await Station.findById(stationId);
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
      const startTime = new Date(`1970-01-01 ${station.openingTime}`);
      const endTime = new Date(`1970-01-01 ${station.closingTime}`);
      
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
            availableSpots: station.totalChargers,
            status: 'Available'
          });
        }
      }

      await TimeSlot.insertMany(slots);
      return slots;
    } catch (error) {
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
      return await Station.find(query).sort({ name: 1 });
    } catch (error) {
      throw error;
    }
  }

  // Get station by ID with time slots
  async getStationById(stationId) {
    try {
      const station = await Station.findById(stationId);
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
      const station = await Station.findById(stationId);
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