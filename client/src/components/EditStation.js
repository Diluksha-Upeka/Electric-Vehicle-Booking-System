import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  Button,
  TextField,
  Grid,
  Box,
  Paper,
  CircularProgress
} from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import axios from 'axios';

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
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
};

const EditStation = ({ open, onClose, onUpdate, station }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    numberOfConnectors: 1,
    ratePerHour: 0,
    status: 'active'
  });

  const [marker, setMarker] = useState(null);
  const [existingStations, setExistingStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && station) {
      setFormData(station);
      setMarker({
        lat: station.location.coordinates[1],
        lng: station.location.coordinates[0]
      });
      fetchExistingStations();
    }
  }, [open, station]);

  const fetchExistingStations = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/api/stations', { headers });
      setExistingStations(response.data.filter(s => s._id !== station._id));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stations:', error);
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
    onUpdate(station._id, formData);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth fullScreen>
      <Box sx={{ position: 'relative', height: '100vh' }}>
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: 6.9271, lng: 79.8612 }}
            zoom={10}
            onClick={handleMapClick}
          >
            {/* Existing Stations */}
            {existingStations.map((existingStation) => (
              <Marker
                key={existingStation._id}
                position={{
                  lat: existingStation.location.coordinates[1],
                  lng: existingStation.location.coordinates[0]
                }}
                title={existingStation.name}
              />
            ))}
            
            {/* Current Station Marker */}
            {marker && (
              <Marker
                position={marker}
                title="Station Location"
              />
            )}
          </GoogleMap>
        </LoadScript>

        <Paper elevation={3} sx={formStyle}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <DialogTitle sx={{ p: 0 }}>Edit Charging Station</DialogTitle>
            <Button onClick={onClose}>Close</Button>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
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
                  rows={2}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Number of Connectors"
                  name="numberOfConnectors"
                  type="number"
                  value={formData.numberOfConnectors}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rate per Hour (LKR)"
                  name="ratePerHour"
                  type="number"
                  value={formData.ratePerHour}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button onClick={handleSubmit} variant="contained" color="primary">
                    Update Station
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Dialog>
  );
};

export default EditStation; 