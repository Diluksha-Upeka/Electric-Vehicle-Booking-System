import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton, Tooltip, List, ListItem, ListItemText, ListItemButton, Paper, Divider, Button } from '@mui/material';
import { MyLocation, Refresh, LocationOn, ElectricCar, BookOnline } from '@mui/icons-material';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useTheme } from '@mui/material/styles';
import RadiusFilter from '../RadiusFilter';
import { alpha } from '@mui/material/styles';

// Define libraries as a static constant
const libraries = ['places', 'marker'];

// Define map styles for a more enterprise look with eco-friendly colors
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e9e9e9' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#bdbdbd' }]
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#bdbdbd' }]
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }]
  }
];

const MapSection = ({ 
  stations, 
  nearbyStations, 
  userLocation, 
  mapCenter, 
  onMapCenterChange,
  onStationSelect,
  onRefresh,
  onRadiusChange,
  onBookStation
}) => {
  const theme = useTheme();
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [stationsToDisplay, setStationsToDisplay] = useState([]);
  const [radius, setRadius] = useState(10000); // Default 10km radius
  const [bounds, setBounds] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // Use useJsApiLoader hook instead of LoadScript component for better reliability
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    version: 'weekly'
  });

  // Get user's current location
  const getUserLocation = useCallback(() => {
    setIsLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          if (onMapCenterChange) {
            onMapCenterChange(location);
          }
          setIsLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setMapError('Unable to get your location. Please enable location services.');
          setIsLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setMapError('Geolocation is not supported by your browser');
      setIsLocationLoading(false);
    }
  }, [onMapCenterChange]);

  // Initial location fetch
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Check API key on initial render
  useEffect(() => {
    if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is not set!');
      setMapError('Google Maps API key is not configured');
    }
    
    if (loadError) {
      console.error('Error loading maps:', loadError);
      setMapError('Failed to load Google Maps: ' + loadError.message);
    }
  }, [loadError]);

  // Update stationsToDisplay when stations or nearbyStations change
  useEffect(() => {
    if (nearbyStations && nearbyStations.length > 0) {
      setStationsToDisplay(nearbyStations);
    } else if (stations && stations.length > 0) {
      setStationsToDisplay(stations);
    } else {
      setStationsToDisplay([]);
    }
  }, [stations, nearbyStations]);

  // Fit bounds when stations or location changes
  useEffect(() => {
    if (mapLoaded && stationsToDisplay.length > 0 && currentLocation) {
      fitBoundsToStations(stationsToDisplay, currentLocation);
    }
  }, [mapLoaded, stationsToDisplay, currentLocation]);

  // Function to fit map bounds to show all stations and user location
  const fitBoundsToStations = (stations, userLoc) => {
    if (!mapRef.current || !stations.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    
    // Add user location to bounds
    if (userLoc) {
      bounds.extend(userLoc);
    }

    // Add all stations to bounds
    stations.forEach(station => {
      if (station?.location?.coordinates) {
        bounds.extend({
          lat: station.location.coordinates[1],
          lng: station.location.coordinates[0]
        });
      }
    });

    // Add padding to bounds
    const padding = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    };

    mapRef.current.fitBounds(bounds, padding);
    setBounds(bounds);
  };

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    position: 'relative'
  };

  const customMarkerIcon = useMemo(() => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: '#2E7D32',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#FFFFFF",
    scale: 1.5,
    anchor: isLoaded && window.google?.maps ? new window.google.maps.Point(12, 22) : undefined
  }), [isLoaded]);

  const userMarkerIcon = useMemo(() => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: '#1976D2',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#FFFFFF",
    scale: 2,
    anchor: isLoaded && window.google?.maps ? new window.google.maps.Point(12, 22) : undefined
  }), [isLoaded]);

  const onMapLoad = (map) => {
    mapRef.current = map;
    setMapLoaded(true);
  };

  const handleMarkerClick = (station) => {
    setSelectedMarker(station);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  const handleRefresh = () => {
    setSelectedMarker(null);
    getUserLocation(); // Refresh location
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  const handleLocationClick = () => {
    if (currentLocation) {
      onMapCenterChange(currentLocation);
      if (mapRef.current) {
        mapRef.current.panTo(currentLocation);
        mapRef.current.setZoom(15);
      }
    } else {
      getUserLocation(); // Try to get location again if not available
    }
  };

  const handleStationSelect = (station) => {
    if (onStationSelect) {
      onStationSelect(station);
    }
    // Center map on selected station
    if (mapRef.current && station?.location?.coordinates) {
      const position = {
        lat: station.location.coordinates[1],
        lng: station.location.coordinates[0]
      };
      mapRef.current.panTo(position);
      mapRef.current.setZoom(15);
      setSelectedMarker(station);
    }
  };

  const handleBookStation = (station, event) => {
    event.stopPropagation(); // Prevent triggering the ListItemButton click
    if (onBookStation) {
      onBookStation(station);
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 1,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2E7D32' }}>
          Available Stations {stationsToDisplay?.length > 0 ? `(${stationsToDisplay.length})` : ''}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <RadiusFilter radius={radius} onRadiusChange={handleRadiusChange} />
          <Tooltip title="Use my location">
            <span>
              <IconButton 
                onClick={handleLocationClick}
                size="small" 
                disabled={isLocationLoading}
                sx={{ 
                  color: '#1976D2',
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                  }
                }}
              >
                <MyLocation sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Refresh stations">
            <IconButton 
              onClick={handleRefresh} 
              size="small"
              sx={{ 
                color: '#2E7D32',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'rgba(46, 125, 50, 0.1)'
                }
              }}
            >
              <Refresh sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {mapError ? (
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="error">{mapError}</Typography>
        </Box>
      ) : !isLoaded ? (
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress size={20} sx={{ color: '#2E7D32' }} />
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flex: 1, 
          minHeight: 0,
          height: 'calc(100vh - 180px)'
        }}>
          {/* Map Section */}
          <Box sx={{ 
            flex: 2, 
            position: 'relative', 
            minHeight: 0,
            height: '100%'
          }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
              center={currentLocation || mapCenter}
            zoom={13}
            onLoad={onMapLoad}
            options={{
                disableDefaultUI: true,
              zoomControl: true,
                mapTypeControl: false,
              streetViewControl: false,
                fullscreenControl: false,
                styles: mapStyles,
                gestureHandling: 'greedy'
            }}
          >
            {mapLoaded && (
              <>
                {/* User Location Marker */}
                  {currentLocation && (
                    <Marker
                      position={currentLocation}
                      icon={userMarkerIcon}
                      title="Your Location"
                      zIndex={1000}
                    />
                )}

                {/* Station Markers */}
                {stationsToDisplay && stationsToDisplay.length > 0 && stationsToDisplay.map((station) => {
                  if (!station?.location?.coordinates || 
                      !Array.isArray(station.location.coordinates) || 
                      station.location.coordinates.length < 2) {
                    return null;
                  }
                  
                  const markerKey = `station-${station._id}-${station.location.coordinates[1]}-${station.location.coordinates[0]}`;
                  
                  return (
                    <Marker
                      key={markerKey}
                      position={{
                        lat: station.location.coordinates[1],
                        lng: station.location.coordinates[0]
                      }}
                      onClick={() => handleMarkerClick(station)}
                      title={station.name || 'Charging Station'}
                      icon={customMarkerIcon}
                      zIndex={1}
                    />
                  );
                })}

                {/* InfoWindow */}
                {selectedMarker && (
                  <InfoWindow
                    position={{
                      lat: selectedMarker.location.coordinates[1],
                      lng: selectedMarker.location.coordinates[0]
                    }}
                    onCloseClick={handleInfoWindowClose}
                    options={{
                      pixelOffset: new window.google.maps.Size(0, -30),
                      maxWidth: 200
                    }}
                  >
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.primary.main,
                        fontSize: '0.875rem',
                        mb: 0.5
                      }}>
                        {selectedMarker.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        fontSize: '0.75rem',
                        mb: 1
                      }}>
                        {selectedMarker.numberOfConnectors} Connectors Available
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<BookOnline />}
                        onClick={(e) => handleBookStation(selectedMarker, e)}
                        fullWidth
                        sx={{ 
                          backgroundColor: theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark
                          },
                          fontSize: '0.75rem',
                          py: 0.5
                        }}
                      >
                        Book Now
                      </Button>
                    </Box>
                  </InfoWindow>
                )}
              </>
            )}
          </GoogleMap>
          </Box>

          {/* Station List */}
          <Paper 
            elevation={1} 
            sx={{ 
              flex: 1,
              overflow: 'hidden',
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${theme.palette.divider}`,
              minWidth: '250px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Box sx={{ 
              p: 1.5, 
              borderBottom: `1px solid ${theme.palette.divider}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              flexShrink: 0
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                Available Stations {stationsToDisplay?.length > 0 ? `(${stationsToDisplay.length})` : ''}
              </Typography>
            </Box>
            <Box sx={{ 
              overflow: 'auto',
              flex: 1,
              minHeight: 0,
              maxHeight: 'calc(100vh - 240px)',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.primary.main, 0.05),
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.2),
                borderRadius: '4px',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.3),
                },
              },
            }}>
              <List sx={{ p: 0 }}>
                {stationsToDisplay && stationsToDisplay.length > 0 ? (
                  stationsToDisplay.map((station, index) => (
                    <React.Fragment key={station._id}>
                      <ListItemButton
                        onClick={() => handleStationSelect(station)}
                        selected={selectedMarker?._id === station._id}
                        sx={{
                          py: 1,
                          px: 2,
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.12),
                            },
                          },
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box component="div">
                              <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '0.875rem' }}>
                                {station.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                              <LocationOn sx={{ color: 'text.secondary', fontSize: '0.875rem' }} />
                              <Typography variant="body2" component="span" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {station.location.address || 'Location not available'}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ElectricCar sx={{ color: theme.palette.primary.main, fontSize: '1rem' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {station.numberOfConnectors}
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<BookOnline />}
                            onClick={(e) => handleBookStation(station, e)}
                            sx={{ 
                              backgroundColor: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: theme.palette.primary.dark
                              },
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem'
                            }}
                          >
                            Book
                          </Button>
                        </Box>
                      </ListItemButton>
                      {index < stationsToDisplay.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '0.75rem' }}>
                          No stations found within {radius / 1000}km radius
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default MapSection;