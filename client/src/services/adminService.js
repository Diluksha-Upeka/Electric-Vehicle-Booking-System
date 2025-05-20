import axios from 'axios';

const API_URL = 'https://evcbs-backend.onrender.com/api';

class AdminService {
  // Get all stations with optional filters
  async getAllStations(filters = {}) {
    try {
      const response = await axios.get(`${API_URL}/admin/stations`, {
        params: filters,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get station by ID
  async getStationById(stationId) {
    try {
      const response = await axios.get(`${API_URL}/admin/stations/${stationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Create new station
  async createStation(stationData) {
    try {
      const response = await axios.post(`${API_URL}/admin/stations`, stationData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Update station
  async updateStation(stationId, updateData) {
    try {
      const response = await axios.put(`${API_URL}/admin/stations/${stationId}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Delete station
  async deleteStation(stationId) {
    try {
      await axios.delete(`${API_URL}/admin/stations/${stationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get station statistics
  async getStationStats(stationId) {
    try {
      const response = await axios.get(`${API_URL}/admin/stations/${stationId}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new AdminService(); 