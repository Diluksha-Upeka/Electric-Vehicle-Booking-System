import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, IconButton, Tooltip, Button } from '@mui/material';
import { MyLocation, Refresh } from '@mui/icons-material';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useTheme } from '@mui/material/styles';

// Define libraries as a static constant
const libraries = ['places', 'marker'];

const MapSection = ({ 
  stations, 
  nearbyStations, 
  userLocation, 
  mapCenter, 
  onMapCenterChange,
  onStationSelect,
  onRefresh
}) => {
  const theme = useTheme();
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [stationsToDisplay, setStationsToDisplay] = useState([]);

  // Use useJsApiLoader hook instead of LoadScript component for better reliability
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    version: 'weekly'
  });

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
    console.log('MapSection - Stations:', stations?.length);
    console.log('MapSection - Nearby Stations:', nearbyStations?.length);
    console.log('MapSection - User Location:', userLocation);
    
    if (userLocation && nearbyStations && nearbyStations.length > 0) {
      setStationsToDisplay(nearbyStations);
    } else if (stations && stations.length > 0) {
      setStationsToDisplay(stations);
    } else {
      setStationsToDisplay([]);
    }
  }, [userLocation, stations, nearbyStations]);

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
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: "#FF4444",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#FFFFFF",
    scale: 1.5,
    anchor: isLoaded && window.google?.maps ? new window.google.maps.Point(12, 22) : undefined
  }), [isLoaded]);

  const userMarkerIcon = useMemo(() => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#FFFFFF",
    scale: 1.5,
    anchor: isLoaded && window.google?.maps ? new window.google.maps.Point(12, 22) : undefined
  }), [isLoaded]);

  const onMapLoad = (map) => {
    mapRef.current = map;
    setMapLoaded(true);
    console.log('Map loaded successfully');
  };

  const getMarkerAnimation = () => {
    if (isLoaded && window.google?.maps) {
      return window.google.maps.Animation.DROP;
    }
    return null;
  };

  const handleMarkerClick = (station) => {
    setSelectedMarker(station);
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  // Handle refreshing the map with proper cleanup
  const handleRefresh = () => {
    setSelectedMarker(null);
    
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
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
          Nearby Charging Stations {stationsToDisplay?.length > 0 ? `(${stationsToDisplay.length})` : ''}
        </Typography>
        <Box>
          <Tooltip title="Use my location">
            <span> {/* Wrap in span to avoid Tooltip warning when button is disabled */}
              <IconButton 
                onClick={() => userLocation && onMapCenterChange(userLocation)} 
                size="small" 
                sx={{ mr: 1 }}
                disabled={!userLocation}
              >
                <MyLocation />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Refresh stations">
            <IconButton onClick={handleRefresh} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={mapContainerStyle}>
        {(!isLoaded || !mapLoaded) && (
          <Box sx={loadingOverlayStyle}>
            <CircularProgress />
          </Box>
        )}
        {mapError && (
          <Box sx={{ ...loadingOverlayStyle, backgroundColor: 'rgba(255, 0, 0, 0.1)' }}>
            <Typography color="error">{mapError}</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
              Reload
            </Button>
          </Box>
        )}
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={12}
            options={{
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: true,
              mapTypeId: 'roadmap',
              zoomControl: true,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ],
              gestureHandling: 'cooperative'
            }}
            onLoad={onMapLoad}
            onError={(error) => {
              console.error('Error loading Google Map:', error);
              setMapError('Failed to load map');
            }}
          >
            {mapLoaded && (
              <>
                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    position={userLocation}
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
                    console.error('Invalid station coordinates:', station);
                    return null;
                  }
                  
                  // Create a unique key for each marker to help React with rendering
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
                      animation={getMarkerAnimation()}
                      zIndex={1}
                    />
                  );
                })}

                {/* InfoWindow */}
                {selectedMarker && selectedMarker.location && (
                  <InfoWindow
                    position={{
                      lat: selectedMarker.location.coordinates[1],
                      lng: selectedMarker.location.coordinates[0]
                    }}
                    onCloseClick={handleInfoWindowClose}
                    options={{ maxWidth: 300 }}
                  >
                    <div>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {selectedMarker.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {selectedMarker.numberOfConnectors} connectors available
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {selectedMarker.ratePerHour} LKR/hour
                      </Typography>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => {
                          onStationSelect(selectedMarker);
                          setSelectedMarker(null);
                        }}
                        fullWidth
                      >
                        Book Now
                      </Button>
                    </div>
                  </InfoWindow>
                )}
              </>
            )}
          </GoogleMap>
        )}
      </Box>
    </Paper>
  );
};

export default MapSection;