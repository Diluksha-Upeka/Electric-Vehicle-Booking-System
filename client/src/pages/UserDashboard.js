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
  Button
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
  const [radius, setRadius] = useState(10); // Default radius in km
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
      filterNearbyStations();
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

  const filterNearbyStations = () => {
    if (!userLocation) return;
    
    const nearby = stations.filter(station => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        station.location.coordinates[1],
        station.location.coordinates[0]
      );
      return distance <= radius;
    });
    
    setNearbyStations(nearby);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
      await bookingService.cancelBooking(bookingId);
      // Update the bookings list by removing the cancelled booking
      setBookings(prevBookings => prevBookings.filter(booking => booking._id !== bookingId));
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (error) {
      setBookingError(error.response?.data?.message || 'Error cancelling booking');
      setTimeout(() => setBookingError(''), 3000);
    }
  };

  const filterActiveBookings = (bookings) => {
    return bookings.filter(booking => booking.status !== 'Cancelled');
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
      py: 4,
      mt: '64px',
      minHeight: 'calc(100vh - 64px)',
    }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome to Your EV Charging Dashboard
        </Typography>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120,
              fontWeight: 500
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
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Box>
          {/* Find Stations Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <MapSection
                  stations={stations}
                  nearbyStations={nearbyStations}
                  userLocation={userLocation}
                  mapCenter={mapCenter}
                  onMapCenterChange={setMapCenter}
                  onStationSelect={handleStationSelect}
                  onRefresh={fetchData}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Available Stations
                  </Typography>
                  <Box sx={{ maxHeight: 'calc(400px - 64px)', overflowY: 'auto' }}>
                    {nearbyStations.map((station) => (
                      <Card 
                        key={station._id} 
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {station.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2" color="text.secondary">
                              {station.location.address || 'Location not available'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BatteryChargingFull sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="body2" color="text.secondary">
                              {station.numberOfConnectors} Connectors Available
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ mt: 'auto' }}>
                          <Button 
                            variant="contained" 
                            fullWidth
                            endIcon={<NavigateNext />}
                            onClick={() => handleStationSelect(station)}
                          >
                            Book Now
                          </Button>
                        </CardActions>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* My Bookings Tab */}
          {activeTab === 1 && (
            <BookingsSection
              bookings={bookings}
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

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        station={selectedStation}
        onBookingSuccess={() => {
          setBookingSuccess(true);
          fetchData();
          setTimeout(() => setBookingSuccess(false), 5000);
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