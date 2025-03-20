const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const User = require('../models/User');

class BookingService {
  // Get available time slots for a station on a specific date
  async getAvailableSlots(stationId, date) {
    try {
      const station = await ChargingStation.findById(stationId);
      if (!station) {
        throw new Error('Station not found');
      }

      const slots = await TimeSlot.find({
        station: stationId,
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: 'Available',
        availableSpots: { $gt: 0 }
      }).sort({ startTime: 1 });

      return slots;
    } catch (error) {
      throw error;
    }
  }

  // Validate and lock a time slot
  async lockTimeSlot(timeSlotId) {
    try {
      const timeSlot = await TimeSlot.findById(timeSlotId);
      if (!timeSlot) {
        throw new Error('Time slot not found');
      }

      if (timeSlot.status !== 'Available' || timeSlot.availableSpots <= 0) {
        throw new Error('Time slot is not available');
      }

      // Lock the slot by reducing available spots
      timeSlot.availableSpots -= 1;
      if (timeSlot.availableSpots === 0) {
        timeSlot.status = 'Booked';
      }
      await timeSlot.save();

      return timeSlot;
    } catch (error) {
      throw error;
    }
  }

  // Check for overlapping bookings for a user
  async checkOverlappingBookings(userId, timeSlotId) {
    try {
      const requestedSlot = await TimeSlot.findById(timeSlotId);
      if (!requestedSlot) {
        throw new Error('Time slot not found');
      }

      // Convert time strings to Date objects for comparison
      const requestedStart = new Date(requestedSlot.date);
      const [startHour, startMinute] = requestedSlot.startTime.split(':');
      requestedStart.setHours(parseInt(startHour), parseInt(startMinute), 0);

      const requestedEnd = new Date(requestedSlot.date);
      const [endHour, endMinute] = requestedSlot.endTime.split(':');
      requestedEnd.setHours(parseInt(endHour), parseInt(endMinute), 0);

      // Find all confirmed bookings for the user
      const userBookings = await Booking.find({
        user: userId,
        status: 'Confirmed'
      }).populate('timeSlot');

      // Check for overlaps
      for (const booking of userBookings) {
        const existingSlot = booking.timeSlot;
        const existingStart = new Date(existingSlot.date);
        const [existingStartHour, existingStartMinute] = existingSlot.startTime.split(':');
        existingStart.setHours(parseInt(existingStartHour), parseInt(existingStartMinute), 0);

        const existingEnd = new Date(existingSlot.date);
        const [existingEndHour, existingEndMinute] = existingSlot.endTime.split(':');
        existingEnd.setHours(parseInt(existingEndHour), parseInt(existingEndMinute), 0);

        // Check if the dates are the same and times overlap
        if (requestedSlot.date.getTime() === existingSlot.date.getTime()) {
          if (
            (requestedStart >= existingStart && requestedStart < existingEnd) ||
            (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
            (requestedStart <= existingStart && requestedEnd >= existingEnd)
          ) {
            return true; // Overlap found
          }
        }
      }

      return false; // No overlaps found
    } catch (error) {
      throw error;
    }
  }

  // Create a new booking
  async createBooking(userId, stationId, timeSlotId) {
    try {
      // Check for overlapping bookings
      const hasOverlap = await this.checkOverlappingBookings(userId, timeSlotId);
      if (hasOverlap) {
        throw new Error('You already have a booking that overlaps with this time slot');
      }

      // Get user and station details
      const [user, station] = await Promise.all([
        User.findById(userId),
        ChargingStation.findById(stationId)
      ]);

      if (!user || !station) {
        throw new Error('User or station not found');
      }

      // Create the booking
      const booking = new Booking({
        user: userId,
        station: stationId,
        timeSlot: timeSlotId,
        status: 'Confirmed'
      });

      await booking.save();

      // Get the time slot details for the notification
      const timeSlot = await TimeSlot.findById(timeSlotId);

      // Return booking details with additional information
      return {
        booking,
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        station: {
          name: station.name,
          location: station.location
        },
        timeSlot: {
          date: timeSlot.date,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId, userId) {
    try {
      const booking = await Booking.findOne({
        _id: bookingId,
        user: userId
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'Confirmed') {
        throw new Error('Booking cannot be cancelled');
      }

      // Update booking status
      booking.status = 'Cancelled';
      await booking.save();

      // Release the time slot
      const timeSlot = await TimeSlot.findById(booking.timeSlot);
      timeSlot.availableSpots += 1;
      timeSlot.status = 'Available';
      await timeSlot.save();

      return booking;
    } catch (error) {
      throw error;
    }
  }

  // Get user's bookings
  async getUserBookings(userId) {
    try {
      const bookings = await Booking.find({ user: userId })
        .populate('station', 'name location')
        .populate('timeSlot', 'date startTime endTime')
        .sort({ createdAt: -1 });

      return bookings;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BookingService(); 