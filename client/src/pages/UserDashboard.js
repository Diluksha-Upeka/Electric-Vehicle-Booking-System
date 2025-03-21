import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  MenuItem,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  LocationOn, 
  AccessTime, 
  AttachMoney, 
  BatteryChargingFull,
  ElectricCar,
  Map,
  History,
  Settings,
  NavigateNext,
  Refresh,
  MyLocation
} from '@mui/icons-material';
import axios from 'axios';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import BookingDialog from '../components/BookingDialog';
import bookingService from '../services/bookingService';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const [bookingData, setBookingData] = useState({
    startTime: '',
    endTime: '',
    connector: '',
    batteryDetails: {
      initialPercentage: '',
      targetPercentage: '',
      estimatedChargingTime: ''
    }
  });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
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
  const [mapError, setMapError] = useState('');
  const [mapLoading, setMapLoading] = useState(true);
  const [markerError, setMarkerError] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [radius, setRadius] = useState(10); // Default radius in km
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [checkInError, setCheckInError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Custom styles
  const theme = useTheme();
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4]
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    position: 'relative'
  };

  const loadingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  };

  const customMarkerIcon = useMemo(() => ({
    url: `${window.location.origin}/favicon.png`,
    scaledSize: { width: 40, height: 40 },
    anchor: { x: 20, y: 20 }
  }), []);

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

  const handleBookingClick = (station) => {
    setSelectedStation(station);
    setBookingDialogOpen(true);
  };

  const handleBookingSubmit = async () => {
    try {
      // Validate required fields
      if (!bookingData.startTime || !bookingData.endTime || !bookingData.connector || 
          !bookingData.batteryDetails.initialPercentage || !bookingData.batteryDetails.targetPercentage) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate battery percentages
      const currentPercentage = parseInt(bookingData.batteryDetails.initialPercentage);
      const targetPercentage = parseInt(bookingData.batteryDetails.targetPercentage);
      
      if (currentPercentage < 0 || currentPercentage > 100 || targetPercentage < 0 || targetPercentage > 100) {
        setError('Battery percentages must be between 0 and 100');
        return;
      }

      if (targetPercentage <= currentPercentage) {
        setError('Target battery percentage must be greater than current percentage');
        return;
      }

      // Validate time range
      const startTime = new Date(bookingData.startTime);
      const endTime = new Date(bookingData.endTime);
      
      if (startTime >= endTime) {
        setError('End time must be after start time');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to make a booking');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Calculate estimated charging time based on battery details
      const batteryCapacity = parseFloat(profileData.vehicleDetails?.batteryCapacity) || 50; // Default to 50kWh if not set
      const chargingRate = 7; // Default charging rate in kW
      
      // Calculate estimated charging time in minutes
      const estimatedChargingTime = Math.ceil(
        ((targetPercentage - currentPercentage) / 100) * batteryCapacity * 60 / chargingRate
      );

      console.log('Sending booking request with data:', {
        stationId: selectedStation._id,
        connector: bookingData.connector,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        batteryDetails: {
          initialPercentage: currentPercentage,
          estimatedChargingTime: estimatedChargingTime
        }
      });

      const response = await axios.post('http://localhost:5000/api/bookings', {
        stationId: selectedStation._id,
        connector: bookingData.connector,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        batteryDetails: {
          initialPercentage: currentPercentage,
          estimatedChargingTime: estimatedChargingTime
        }
      }, { 
        headers,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't reject if status is less than 500
        }
      });

      console.log('Server response:', response);

      if (response.status === 201 || response.status === 200) {
        fetchData(); // Refresh bookings list
        setBookingDialogOpen(false);
        setBookingData({
          startTime: '',
          endTime: '',
          connector: '',
          batteryDetails: {
            initialPercentage: '',
            targetPercentage: '',
            estimatedChargingTime: ''
          }
        });
        setError(''); // Clear any previous errors
      } else {
        setError(response.data?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        setError(error.response.data?.message || 'Failed to create booking');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setError('No response from server. Please check if the server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        setError('Error setting up the request');
      }
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put('http://localhost:5000/api/auth/profile', profileData, { headers });
      fetchData(); // Refresh profile data
      setProfileDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setBookingData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRadiusChange = (e) => {
    setRadius(parseInt(e.target.value));
  };

  const handleMarkerClick = (station) => {
    setSelectedMarker(station);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  const handleBookingSuccess = (booking) => {
    setBookingSuccess(true);
    fetchData(); // Refresh bookings list
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  const handleBookingError = (error) => {
    setBookingError(error);
    setTimeout(() => setBookingError(''), 5000);
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/check-in`,
        {},
        { headers }
      );
      
      setCheckInSuccess(true);
      fetchData(); // Refresh bookings list
      setTimeout(() => setCheckInSuccess(false), 5000);
    } catch (error) {
      console.error('Error checking in:', error);
      setCheckInError(error.response?.data?.message || 'Failed to check in');
      setTimeout(() => setCheckInError(''), 5000);
    }
  };

  const filterActiveBookings = (bookings) => {
    return bookings.filter(booking => booking.status !== 'Cancelled');
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

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <Box>
          {/* Find Stations Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Nearby Charging Stations
                    </Typography>
                    <Box>
                      <Tooltip title="Use my location">
                        <IconButton onClick={getUserLocation} size="small" sx={{ mr: 1 }}>
                          <MyLocation />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refresh stations">
                        <IconButton onClick={fetchData} size="small">
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={mapContainerStyle}>
                    {(!scriptLoaded || !mapLoaded) && (
                      <Box sx={loadingOverlayStyle}>
                        <CircularProgress />
                      </Box>
                    )}
                    <LoadScript 
                      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                      onLoad={() => setScriptLoaded(true)}
                      onError={(error) => {
                        console.error('Error loading Google Maps script:', error);
                        setMapError('Failed to load Google Maps');
                      }}
                    >
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={12}
                        options={{
                          fullscreenControl: false,
                          streetViewControl: false
                        }}
                        onLoad={() => setMapLoaded(true)}
                        onError={(error) => {
                          console.error('Error loading Google Map:', error);
                          setMapError('Failed to load map');
                        }}
                      >
                        {scriptLoaded && mapLoaded && !mapError && (
                          <>
                            {/* User Location Marker */}
                            {userLocation && (
                              <Marker
                                position={userLocation}
                                icon={{
                                  url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                  scaledSize: { width: 40, height: 40 },
                                  anchor: { x: 20, y: 20 }
                                }}
                                title="Your Location"
                              />
                            )}

                            {/* Station Markers */}
                            {(userLocation ? nearbyStations : stations).map((station) => (
                              <Marker
                                key={station._id}
                                position={{
                                  lat: station.location.coordinates[1],
                                  lng: station.location.coordinates[0]
                                }}
                                onClick={() => {
                                  handleMarkerClick(station);
                                }}
                                title={station.name}
                                icon={{
                                  url: `${window.location.origin}/favicon.png`,
                                  scaledSize: { width: 40, height: 40 },
                                  anchor: { x: 20, y: 20 }
                                }}
                              />
                            ))}

                            {/* InfoWindow */}
                            {selectedMarker && (
                              <InfoWindow
                                position={{
                                  lat: selectedMarker.location.coordinates[1],
                                  lng: selectedMarker.location.coordinates[0]
                                }}
                                onCloseClick={handleInfoWindowClose}
                              >
                                <div>
                                  <Typography variant="subtitle2">{selectedMarker.name}</Typography>
                                  <Typography variant="body2">
                                    {selectedMarker.numberOfConnectors} connectors available
                                  </Typography>
                                  <Typography variant="body2">
                                    {selectedMarker.ratePerHour} LKR/hour
                                  </Typography>
                                  <Button 
                                    size="small" 
                                    variant="contained" 
                                    onClick={() => handleBookingClick(selectedMarker)}
                                    sx={{ mt: 1 }}
                                  >
                                    Book Now
                                  </Button>
                                </div>
                              </InfoWindow>
                            )}
                          </>
                        )}
                      </GoogleMap>
                    </LoadScript>
                  </Box>
                </Paper>
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
                          ...cardStyle
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
                            onClick={() => handleBookingClick(station)}
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
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Your Bookings
                  </Typography>
                  <Grid container spacing={3}>
                    {bookings.map((booking) => (
                      <Grid item xs={12} md={6} lg={4} key={booking._id}>
                        <Card 
                          sx={{
                            borderRadius: 2,
                            ...cardStyle
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <ElectricCar sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="h6">
                                {booking.station.name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTime sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="body2">
                                  {new Date(booking.timeSlot.date).toLocaleDateString()} at {booking.timeSlot.startTime}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ mr: 1, color: 'error.main' }} />
                                <Typography variant="body2">
                                  {booking.station.location.address || 'Location not available'}
                                </Typography>
                              </Box>
                              <Chip 
                                label={booking.status}
                                color={
                                  booking.status === 'CONFIRMED' ? 'success' :
                                  booking.status === 'PENDING' ? 'warning' :
                                  'error'
                                }
                                size="small"
                                sx={{ alignSelf: 'flex-start', mt: 1 }}
                              />
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button 
                              color="error" 
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={booking.status === 'CANCELLED'}
                            >
                              Cancel Booking
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Profile Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={profileData.email}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Vehicle Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Vehicle Make"
                        value={profileData.vehicleDetails?.make || ''}
                        onChange={(e) => handleProfileChange('vehicleDetails.make', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Vehicle Model"
                        value={profileData.vehicleDetails?.model || ''}
                        onChange={(e) => handleProfileChange('vehicleDetails.model', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Year"
                        value={profileData.vehicleDetails?.year || ''}
                        onChange={(e) => handleProfileChange('vehicleDetails.year', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Battery Capacity (kWh)"
                        value={profileData.vehicleDetails?.batteryCapacity || ''}
                        onChange={(e) => handleProfileChange('vehicleDetails.batteryCapacity', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleProfileUpdate}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        station={selectedStation}
        onBookingSuccess={handleBookingSuccess}
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

      {checkInSuccess && (
        <Alert severity="success" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          Check-in successful!
        </Alert>
      )}

      {checkInError && (
        <Alert severity="error" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          {checkInError}
        </Alert>
      )}

      {/* Profile Edit Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name"
              name="firstName"
              value={profileData.firstName}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={profileData.lastName}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              fullWidth
            />
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Vehicle Details</Typography>
            <TextField
              label="Make"
              name="vehicleDetails.make"
              value={profileData.vehicleDetails?.make || ''}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Model"
              name="vehicleDetails.model"
              value={profileData.vehicleDetails?.model || ''}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Year"
              name="vehicleDetails.year"
              value={profileData.vehicleDetails?.year || ''}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Battery Capacity (kWh)"
              name="vehicleDetails.batteryCapacity"
              value={profileData.vehicleDetails?.batteryCapacity || ''}
              onChange={handleProfileChange}
              fullWidth
            />
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Charging Preferences</Typography>
            <TextField
              label="Preferred Power Output (kW)"
              name="chargingPreferences.preferredPowerOutput"
              value={profileData.chargingPreferences?.preferredPowerOutput || ''}
              onChange={handleProfileChange}
              fullWidth
            />
            <TextField
              label="Preferred Time Slot"
              name="chargingPreferences.preferredTimeSlot"
              value={profileData.chargingPreferences?.preferredTimeSlot || ''}
              onChange={handleProfileChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProfileUpdate} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserDashboard;