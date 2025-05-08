const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const ChargingStation = require('../models/ChargingStation');
const User = require('../models/User');

class BookingService {
  // Get available time slots for a station on a specific date
  async getAvailableSlots(stationId, date) {
    try {
      console.log('Getting available slots for station:', stationId, 'date:', date);

      const station = await ChargingStation.findById(stationId);
      if (!station) {
        console.error('Station not found:', stationId);
        throw new Error('Station not found');
      }

      console.log('Found station:', {
        id: station._id,
        name: station.name,
        connectors: station.numberOfConnectors,
        status: station.status
      });

      if (station.status !== 'active') {
        console.log('Station is not active:', station.status);
        throw new Error('Station is not active');
      }

      // Create start and end of day dates in local timezone
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('Date range:', {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      });

      // First, check if any slots exist for this date
      const existingSlots = await TimeSlot.find({
        station: stationId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).sort({ startTime: 1 });

      console.log('Existing slots found:', existingSlots.length);
      if (existingSlots.length > 0) {
        console.log('Sample existing slot:', {
          id: existingSlots[0]._id,
          date: existingSlots[0].date.toISOString(),
          startTime: existingSlots[0].startTime,
          endTime: existingSlots[0].endTime,
          availableSpots: existingSlots[0].availableSpots,
          totalSpots: existingSlots[0].totalSpots,
          status: existingSlots[0].status
        });
      }

      // If no slots exist, generate them
      if (existingSlots.length === 0) {
        console.log('No slots found, generating new slots...');
        
        // Generate slots for this date
        const newSlots = [];
        for (let hour = 8; hour <= 19; hour++) {
          // Create a new date object for each slot
          const slotDate = new Date(startOfDay);
          
          const startTime = new Date(slotDate);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(slotDate);
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
            date: slotDate,
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
            availableSpots: newSlots[0].availableSpots,
            totalSpots: newSlots[0].totalSpots,
            status: newSlots[0].status
          });
        }

        // Save the new slots
        if (newSlots.length > 0) {
          try {
            const savedSlots = await TimeSlot.insertMany(newSlots);
            console.log('Successfully saved new slots:', savedSlots.length);
            return {
              slots: savedSlots.map(slot => ({
                _id: slot._id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                availableSpots: slot.availableSpots,
                totalSpots: slot.totalSpots,
                status: slot.status
              }))
            };
          } catch (error) {
            console.error('Error saving slots:', error);
            throw new Error('Failed to save time slots');
          }
        }
      }

      // If we have existing slots, return them
      console.log('Returning existing slots:', existingSlots.length);
      if (existingSlots.length > 0) {
        console.log('Sample existing slot:', {
          id: existingSlots[0]._id,
          date: existingSlots[0].date.toISOString(),
          startTime: existingSlots[0].startTime,
          endTime: existingSlots[0].endTime,
          availableSpots: existingSlots[0].availableSpots,
          totalSpots: existingSlots[0].totalSpots,
          status: existingSlots[0].status
        });
      }

      const formattedSlots = existingSlots.map(slot => ({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableSpots: slot.availableSpots,
        totalSpots: slot.totalSpots,
        status: slot.status
      }));

      return {
        slots: formattedSlots
      };
    } catch (error) {
      console.error('Error getting available slots:', error);
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

      // Find all active bookings for the user (not cancelled or completed)
      const userBookings = await Booking.find({
        user: userId,
        status: { $in: ['Confirmed', 'Checked-in'] }
      }).populate('timeSlot');

      // Check for overlaps
      for (const booking of userBookings) {
        const existingSlot = booking.timeSlot;
        
        // Skip if the booking is for the exact same time slot (duplicate booking attempt)
        if (existingSlot._id.toString() === timeSlotId.toString()) {
          return true; // Prevent duplicate booking of the same slot
        }

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
      console.error('Error checking overlapping bookings:', error);
      throw error;
    }
  }

