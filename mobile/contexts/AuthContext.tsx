import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface User {
  _id: string;
  name: string;
  email: string;
  vehicleDetails?: any;
  chargingPreferences?: any;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API base URL
const getApiBaseUrl = () => {
  return __DEV__
    ? Platform.select({
        android: "http://192.168.170.216:5000",
        ios: "http://localhost:5000",
        default: "http://192.168.170.216:5000",
      })
    : "http://192.168.170.216:5000";
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            if (decoded.exp * 1000 > Date.now()) {
              await fetchUserProfile(token);
            } else {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userId');
              setUser(null);
            }
          } catch (error) {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userId');
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');
      setUser(null);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      
      const { token, user } = response.data;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', user._id);
      
      setUser(user);
      return true;
    } catch (error: any) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      
      // Format the data properly for your API
      const payload = {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email.toLowerCase(),
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, payload);
      
      // Check if the response returns a token immediately after registration
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userId', response.data.user._id);
        setUser(response.data.user);
      }
      
      return true;
    } catch (error: any) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userId');
    setUser(null);
  };

  const updateProfile = async (userData: any): Promise<boolean> => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/profile`,
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setUser(response.data);
      return true;
    } catch (error: any) {
      throw error.response?.data?.message || 'Profile update failed';
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};