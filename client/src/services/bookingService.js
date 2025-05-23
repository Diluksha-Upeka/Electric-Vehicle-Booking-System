import axios from 'axios';

const API_URL = 'https://evcbs-backend.onrender.com';

class BookingService {
  // Get available time slots for a station
  async getAvailableSlots(stationId, date) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Fetching slots with params:', { stationId, date });
      const response = await axios.get(`${API_URL}/api/bookings/stations/${stationId}/time-slots`, {
        params: { date },
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Available slots response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots:', error.response?.data || error.message);
      throw error.response?.data?.error || error.response?.data?.message || error.message;
    }
  }

  // Create a new booking
  async createBooking(bookingData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.post(
        `${API_URL}/api/bookings`,
        {
          stationId: bookingData.stationId,
          timeSlotId: bookingData.timeSlotId,
          date: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          batteryPercentage: bookingData.batteryPercentage,
          estimatedChargingTime: bookingData.estimatedChargingTime
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Booking creation error:', error.response?.data || error.message);
      throw error.response?.data?.error || error.response?.data?.message || error.message;
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  }

  // Get user's bookings
  async getUserBookings() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  }
}

export default new BookingService(); 