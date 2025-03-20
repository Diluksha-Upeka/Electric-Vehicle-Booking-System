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
      setStations(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch nearby stations');
      setLoading(false);
    }
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
  };

  const handleInfoWindowClose = () => {
    setSelectedStation(null);
  };

  const handleStationSelect = (stationId) => {
    navigate(`/stations/${stationId}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '70vh', overflow: 'hidden' }}>
            {userLocation && (
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
                      onClick={() => handleStationClick(station)}
                    />
                  ))}
                  {selectedStation && (
                    <InfoWindow
                      position={{
                        lat: selectedStation.location.coordinates[1],
                        lng: selectedStation.location.coordinates[0],
                      }}
                      onCloseClick={handleInfoWindowClose}
                    >
                      <Box>
                        <Typography variant="h6">{selectedStation.name}</Typography>
                        <Typography variant="body2">
                          {selectedStation.address.street}, {selectedStation.address.city}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleStationSelect(selectedStation._id)}
                          sx={{ mt: 1 }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            )}
          </Paper>
        </Grid>

        {/* Station List Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '70vh', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              Nearby Charging Stations
            </Typography>
            <List>
              {stations.map((station) => (
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
                          {station.address.street}, {station.address.city}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Rating
                            value={station.rating}
                            precision={0.5}
                            readOnly
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({station.reviews.length} reviews)
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {station.connectors.map((connector, index) => (
                            <Chip
                              key={index}
                              label={`${connector.type} ${connector.powerOutput}kW`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StationList; 