  // Clean up all bookings with old status values
  async cleanupAllBookings() {
    try {
      console.log('Starting cleanup of all bookings with old status values');

      // Find all bookings with old status values
      const bookingsToUpdate = await Booking.find({
        status: { 
          $in: ['Pending', 'Confirmed', 'Checked-in', 'Completed', 'No Show', 'pending', 'confirmed']
        }
      });

      console.log(`Found ${bookingsToUpdate.length} bookings to update`);

      for (const booking of bookingsToUpdate) {
        // Update the booking status based on its current state
        const oldStatus = booking.status.toUpperCase();
        
        // Update time slot availability if needed
        if (oldStatus === 'PENDING' || oldStatus === 'CONFIRMED') {
          const timeSlot = await TimeSlot.findById(booking.timeSlot);
          if (timeSlot) {
            timeSlot.availableSpots = Math.min(
              timeSlot.availableSpots + 1,
              timeSlot.totalSpots
            );
            timeSlot.status = timeSlot.availableSpots > 0 ? 'Available' : 'Booked';
            await timeSlot.save();
          }
        }

        // Set all non-cancelled bookings to CANCELLED
        booking.status = 'CANCELLED';
        await booking.save();
      }

      return {
        cleanedUp: bookingsToUpdate.length,
        message: `Successfully cleaned up ${bookingsToUpdate.length} bookings with old status values`
      };
    } catch (error) {
      console.error('Error cleaning up all bookings:', error);
      throw error;
    }
  }

