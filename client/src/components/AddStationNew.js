import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  Select,
  Chip,
  FormHelperText,
  Switch,
  FormControlLabel,
  Typography,
  CircularProgress
} from '@mui/material';
import { GoogleMap, LoadScript, Marker, useJsApiLoader } from '@react-google-maps/api';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import axios from 'axios';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const AMENITIES = [
  'Restaurant',
  'Cafe',
  'Restroom',
  'WiFi',
  'Parking',
  'Shop',
  '24/7 Access',
  'Security',
  'Covered Parking',
  'Waiting Area'
];

const AddStation = ({ open, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    connectors: [{ type: 'Type 2', powerOutput: 7, count: 1 }],
    maxPowerOutput: 0,
    totalChargers: 1,
    pricing: {
      baseRate: 0,
      energyRate: 0,
      minimumCharge: 0
    },
    amenities: [],
    openingTime: '08:00 AM',
    closingTime: '08:00 PM',
    availability: {
      isOpen24Hours: false,
      operatingHours: {
        monday: { open: '08:00 AM', close: '08:00 PM' },
        tuesday: { open: '08:00 AM', close: '08:00 PM' },
        wednesday: { open: '08:00 AM', close: '08:00 PM' },
        thursday: { open: '08:00 AM', close: '08:00 PM' },
        friday: { open: '08:00 AM', close: '08:00 PM' },
        saturday: { open: '08:00 AM', close: '08:00 PM' },
        sunday: { open: '08:00 AM', close: '08:00 PM' }
      }
    },
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [existingStations, setExistingStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  useEffect(() => {
    if (open) {
      fetchExistingStations();
    }
  }, [open]);

  const fetchExistingStations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const apiUrl = 'https://evcbs-backend.onrender.com';
      console.log('Fetching stations from:', `${apiUrl}/api/stations`);

      const response = await axios.get(`${apiUrl}/api/stations`, { 
        headers,
        params: {
          fields: 'name,location,status'
        }
      });

      console.log('Received stations data:', response.data);
      
      if (!Array.isArray(response.data)) {
        console.error('Invalid response format. Expected an array of stations');
        return;
      }

      const validStations = response.data.filter(station => 
        station.location && 
        Array.isArray(station.location.coordinates) && 
        station.location.coordinates.length === 2
      );

      console.log('Valid stations to display:', validStations);
      setExistingStations(validStations);
    } catch (error) {
      console.error('Error fetching stations:', error.response?.data || error.message);
      setMapError('Failed to load existing stations');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerIcon = (isNew = false) => {
    const baseIcon = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: isNew ? '#2196F3' : '#4CAF50',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#FFFFFF',
      scale: 1.5,
      anchor: new window.google.maps.Point(12, 24),
    };

    return {
      ...baseIcon,
      fillColor: isNew ? '#2196F3' : '#4CAF50',
    };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.totalChargers) newErrors.totalChargers = 'Number of chargers is required';
    else if (formData.totalChargers < 1) newErrors.totalChargers = 'Must have at least 1 charger';
    else if (formData.totalChargers > 50) newErrors.totalChargers = 'Maximum 50 chargers allowed';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setFormData(prev => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    }));
    setMarker({ lat, lng });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTimeChange = (name, value) => {
    if (value) {
      const formattedTime = value.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setFormData(prev => ({
        ...prev,
        [name]: formattedTime,
        availability: {
          ...prev.availability,
          operatingHours: Object.fromEntries(
            Object.entries(prev.availability.operatingHours).map(([day]) => [
              day,
              { open: name === 'openingTime' ? formattedTime : prev.openingTime,
                close: name === 'closingTime' ? formattedTime : prev.closingTime }
            ])
          )
        }
      }));
    }
  };

  const handle24HoursChange = (event) => {
    const isOpen24Hours = event.target.checked;
    setFormData(prev => ({
      ...prev,
      openingTime: isOpen24Hours ? '12:00 AM' : '09:00 AM',
      closingTime: isOpen24Hours ? '11:59 PM' : '06:00 PM',
      availability: {
        ...prev.availability,
        isOpen24Hours,
        operatingHours: Object.fromEntries(
          Object.entries(prev.availability.operatingHours).map(([day]) => [
            day,
            { open: isOpen24Hours ? '12:00 AM' : '09:00 AM',
              close: isOpen24Hours ? '11:59 PM' : '06:00 PM' }
          ])
        )
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onAdd(formData);
      onClose();
    }
  };

  const renderMap = () => {
    if (loadError) {
      return (
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="error">
            Error loading Google Maps. Please check your API key and try again.
          </Typography>
        </Box>
      );
    }

    if (!isLoaded) {
      return (
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: 6.9271, lng: 79.8612 }}
        zoom={10}
        onClick={handleMapClick}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: 2,
            mapTypeIds: ['roadmap', 'satellite']
          }
        }}
      >
        {/* Existing Stations */}
        {!loading && existingStations.length > 0 && existingStations.map((station) => {
          console.log('Rendering station:', station);
          return (
            <Marker
              key={station._id}
              position={{
                lat: station.location.coordinates[1],
                lng: station.location.coordinates[0]
              }}
              title={station.name}
              icon={getMarkerIcon(false)}
              animation={window.google.maps.Animation.DROP}
            />
          );
        })}
        
        {/* New Station Marker */}
        {marker && (
          <Marker
            position={marker}
            title="New Station Location"
            icon={getMarkerIcon(true)}
            animation={window.google.maps.Animation.BOUNCE}
          />
        )}
      </GoogleMap>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Charging Station</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Station Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
                required
              />
            </Grid>

            <Grid item xs={12}>
              {renderMap()}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Operating Hours: 8:00 AM - 8:00 PM (Fixed)
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Opening Time"
                value="08:00 AM"
                disabled
                helperText="Fixed operating hours"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Time"
                value="08:00 PM"
                disabled
                helperText="Fixed operating hours"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Chargers"
                name="totalChargers"
                type="number"
                value={formData.totalChargers}
                onChange={handleInputChange}
                error={!!errors.totalChargers}
                helperText={errors.totalChargers}
                required
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contactInfo.email"
                type="email"
                value={formData.contactInfo.email}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Connector Type"
                name="connectors.0.type"
                value={formData.connectors[0].type}
                onChange={handleInputChange}
                select
                required
              >
                <MenuItem value="Type 1">Type 1</MenuItem>
                <MenuItem value="Type 2">Type 2</MenuItem>
                <MenuItem value="CCS">CCS</MenuItem>
                <MenuItem value="CHAdeMO">CHAdeMO</MenuItem>
                <MenuItem value="Tesla">Tesla</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Power Output (kW)"
                name="connectors.0.powerOutput"
                type="number"
                value={formData.connectors[0].powerOutput}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Connectors"
                name="connectors.0.count"
                type="number"
                value={formData.connectors[0].count}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Power Output (kW)"
                name="maxPowerOutput"
                type="number"
                value={formData.maxPowerOutput}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Rate (per hour)"
                name="pricing.baseRate"
                type="number"
                value={formData.pricing.baseRate}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Energy Rate (per kWh)"
                name="pricing.energyRate"
                type="number"
                value={formData.pricing.energyRate}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Charge"
                name="pricing.minimumCharge"
                type="number"
                value={formData.pricing.minimumCharge}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Amenities</InputLabel>
                <Select
                  multiple
                  value={selectedAmenities}
                  onChange={handleInputChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {AMENITIES.map((amenity) => (
                    <MenuItem key={amenity} value={amenity}>
                      {amenity}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select available amenities</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Station
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStation; 