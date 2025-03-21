import React, { useState, useCallback } from 'react';
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
    openingTime: '09:00 AM',
    closingTime: '06:00 PM',
    availability: {
      isOpen24Hours: false,
      operatingHours: {
        monday: { open: '09:00 AM', close: '06:00 PM' },
        tuesday: { open: '09:00 AM', close: '06:00 PM' },
        wednesday: { open: '09:00 AM', close: '06:00 PM' },
        thursday: { open: '09:00 AM', close: '06:00 PM' },
        friday: { open: '09:00 AM', close: '06:00 PM' },
        saturday: { open: '09:00 AM', close: '06:00 PM' },
        sunday: { open: '09:00 AM', close: '06:00 PM' }
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

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.openingTime) newErrors.openingTime = 'Opening time is required';
    if (!formData.closingTime) newErrors.closingTime = 'Closing time is required';
    if (!formData.totalChargers) newErrors.totalChargers = 'Number of chargers is required';
    else if (formData.totalChargers < 1) newErrors.totalChargers = 'Must have at least 1 charger';
    else if (formData.totalChargers > 50) newErrors.totalChargers = 'Maximum 50 chargers allowed';

    // Validate time format and range
    if (formData.openingTime && formData.closingTime) {
      const openTime = new Date(`1970-01-01 ${formData.openingTime}`);
      const closeTime = new Date(`1970-01-01 ${formData.closingTime}`);
      if (openTime >= closeTime) {
        newErrors.openingTime = 'Opening time must be before closing time';
      }
    }

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
      >
        {marker && <Marker position={marker} />}
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
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.availability.isOpen24Hours}
                    onChange={handle24HoursChange}
                  />
                }
                label="Open 24/7"
              />
            </Grid>

            {!formData.availability.isOpen24Hours && (
              <>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Opening Time"
                      value={formData.openingTime ? new Date(`1970-01-01 ${formData.openingTime}`) : null}
                      onChange={(value) => handleTimeChange('openingTime', value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.openingTime}
                          helperText={errors.openingTime}
                          required
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Closing Time"
                      value={formData.closingTime ? new Date(`1970-01-01 ${formData.closingTime}`) : null}
                      onChange={(value) => handleTimeChange('closingTime', value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.closingTime}
                          helperText={errors.closingTime}
                          required
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}

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