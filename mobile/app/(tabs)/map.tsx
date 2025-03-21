import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

// API configuration based on platform - fixed the IP address
const API_BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://192.168.223.216:5000',      // Android emulator - fixed IP
      ios: 'http://localhost:5000',         // iOS simulator
      default: 'http://192.168.223.216:5000' // Physical device - fixed IP
    })
  : 'http://192.168.223.216:5000'; // Production URL - fixed IP


// Keeping the original Station interface from the first file
interface Station {
  _id: string;
  name: string;
  description?: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  connectors?: Array<{
    type: string;
    powerOutput: number;
    status: string;
  }>;
  operatingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  pricing?: {
    ratePerHour: number;
    ratePerKWh: number;
    minimumCharge: number;
  };
  amenities?: string[];
  status: string;
  averageRating?: number;
}

const chargingStationImage = require('../../assets/favicon.png');

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStations = async () => {
    try {
      console.log('Attempting to fetch stations from:', `${API_BASE_URL}/api/stations`);
      
      const response = await axios.get(`${API_BASE_URL}/api/stations`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Stations response:', response.data);
      setStations(response.data);
      setErrorMsg(null);
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      
      if (error?.response?.status === 404) {
        setErrorMsg('Station data not found');
      } else if (error?.message?.includes('Network Error')) {
        setErrorMsg('Unable to connect to server. Please check your connection.');
      } else {
        setErrorMsg('Error loading charging stations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        await fetchStations();
      } catch (error: any) {
        console.error('Error initializing:', error?.message);
        setErrorMsg('Error initializing map');
      }
    })();
  }, []);

  const initialRegion = {
    latitude: location?.coords.latitude || 52.4797,
    longitude: location?.coords.longitude || -1.90269,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const handleMarkerPress = (station: Station) => {
    setSelectedStation(station);
  };

  const CustomMarker = () => (
    <Image 
      source={chargingStationImage}
      style={{ width: 40, height: 40 }}
    />
  );

  // Function to render connector status icons - keeping from first file
  const renderConnectorStatus = (station: Station) => {
    if (!station.connectors || station.connectors.length === 0) {
      return <Text>No connector information</Text>;
    }

    return (
      <View style={styles.connectorContainer}>
        {station.connectors.map((connector, index) => (
          <View key={index} style={styles.connector}>
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: connector.status === 'available' ? 'green' : 
                                 connector.status === 'in_use' ? 'orange' : 
                                 connector.status === 'maintenance' ? 'red' : 'gray' }
              ]} 
            />
            <Text style={styles.connectorText}>
              {connector.type} ({connector.powerOutput} kW)
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStationDetails = () => {
    if (!selectedStation) return null;

    return (
      <View style={styles.stationInfoContainer}>
        <Text style={styles.stationName}>{selectedStation.name}</Text>
        
        {selectedStation.description && (
          <Text style={styles.stationDescription}>{selectedStation.description}</Text>
        )}
        
        {selectedStation.address && (
          <Text style={styles.stationAddress}>
            {`${selectedStation.address.street}, ${selectedStation.address.city}, ${selectedStation.address.state}`}
          </Text>
        )}
        
        {selectedStation.operatingHours && (
          <Text style={styles.operatingHours}>
            Hours: {selectedStation.operatingHours.start} - {selectedStation.operatingHours.end}
          </Text>
        )}
        
        {selectedStation.pricing && (
          <Text style={styles.pricing}>
            Rate: ${selectedStation.pricing.ratePerHour}/hr | ${selectedStation.pricing.ratePerKWh}/kWh
          </Text>
        )}
        
        {renderConnectorStatus(selectedStation)}
        
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => console.log('Book station:', selectedStation._id)}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading map and stations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Current location marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          />
        )}

        {/* Charging station markers with custom image */}
        {stations && stations.length > 0 && stations.map((station) => (
          <Marker
            key={station._id}
            coordinate={{
              // GeoJSON format has [longitude, latitude] so we need to swap them
              latitude: station.location.coordinates[1],
              longitude: station.location.coordinates[0],
            }}
            title={station.name}
            description={station.description || ''}
            onPress={() => handleMarkerPress(station)}
          >
            <CustomMarker />
          </Marker>
        ))}
      </MapView>

      {/* Error message display */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Selected station info */}
      {renderStationDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  errorContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  stationInfoContainer: {
    position: 'absolute',
    bottom: 170,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  stationAddress: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
  },
  operatingHours: {
    fontSize: 14,
    color: '#444',
    marginBottom: 5,
  },
  pricing: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  connectorContainer: {
    marginVertical: 8,
  },
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connectorText: {
    fontSize: 14,
    color: '#444',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});