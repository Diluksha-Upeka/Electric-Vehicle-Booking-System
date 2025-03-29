import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Platform, 
  Image, 
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { useRouter } from 'expo-router';

// API configuration based on platform - fixed the IP address
  const API_BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://192.168.170.216:5000',      // Android emulator - fixed IP
      ios: 'http://localhost:5000',         // iOS simulator
      default: 'http://192.168.170.216:5000' // Physical device - fixed IP
    })
  : 'http://192.168.170.216:5000'; // Production URL - fixed IP

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

// Interface for new station form
interface NewStationForm {
  name: string;
  description: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  connectorType: string;
  powerOutput: string;
  startHour: string;
  endHour: string;
  ratePerHour: string;
  ratePerKWh: string;
}

// Define navigation params for better type safety
type RootStackParamList = {
  Booking: {
    stationId: string;
    stationName: string;
    stationAddress?: any;
    stationPricing?: any;
    stationConnectors?: any;
  };
};

const chargingStationImage = require('../../assets/favicon.png');

export default function MapScreen() {
  // Use the navigation hook directly
  const router = useRouter();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New states for adding a station
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newStationLocation, setNewStationLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [addingMarker, setAddingMarker] = useState(false);
  const [formData, setFormData] = useState<NewStationForm>({
    name: '',
    description: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    connectorType: 'Type 2',
    powerOutput: '50',
    startHour: '00:00',
    endHour: '23:59',
    ratePerHour: '2.50',
    ratePerKWh: '0.30'
  });
  
  const mapRef = useRef<MapView>(null);

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
  
  const enterAddMarkerMode = () => {
    setAddingMarker(true);
    setSelectedStation(null);
    Alert.alert(
      "Add New Station",
      "Tap on the map to place your new charging station",
      [{ text: "OK" }]
    );
  };
  
  const handleMapPress = (event: any) => {
    if (addingMarker) {
      const { coordinate } = event.nativeEvent;
      setNewStationLocation(coordinate);
      setAddModalVisible(true);
      setAddingMarker(false);
    }
  };
  
  const handleAddStation = async () => {
    if (!newStationLocation) {
      Alert.alert("Error", "Location not selected");
      return;
    }
    
    try {
      // Convert form data to the expected API format
      const newStation = {
        name: formData.name,
        description: formData.description,
        location: {
          type: "Point",
          coordinates: [newStationLocation.longitude, newStationLocation.latitude] // GeoJSON format: [longitude, latitude]
        },
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        connectors: [
          {
            type: formData.connectorType,
            powerOutput: parseFloat(formData.powerOutput),
            status: "available"
          }
        ],
        operatingHours: {
          start: formData.startHour,
          end: formData.endHour,
          timezone: "UTC"
        },
        pricing: {
          ratePerHour: parseFloat(formData.ratePerHour),
          ratePerKWh: parseFloat(formData.ratePerKWh),
          minimumCharge: 1.00
        },
        status: "operational"
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/stations`, newStation, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Station added:', response.data);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        connectorType: 'Type 2',
        powerOutput: '50',
        startHour: '00:00',
        endHour: '23:59',
        ratePerHour: '2.50',
        ratePerKWh: '0.30'
      });
      setAddModalVisible(false);
      setNewStationLocation(null);
      
      // Reload stations to show the new one
      await fetchStations();
      
      Alert.alert("Success", "New charging station added successfully!");
    } catch (error: any) {
      console.error('Error adding station:', error);
      Alert.alert(
        "Error",
        "Failed to add new station. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Handle booking button press - Navigate to booking screen with improved error handling
  const handleBookPress = (station: Station) => {
    try {
      // Navigate to booking screen with station data
      // @ts-ignore - Ignore type error for navigation
      router.push({
        pathname: '/booking',
        params: { 
          stationId: station._id,
          stationName: station.name,
          stationAddress: JSON.stringify(station.address),
          stationPricing: JSON.stringify(station.pricing),
          stationConnectors: JSON.stringify(station.connectors)
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        "Navigation Error",
        "Failed to navigate to the booking screen. Please try again."
      );
    }
  };

  const CustomMarker = () => (
    <Image 
      source={chargingStationImage}
      style={{ width: 40, height: 40 }}
    />
  );

  // Function to render connector status icons
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
          onPress={() => handleBookPress(selectedStation)}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderAddStationModal = () => {
    return (
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add New Charging Station</Text>
              
              {/* Basic Information */}
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.inputLabel}>Station Name*</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter station name"
              />
              
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Describe this charging station"
                multiline={true}
                numberOfLines={3}
              />
              
              {/* Address Information */}
              <Text style={styles.sectionTitle}>Address</Text>
              
              <Text style={styles.inputLabel}>Street*</Text>
              <TextInput
                style={styles.input}
                value={formData.street}
                onChangeText={(text) => setFormData({...formData, street: text})}
                placeholder="Street address"
              />
              
              <Text style={styles.inputLabel}>City*</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({...formData, city: text})}
                placeholder="City"
              />
              
              <Text style={styles.inputLabel}>State/Province*</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({...formData, state: text})}
                placeholder="State or province"
              />
              
              <Text style={styles.inputLabel}>Postal Code*</Text>
              <TextInput
                style={styles.input}
                value={formData.zipCode}
                onChangeText={(text) => setFormData({...formData, zipCode: text})}
                placeholder="Postal or zip code"
              />
              
              <Text style={styles.inputLabel}>Country*</Text>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(text) => setFormData({...formData, country: text})}
                placeholder="Country"
              />
              
              {/* Connector Information */}
              <Text style={styles.sectionTitle}>Connector Details</Text>
              
              <Text style={styles.inputLabel}>Connector Type*</Text>
              <TextInput
                style={styles.input}
                value={formData.connectorType}
                onChangeText={(text) => setFormData({...formData, connectorType: text})}
                placeholder="e.g., Type 2, CCS, CHAdeMO"
              />
              
              <Text style={styles.inputLabel}>Power Output (kW)*</Text>
              <TextInput
                style={styles.input}
                value={formData.powerOutput}
                onChangeText={(text) => setFormData({...formData, powerOutput: text})}
                placeholder="e.g., 50"
                keyboardType="numeric"
              />
              
              {/* Operating Hours */}
              <Text style={styles.sectionTitle}>Operating Hours</Text>
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Start Time*</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.startHour}
                    onChangeText={(text) => setFormData({...formData, startHour: text})}
                    placeholder="00:00"
                  />
                </View>
                
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>End Time*</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.endHour}
                    onChangeText={(text) => setFormData({...formData, endHour: text})}
                    placeholder="23:59"
                  />
                </View>
              </View>
              
              {/* Pricing */}
              <Text style={styles.sectionTitle}>Pricing</Text>
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Rate per Hour ($)*</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.ratePerHour}
                    onChangeText={(text) => setFormData({...formData, ratePerHour: text})}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Rate per kWh ($)*</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.ratePerKWh}
                    onChangeText={(text) => setFormData({...formData, ratePerKWh: text})}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              {/* Selected Location */}
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.locationText}>
                Latitude: {newStationLocation?.latitude.toFixed(6)}{"\n"}
                Longitude: {newStationLocation?.longitude.toFixed(6)}
              </Text>
              
              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setAddModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddStation}
                >
                  <Text style={styles.buttonText}>Save Station</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onPress={handleMapPress}
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
        
        {/* New station temporary marker */}
        {newStationLocation && (
          <Marker
            coordinate={newStationLocation}
            title="New Station"
            description="Your new charging station"
            pinColor="green"
          />
        )}
      </MapView>

      {/* Error message display */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Selected station info */}
      {renderStationDetails()}
      
      {/* Add station modal */}
      {renderAddStationModal()}
      
      {/* Add station floating button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={enterAddMarkerMode}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
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
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  locationText: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});