import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import { Map, History, Settings, LocationOn, BatteryChargingFull, NavigateNext } from '@mui/icons-material';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import MapSection from '../components/dashboard/MapSection';
import BookingsSection from '../components/dashboard/BookingsSection';
import ProfileSection from '../components/dashboard/ProfileSection';
import BookingDialog from '../components/BookingDialog';
import bookingService from '../services/bookingService';
import UpcomingBookings from '../components/dashboard/UpcomingBookings';
import { useAuth } from '../contexts/AuthContext';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/+$/, '') : '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to handle double slashes
api.interceptors.request.use(config => {
  if (config.url) {
    config.url = config.url.replace(/\/+/g, '/');
  }
  return config;
});

const UserDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 7.8731, lng: 80.7718 }); // Default to Sri Lanka center
  const [selectedStation, setSelectedStation] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    vehicleDetails: {
      make: '',
      model: '',
      year: '',
      batteryCapacity: ''
    },
    chargingPreferences: {
      preferredPowerOutput: '',
      preferredTimeSlot: ''
    }
  });
  const [nearbyStations, setNearbyStations] = useState([]);
  const [radius, setRadius] = useState(10000); // Default 10km radius
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
    getUserLocation();
    // Get tab from URL query parameters
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam !== null) {
      setActiveTab(parseInt(tabParam));
    }
  }, [user, location.search, navigate]);

  useEffect(() => {
    if (userLocation && stations.length > 0) {
      fetchNearbyStations(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, stations, radius]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [stationsResponse, bookingsResponse, profileResponse] = await Promise.all([
        api.get('/api/stations', { headers }),
        api.get('/api/bookings/my-bookings', { headers }),
        api.get('/api/auth/profile', { headers })
      ]);

      setStations(stationsResponse.data);
      setBookings(filterActiveBookings(bookingsResponse.data));
      setProfileData(profileResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Showing all stations.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const fetchNearbyStations = async (latitude, longitude) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('api/stations/nearby', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          latitude,
          longitude,
          maxDistance: radius
        }
      });
      setNearbyStations(response.data);
    } catch (error) {
      console.error('Error fetching nearby stations:', error);
      setError('Failed to fetch nearby stations');
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (userLocation) {
      fetchNearbyStations(userLocation.lat, userLocation.lng);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Update URL with new tab value
    navigate(`/user-dashboard?tab=${newValue}`, { replace: true });
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setBookingDialogOpen(true);
  };

  const handleProfileChange = (field, value) => {
    if (typeof value === 'string') {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await api.put('/api/auth/profile', profileData, { headers });
      fetchData(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Attempting to cancel booking:', bookingId);
      
      const response = await api.post(
        `/api/bookings/${bookingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        // Update the bookings list
        setBookings(prevBookings => 
          prevBookings.filter(booking => booking._id !== bookingId)
        );
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      setError('Failed to cancel booking');
    }
  };

  const filterActiveBookings = (bookings) => {
    return bookings.filter(booking => {
      // Keep all non-cancelled bookings
      return booking.status !== 'CANCELLED';
    });
  };

  const handleLocationUpdate = (location) => {
    setUserLocation(location);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)', // Subtract navbar height
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
        mt: '64px' // Add margin top for navbar
      }}
    >
      <Container 
        maxWidth="xl" 
        sx={{ 
          height: '100%',
          py: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Grid 
          container 
          spacing={2} 
          sx={{ 
            height: '100%',
            flex: 1,
            minHeight: 0
          }}
        >
          {/* Left Sidebar */}
          <Grid 
            item 
            xs={12} 
            md={3} 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }}
              >
                Welcome, {user?.name}
              </Typography>

              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                orientation="vertical"
                variant="fullWidth"
                sx={{
                  borderRight: 1,
                  borderColor: 'divider',
                  mb: 2,
                  '& .MuiTab-root': {
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    py: 1.5,
                    minHeight: '48px',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <Tab 
                  icon={<Map />} 
                  label="Find Stations" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<History />} 
                  label="My Bookings" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<Settings />} 
                  label="Profile" 
                  iconPosition="start"
                />
              </Tabs>

              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <UpcomingBookings 
                  bookings={bookings} 
                  onViewAll={() => handleTabChange(null, 1)}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid 
            item 
            xs={12} 
            md={9} 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden'
              }}
            >
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : (
                <Box sx={{ height: '100%' }}>
                  {/* Find Stations Tab */}
                  {activeTab === 0 && (
                    <Box sx={{ height: '100%' }}>
                      <MapSection
                        stations={stations}
                        nearbyStations={nearbyStations}
                        userLocation={userLocation}
                        mapCenter={mapCenter}
                        onMapCenterChange={setMapCenter}
                        onStationSelect={handleStationSelect}
                        onRefresh={fetchData}
                        onRadiusChange={handleRadiusChange}
                        onLocationUpdate={handleLocationUpdate}
                        onBookStation={(station) => {
                          setSelectedStation(station);
                          setBookingDialogOpen(true);
                        }}
                      />
                    </Box>
                  )}

                  {/* My Bookings Tab */}
                  {activeTab === 1 && (
                    <BookingsSection
                      bookings={bookings}
                      onRefresh={fetchData}
                      onCancelBooking={handleCancelBooking}
                    />
                  )}

                  {/* Profile Tab */}
                  {activeTab === 2 && (
                    <ProfileSection
                      profileData={profileData}
                      onProfileChange={handleProfileChange}
                      onProfileUpdate={handleProfileUpdate}
                    />
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        station={selectedStation}
        onSuccess={() => {
          setBookingDialogOpen(false);
          fetchData();
        }}
      />

      {bookingSuccess && (
        <Alert severity="success" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          Booking confirmed successfully!
        </Alert>
      )}

      {bookingError && (
        <Alert severity="error" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          {bookingError}
        </Alert>
      )}
    </Box>
  );
};

export default UserDashboard;