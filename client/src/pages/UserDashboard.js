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
  alpha
} from '@mui/material';
import { Map, History, Settings, LocationOn, BatteryChargingFull, NavigateNext } from '@mui/icons-material';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import MapSection from '../components/dashboard/MapSection';
import BookingsSection from '../components/dashboard/BookingsSection';
import ProfileSection from '../components/dashboard/ProfileSection';
import BookingDialog from '../components/BookingDialog';
import bookingService from '../services/bookingService';

const UserDashboard = () => {
  const theme = useTheme();
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
    fetchData();
    getUserLocation();
    // Get tab from URL query parameters
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam !== null) {
      setActiveTab(parseInt(tabParam));
    }
  }, [location.search]);

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
        axios.get('http://localhost:5000/api/stations', { headers }),
        axios.get('http://localhost:5000/api/bookings/my-bookings', { headers }),
        axios.get('http://localhost:5000/api/auth/profile', { headers })
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
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stations/nearby`,
        {
          params: {
            latitude,
            longitude,
            maxDistance: radius, // Use the selected radius
          },
        }
      );
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
      
      await axios.put('http://localhost:5000/api/auth/profile', profileData, { headers });
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
      
      const response = await axios.post(
        'http://localhost:5000/api/bookings/' + bookingId + '/cancel',
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Cancel booking response:', response.data);

      if (!response.data) {
        throw new Error('No response received from server');
      }

      // Refresh the bookings list
      await fetchData();
      
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to cancel booking';
      
      console.error('Detailed error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });

      setBookingError(errorMessage);
      setTimeout(() => setBookingError(''), 3000);
    }
  };

  const filterActiveBookings = (bookings) => {
    return bookings.filter(booking => booking.status !== 'CANCELLED');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ 
      py: 2,
      mt: '64px',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              height: '100%',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Welcome, {profileData.firstName}
        </Typography>
            
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
              orientation="vertical"
              variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }
            }
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
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              height: '100%',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              overflow: 'auto'
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
                      onBookStation={handleStationSelect}
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
    </Container>
  );
};

export default UserDashboard;