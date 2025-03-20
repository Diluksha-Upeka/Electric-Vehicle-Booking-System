import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class BookingService {
  // Get available time slots for a station
  async getAvailableSlots(stationId, date) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/bookings/stations/${stationId}/time-slots`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  }

  // Create a new booking
  async createBooking(stationId, timeSlotId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/bookings`,
        { stationId, timeSlotId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/bookings/${bookingId}/cancel`,
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
      const response = await axios.get(`${API_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  }
}

export default new BookingService(); 