import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://evcbs-backend.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to handle double slashes
api.interceptors.request.use(config => {
  // Ensure URL doesn't have double slashes
  if (config.url) {
    config.url = config.url.replace(/\/+/g, '/');
  }
  return config;
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 > Date.now()) {
            await fetchUserProfile(token);
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await api.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      await fetchUserProfile(token);
      return true;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { token } = response.data;
      localStorage.setItem('token', token);
      await fetchUserProfile(token);
      return true;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Updating profile with data:', { ...userData, password: '[REDACTED]' });

      const response = await api.put(
        '/api/auth/profile',
        userData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        console.log('Profile updated successfully:', response.data);
        setUser(response.data);
        return true;
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        throw error.response.data.message || 'Profile update failed';
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw 'No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        throw error.message;
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 