import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  CircularProgress,
  Alert,
  Rating,
  Chip,
  Button,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
} from '@mui/icons-material';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';

const StationList = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          fetchNearbyStations(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setError('Unable to get your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, []);

  const fetchNearbyStations = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stations/nearby`,
        {
          params: {
            latitude,
            longitude,
            maxDistance: 10000, // 10km radius
          },
        }
      );
      console.log('Received stations data:', response.data); // Debug log
      setStations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stations:', error); // Debug log
      setError('Failed to fetch nearby stations');
      setLoading(false);
    }
  };

  const handleStationSelect = (stationId) => {
    setSelectedStation(stationId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '70vh' }}>
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={userLocation}
                zoom={13}
              >
                {stations.map((station) => (
                  <Marker
                    key={station._id}
                    position={{
                      lat: station.location.coordinates[1],
                      lng: station.location.coordinates[0],
                    }}
                    onClick={() => handleStationSelect(station._id)}
                  />
                ))}
              </GoogleMap>
            </LoadScript>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '70vh', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              Nearby Charging Stations
            </Typography>
            <List>
              {stations.map((station) => {
                console.log('Rendering station:', station); // Debug log for each station
                return (
                  <ListItem
                    key={station._id}
                    button
                    onClick={() => handleStationSelect(station._id)}
                  >
                    <ListItemIcon>
                      <LocationOn color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={station.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {station.address?.street}, {station.address?.city}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Rating
                              value={station.rating || 0}
                              precision={0.5}
                              readOnly
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              ({station.reviews?.length || 0} reviews)
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <AttachMoney color="primary" sx={{ fontSize: '1rem', mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {station.ratePerHour ? `LKR ${station.ratePerHour}/hr` : 'Rate not available'}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StationList; 