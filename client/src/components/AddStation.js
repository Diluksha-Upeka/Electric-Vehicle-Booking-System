import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  Button,
  TextField,
  Grid,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress
} from '@mui/material';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import axios from 'axios';

// Define libraries as a static constant
const libraries = ['places', 'marker'];

const containerStyle = {
  width: '100%',
  height: '100vh',
  position: 'relative'
};

const formStyle = {
  position: 'absolute',
  top: 20,
  right: 20,
  width: '400px',
  maxHeight: '90vh',
  overflowY: 'auto',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)'
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'text.secondary',
  },
};

const mapStyles = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#7c93a3" }]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "road",
    "elementType": "labels",
    "stylers": [{ "visibility": "on" }]
  }
];

const AddStation = ({ open, onClose, onAdd }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    version: 'weekly'
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    numberOfConnectors: 1,
    ratePerHour: 0,
    openingTime: '08:00 AM',
    closingTime: '08:00 PM',
    status: 'active'
  });

  const [marker, setMarker] = useState(null);
  const [existingStations, setExistingStations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (open) {
      setLoading(true);
      timeoutId = setTimeout(() => {
        fetchExistingStations();
      }, 300);
    }
    return () => clearTimeout(timeoutId);
  }, [open]);

  const fetchExistingStations = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stations`, { 
        headers,
        params: {
          fields: 'name,location,status'
        }
      });
      setExistingStations(response.data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
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

  if (loadError) {
    return (
      <Dialog open={open} onClose={onClose}>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error">Error loading Google Maps</Typography>
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth fullScreen>
      <Box sx={{ position: 'relative', height: '100vh' }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: 6.9271, lng: 79.8612 }}
            zoom={10}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: 'greedy',
              styles: mapStyles,
              backgroundColor: '#f5f5f5',
              mapTypeControl: true,
              mapTypeControlOptions: {
                style: 2,
                mapTypeIds: ['roadmap', 'satellite']
              }
            }}
          >
            {/* Existing Stations */}
            {!loading && existingStations.map((station) => (
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
            ))}
            
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
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <CircularProgress />
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={formStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Station Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                sx={inputStyle}
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
                rows={2}
                required
                sx={inputStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Connectors"
                name="numberOfConnectors"
                type="number"
                value={formData.numberOfConnectors}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1 }}
                sx={inputStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rate per Hour (LKR)"
                name="ratePerHour"
                type="number"
                value={formData.ratePerHour}
                onChange={handleInputChange}
                required
                inputProps={{ min: 0 }}
                sx={inputStyle}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth sx={inputStyle}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="contained" color="primary">
                  Add Station
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Dialog>
  );
};

export default AddStation; 