import React, { useState } from 'react';
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
  FormControlLabel
} from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

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
    totalConnectors: 1,
    pricing: {
      baseRate: 0,
      energyRate: 0,
      minimumCharge: 0
    },
    amenities: [],
    availability: {
      isOpen24Hours: true,
      operatingHours: {
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' }
      }
    },
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    status: 'active'
  });

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

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
  };

  const handleAmenityChange = (event) => {
    setSelectedAmenities(event.target.value);
    setFormData(prev => ({
      ...prev,
      amenities: event.target.value
    }));
  };

  const handle24HoursChange = (event) => {
    const isOpen24Hours = event.target.checked;
    setFormData(prev => ({
      ...prev,
      availability: {
        isOpen24Hours,
        operatingHours: isOpen24Hours ? {
          monday: { open: '00:00', close: '23:59' },
          tuesday: { open: '00:00', close: '23:59' },
          wednesday: { open: '00:00', close: '23:59' },
          thursday: { open: '00:00', close: '23:59' },
          friday: { open: '00:00', close: '23:59' },
          saturday: { open: '00:00', close: '23:59' },
          sunday: { open: '00:00', close: '23:59' }
        } : prev.availability.operatingHours
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
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
                multiline
                rows={3}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={{ lat: 6.9271, lng: 79.8612 }} // Default to Sri Lanka
                  zoom={10}
                  onClick={handleMapClick}
                >
                  {marker && <Marker position={marker} />}
                </GoogleMap>
              </LoadScript>
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

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Amenities</InputLabel>
                <Select
                  multiple
                  value={selectedAmenities}
                  onChange={handleAmenityChange}
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