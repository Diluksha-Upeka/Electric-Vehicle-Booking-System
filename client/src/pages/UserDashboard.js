import React, { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import { LocationOn, AccessTime, AttachMoney, BatteryChargingFull } from '@mui/icons-material';
import axios from 'axios';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const UserDashboard = () => {
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

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

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
      setBookings(bookingsResponse.data);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {profileData.firstName}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your bookings and profile
            </Typography>
          </Paper>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Paper>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Stations" />
              <Tab label="My Bookings" />
              <Tab label="Profile" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Content */}
        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeTab === 0 ? (
            // Stations View
            <Grid container spacing={3}>
              {/* Map Options */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography>Show stations within:</Typography>
                    <TextField
                      select
                      label="Radius (km)"
                      value={radius}
                      onChange={handleRadiusChange}
                      sx={{ width: 120 }}
                    >
                      <MenuItem value={5}>5 km</MenuItem>
                      <MenuItem value={10}>10 km</MenuItem>
                      <MenuItem value={20}>20 km</MenuItem>
                      <MenuItem value={50}>50 km</MenuItem>
                      <MenuItem value={100}>100 km</MenuItem>
                      <MenuItem value={500}>All</MenuItem>
                    </TextField>
                    <Typography>
                      {userLocation ? `${nearbyStations.length} stations found` : 'Getting your location...'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Map Section */}
              <Grid item xs={12}>
                <Paper sx={{ height: 400, mb: 3, position: 'relative' }}>
                  {mapError ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography color="error">{mapError}</Typography>
                    </Box>
                  ) : (
                    <LoadScript 
                      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                      onLoad={() => setMapLoading(false)}
                      onError={() => {
                        setMapError('Failed to load Google Maps. Please check your API key.');
                        setMapLoading(false);
                      }}
                    >
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={12}
                        options={{
                          zoomControl: true,
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: false
                        }}
                      >
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
                              url: markerError ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : '/charging-station-icon.png',
                              scaledSize: { width: 40, height: 40 },
                              anchor: { x: 20, y: 20 },
                              labelOrigin: { x: 20, y: -10 }
                            }}
                            onLoad={() => {
                              // Check if the custom icon loaded successfully
                              const img = new Image();
                              img.onerror = () => setMarkerError(true);
                              img.src = '/charging-station-icon.png';
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
                      </GoogleMap>
                    </LoadScript>
                  )}
                  {mapLoading && (
                    <Box 
                      position="absolute" 
                      top="50%" 
                      left="50%" 
                      sx={{ transform: 'translate(-50%, -50%)' }}
                      zIndex={1}
                    >
                      <CircularProgress />
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Stations List */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Available Charging Stations
                </Typography>
              </Grid>
              
              {(userLocation ? nearbyStations : stations).map((station) => (
                <Grid item xs={12} md={6} key={station._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {station.name}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {station.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" />
                        <Typography variant="body2">
                          {userLocation ? `${calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            station.location.coordinates[1],
                            station.location.coordinates[0]
                          ).toFixed(1)} km away` : 'Distance unavailable'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BatteryChargingFull fontSize="small" />
                        <Typography variant="body2">
                          {station.numberOfConnectors} Connectors Available
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney fontSize="small" />
                        <Typography variant="body2">
                          {station.ratePerHour} LKR/hour
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleBookingClick(station)}
                      >
                        Book Now
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedMarker(station);
                          setMapCenter({
                            lat: station.location.coordinates[1],
                            lng: station.location.coordinates[0]
                          });
                        }}
                      >
                        View on Map
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : activeTab === 1 ? (
            // Bookings View
            <List>
              {bookings.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6">No bookings found</Typography>
                  <Typography variant="body1" color="text.secondary">
                    You haven't made any bookings yet.
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => setActiveTab(0)}
                  >
                    Book a Station
                  </Button>
                </Paper>
              ) : (
                bookings.map((booking) => (
                  <React.Fragment key={booking._id}>
                    <ListItem>
                      <ListItemText
                        primary={`Booking at ${booking.station.name}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString()}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2">
                              Status: <Chip label={booking.status} size="small" color={
                                booking.status === 'Completed' ? 'success' :
                                booking.status === 'Cancelled' ? 'error' :
                                booking.status === 'Active' ? 'primary' : 'default'
                              } />
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          ) : (
            // Profile View
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Profile Information</Typography>
                <Button variant="contained" onClick={() => setProfileDialogOpen(true)}>
                  Edit Profile
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography>Name: {profileData.firstName} {profileData.lastName}</Typography>
                  <Typography>Email: {profileData.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Vehicle Details
                  </Typography>
                  <Typography>
                    {profileData.vehicleDetails?.make} {profileData.vehicleDetails?.model} ({profileData.vehicleDetails?.year})
                  </Typography>
                  <Typography>
                    Battery Capacity: {profileData.vehicleDetails?.batteryCapacity} kWh
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Charging Station</DialogTitle>
        <DialogContent>
          {selectedStation && (
            <DialogContentText>
              Book a charging session at {selectedStation.name}
            </DialogContentText>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Start Time"
              type="datetime-local"
              name="startTime"
              value={bookingData.startTime}
              onChange={handleBookingChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time"
              type="datetime-local"
              name="endTime"
              value={bookingData.endTime}
              onChange={handleBookingChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Connector Type"
              name="connector"
              value={bookingData.connector}
              onChange={handleBookingChange}
              fullWidth
            >
              <MenuItem value="Type 1">Type 1</MenuItem>
              <MenuItem value="Type 2">Type 2</MenuItem>
              <MenuItem value="CCS">CCS</MenuItem>
              <MenuItem value="CHAdeMO">CHAdeMO</MenuItem>
            </TextField>
            <TextField
              label="Current Battery Percentage"
              type="number"
              name="batteryDetails.initialPercentage"
              value={bookingData.batteryDetails.initialPercentage}
              onChange={handleBookingChange}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Target Battery Percentage"
              type="number"
              name="batteryDetails.targetPercentage"
              value={bookingData.batteryDetails.targetPercentage}
              onChange={handleBookingChange}
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBookingSubmit} variant="contained">
            Book Now
          </Button>
        </DialogActions>
      </Dialog>

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