  // Create a new booking
  async createBooking(userId, stationId, timeSlotId, paymentDetails) {
    try {
      console.log('Creating booking:', {
        userId,
        stationId,
        timeSlotId,
        paymentDetails
      });

      // 1. Validate time slot availability
      const timeSlot = await TimeSlot.findById(timeSlotId);
      if (!timeSlot) {
        console.error('Time slot not found:', timeSlotId);
        throw new Error('Time slot not found');
      }

      if (timeSlot.availableSpots <= 0) {
        console.error('No available spots for time slot:', timeSlotId);
        throw new Error('No available spots for this time slot');
      }

      // 2. Get station details for pricing
      const station = await ChargingStation.findById(stationId);
      if (!station) {
        console.error('Station not found:', stationId);
        throw new Error('Station not found');
      }

      // 3. Calculate amounts
      const totalAmount = station.ratePerHour;
      const advanceAmount = totalAmount * 0.1; // 10% advance

      console.log('Calculated amounts:', {
        totalAmount,
        advanceAmount
      });

      // 4. Check for overlapping bookings
      const hasOverlap = await this.checkOverlappingBookings(userId, timeSlotId);
      if (hasOverlap) {
        console.error('Overlapping booking found for user:', userId);
        throw new Error('You already have a booking for this time slot');
      }

      // 5. Lock the time slot
      const lockedSlot = await this.lockTimeSlot(timeSlotId);
      if (!lockedSlot) {
        console.error('Failed to lock time slot:', timeSlotId);
        throw new Error('Failed to lock time slot');
      }

      console.log('Time slot locked successfully:', {
        slotId: lockedSlot._id,
        availableSpots: lockedSlot.availableSpots
      });

      // 6. Create booking with new status model
      const booking = await Booking.create({
        user: userId,
        station: stationId,
        timeSlot: timeSlotId,
        date: timeSlot.date,
        totalAmount,
        advanceAmount,
        paymentStatus: 'Pending',
        status: 'CONFIRMED', // Using new status model
        paymentId: paymentDetails?.paymentId
      });

      console.log('Booking created:', {
        bookingId: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      });

      // 7. Return booking with populated fields
      const populatedBooking = await Booking.findById(booking._id)
        .populate('station')
        .populate('timeSlot')
        .populate('user', 'name email');

      console.log('Returning populated booking:', {
        bookingId: populatedBooking._id,
        stationName: populatedBooking.station.name,
        date: populatedBooking.date,
        timeSlot: `${populatedBooking.timeSlot.startTime} - ${populatedBooking.timeSlot.endTime}`,
        status: populatedBooking.status
      });

      return populatedBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get user's bookings
  async getUserBookings(userId) {
    try {
      return await Booking.find({ user: userId })
        .populate('station')
        .populate('timeSlot')
        .sort({ date: -1, 'timeSlot.startTime': -1 });
    } catch (error) {
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(bookingId, userId) {
    try {
      console.log('Attempting to cancel booking:', { bookingId, userId });

      // Validate booking ID format
      if (!bookingId || typeof bookingId !== 'string') {
        throw new Error('Invalid booking ID');
      }

      // Find the booking and ensure it belongs to the user
      const booking = await Booking.findOne({ _id: bookingId, user: userId });
      if (!booking) {
        console.error('Booking not found or unauthorized:', { bookingId, userId });
        throw new Error('Booking not found or you do not have permission to cancel it');
      }

      console.log('Found booking:', {
        id: booking._id,
        status: booking.status,
        userId: booking.user,
        timeSlot: booking.timeSlot
      });

      // Check if booking can be cancelled
      if (booking.status !== 'CONFIRMED') {
        console.error('Invalid booking status for cancellation:', booking.status);
        throw new Error(`Cannot cancel booking in current status: ${booking.status}. Only CONFIRMED bookings can be cancelled.`);
      }

      // Update time slot availability
      const timeSlot = await TimeSlot.findById(booking.timeSlot);
      if (!timeSlot) {
        console.error('Time slot not found:', booking.timeSlot);
        throw new Error('Associated time slot not found');
      }

      console.log('Found time slot:', {
        id: timeSlot._id,
        availableSpots: timeSlot.availableSpots,
        totalSpots: timeSlot.totalSpots,
        status: timeSlot.status
      });

      // Update time slot
      timeSlot.availableSpots = Math.min(
        timeSlot.availableSpots + 1,
        timeSlot.totalSpots
      );
      timeSlot.status = timeSlot.availableSpots > 0 ? 'Available' : 'Booked';
      await timeSlot.save();

      // Update booking status
      booking.status = 'CANCELLED';
      await booking.save();

      // Return the updated booking with populated fields
      const updatedBooking = await Booking.findById(booking._id)
        .populate('station')
        .populate('timeSlot')
        .populate('user', 'name email');

      if (!updatedBooking) {
        console.error('Failed to retrieve updated booking:', booking._id);
        throw new Error('Failed to retrieve updated booking details');
      }

      console.log('Successfully cancelled booking:', {
        id: updatedBooking._id,
        status: updatedBooking.status,
        timeSlot: updatedBooking.timeSlot._id
      });

      return updatedBooking;
    } catch (error) {
      console.error('Error in cancelBooking:', {
        error: error.message,
        stack: error.stack,
        bookingId,
        userId
      });
      throw error;
    }
  }

  // Clean up random bookings
  async cleanupRandomBookings() {
    try {
      // Find all bookings that are older than 24 hours and still in PENDING status
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const oldPendingBookings = await Booking.find({
        status: 'PENDING',
        createdAt: { $lt: twentyFourHoursAgo }
      });

      console.log(`Found ${oldPendingBookings.length} old pending bookings to clean up`);

      for (const booking of oldPendingBookings) {
        // Update time slot availability
      const timeSlot = await TimeSlot.findById(booking.timeSlot);
        if (timeSlot) {
          timeSlot.availableSpots = Math.min(
            timeSlot.availableSpots + 1,
            timeSlot.totalSpots
          );
          timeSlot.status = timeSlot.availableSpots > 0 ? 'Available' : 'Booked';
      await timeSlot.save();
        }

        // Update booking status
        booking.status = 'CANCELLED';
        await booking.save();
      }

      return {
        cleanedUp: oldPendingBookings.length,
        message: `Successfully cleaned up ${oldPendingBookings.length} old pending bookings`
      };
    } catch (error) {
      console.error('Error cleaning up random bookings:', error);
      throw error;
    }
  }

  // Get booking details
  async getBookingDetails(bookingId, userId) {
    try {
      const booking = await Booking.findOne({ _id: bookingId, user: userId })
        .populate('station')
        .populate('timeSlot');
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BookingService(); 