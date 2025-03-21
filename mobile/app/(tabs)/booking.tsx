import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";

// Interface for station data based on Station.js schema
interface Station {
  _id: string;
  name: string;
  location: {
    type: string;
    coordinates: number[];
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  connectors: Array<{
    type: string;
    powerOutput: number;
    status: string;
  }>;
  operatingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  pricing: {
    ratePerHour: number;
    ratePerKWh: number;
    minimumCharge: number;
  };
  amenities: string[];
  status: string;
  averageRating: number;
}

// Interface for user vehicle details based on User.js schema
interface UserVehicle {
  make: string;
  model: string;
  year: number;
  batteryCapacity: number;
  maxChargingRate: number;
}

// Duration options
const durationOptions = [
  { label: "30 minutes", value: "30" },
  { label: "60 minutes", value: "60" },
  { label: "90 minutes", value: "90" },
  { label: "120 minutes", value: "120" }
];

// Connector type options based on Station.js schema
const connectorTypes = [
  { label: "Type 1", value: "Type 1" },
  { label: "Type 2", value: "Type 2" },
  { label: "CCS", value: "CCS" },
  { label: "CHAdeMO", value: "CHAdeMO" }
];

export default function BookingScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [userVehicle, setUserVehicle] = useState<UserVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedStationName, setSelectedStationName] = useState("Select a station...");
  const [selectedConnector, setSelectedConnector] = useState("");
  const [selectedConnectorType, setSelectedConnectorType] = useState("Select connector type...");
  const [date, setDate] = useState(new Date());
  const [timeHour, setTimeHour] = useState("12");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timeAMPM, setTimeAMPM] = useState("PM");
  const [duration, setDuration] = useState("30");
  const [durationLabel, setDurationLabel] = useState("30 minutes");
  const [batteryPercentage, setBatteryPercentage] = useState("");
  
  // Modal states
  const [showStationModal, setShowStationModal] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // API configuration based on platform
  const API_BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://192.168.223.216:5000',      // Android emulator - fixed IP
      ios: 'http://localhost:5000',         // iOS simulator
      default: 'http://192.168.223.216:5000' // Physical device - fixed IP
    })
  : 'http://192.168.223.216:5000'; // Production URL - fixed IP

  // Check authentication status and fetch stations on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStations();
      fetchUserVehicle();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      // Check for auth token in AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userId) {
        console.log('User authenticated with ID:', userId);
        setIsAuthenticated(true);
      } else {
        console.log('User not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    }
  };

  const handleSignIn = () => {
    // Navigate to sign-in screen
    router.push("/login");
  };

  const fetchStations = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(`${API_BASE_URL}/api/stations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      setStations(response.data);
      setError("");
    } catch (error: any) {
      console.error('Error fetching stations:', error);
      
      if (error?.response?.status === 404) {
        setError('No charging stations found');
      } else if (error?.message?.includes('Network Error')) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Error loading charging stations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVehicle = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/vehicle`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.data && response.data.vehicleDetails) {
        setUserVehicle(response.data.vehicleDetails);
      }
    } catch (error) {
      console.error('Error fetching user vehicle:', error);
      // We don't show an error to the user here since this is supplementary information
    }
  };

  // Format the date as a string
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time from hours, minutes, and AM/PM
  const formatTime = () => {
    return `${timeHour}:${timeMinute} ${timeAMPM}`;
  };

  // Handle date changes
  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    
    // Don't allow dates in the past
    if (newDate >= new Date()) {
      setDate(newDate);
    }
  };

  // Calculate estimated charging time based on battery percentage and vehicle details
  const calculateEstimatedChargingTime = (): number => {
    if (!userVehicle || !batteryPercentage) return parseInt(duration);
    
    const currentBatteryPercentage = parseInt(batteryPercentage);
    if (isNaN(currentBatteryPercentage)) return parseInt(duration);
    
    // Simple calculation - assumes we want to reach 80% from current percentage
    const targetPercentage = 80;
    const percentageToCharge = targetPercentage - currentBatteryPercentage;
    if (percentageToCharge <= 0) return parseInt(duration);
    
    // Calculate how many kWh we need to charge
    const kWhToCharge = (percentageToCharge / 100) * userVehicle.batteryCapacity;
    
    // Calculate time based on max charging rate
    const hoursToCharge = kWhToCharge / userVehicle.maxChargingRate;
    const minutesToCharge = Math.ceil(hoursToCharge * 60);
    
    return Math.max(minutesToCharge, parseInt(duration));
  };

  // Calculate estimated cost based on station pricing and duration
  const calculateEstimatedCost = (): number => {
    if (!selectedStation) return 0;
    
    const station = stations.find(s => s._id === selectedStation);
    if (!station || !station.pricing || !station.pricing.ratePerHour) return 0;
    
    const durationInHours = parseInt(duration) / 60;
    const cost = station.pricing.ratePerHour * durationInHours;
    
    // Add minimum charge if applicable
    if (station.pricing.minimumCharge && cost < station.pricing.minimumCharge) {
      return station.pricing.minimumCharge;
    }
    
    return parseFloat(cost.toFixed(2));
  };

  // Select station
  const selectStation = (id: string, name: string) => {
    setSelectedStation(id);
    setSelectedStationName(name);
    // Reset connector when changing stations
    setSelectedConnector("");
    setSelectedConnectorType("Select connector type...");
    setShowStationModal(false);
  };
  
  // Select connector
  const selectConnector = (type: string) => {
    setSelectedConnector(type);
    setSelectedConnectorType(type);
    setShowConnectorModal(false);
  };
  
  // Select duration
  const selectDuration = (value: string, label: string) => {
    setDuration(value);
    setDurationLabel(label);
    setShowDurationModal(false);
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedStation || !selectedConnector || !batteryPercentage) {
      setError("Please fill in all required fields");
      return;
    }

    const batteryLevel = parseInt(batteryPercentage);
    if (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) {
      setError("Battery percentage must be between 0 and 100");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        setError("Authentication error. Please log in again.");
        setIsLoading(false);
        return;
      }
      
      // Calculate start and end times
      const startDateTime = new Date(date);
      startDateTime.setHours(
        timeAMPM === "PM" && parseInt(timeHour) !== 12 
          ? parseInt(timeHour) + 12 
          : (timeAMPM === "AM" && timeHour === "12" ? 0 : parseInt(timeHour)),
        parseInt(timeMinute),
        0,
        0
      );
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));
      
      // Calculate estimated charging time and cost
      const estimatedChargingTime = calculateEstimatedChargingTime();
      const estimatedCost = calculateEstimatedCost();
      
      const bookingData = {
        user: userId,
        station: selectedStation,
        connector: selectedConnector,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: "pending",
        batteryDetails: {
          initialPercentage: parseInt(batteryPercentage),
          estimatedChargingTime: estimatedChargingTime
        },
        pricing: {
          estimatedCost: estimatedCost
        }
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/bookings`, 
        bookingData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 201) {
        setSuccess("Booking confirmed! Check your dashboard for details.");
        
        // Reset form
        setSelectedStation("");
        setSelectedStationName("Select a station...");
        setSelectedConnector("");
        setSelectedConnectorType("Select connector type...");
        setDate(new Date());
        setTimeHour("12");
        setTimeMinute("00");
        setTimeAMPM("PM");
        setDuration("30");
        setDurationLabel("30 minutes");
        setBatteryPercentage("");
        
        // Navigate to bookings page after short delay
        setTimeout(() => {
          router.push("/bookings");
        }, 2000);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      setError(error?.response?.data?.message || "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  // Render authentication message if not authenticated
  const renderAuthMessage = () => {
    return (
      <View style={styles.authContainer}>
        <Image source={require("../../assets/logo.png")} style={styles.logoImage} />
        <Text style={styles.authTitle}>Book a Charging Session</Text>
        <View style={styles.authMessageContainer}>
          <Text style={styles.authMessage}>
            Please sign in to continue and book your charging session.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          <Text style={styles.registerText}>
            Don't have an account?{" "}
            <Text 
              style={styles.registerLink}
              onPress={() => router.push("/register")}
            >
              Register
            </Text>
          </Text>
        </View>
      </View>
    );
  };

  // Show loading indicator while checking auth status
  if (isLoading && !error) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3bc449" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Return auth message if not authenticated
  if (!isAuthenticated) {
    return renderAuthMessage();
  }

  // Find selected station details
  const selectedStationDetails = stations.find(s => s._id === selectedStation);

  // Return booking form if authenticated
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../../assets/logo.png")} style={styles.logoImage} />
        <Text style={styles.headerTitle}>Book a Charging Session</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Station Selection */}
        <Text style={styles.label}>Select Charging Station *</Text>
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={() => setShowStationModal(true)}
        >
          <Text style={styles.pickerButtonText}>{selectedStationName}</Text>
        </TouchableOpacity>

        {/* Connector Type Selection */}
        <Text style={styles.label}>Select Connector Type *</Text>
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={() => {
            if (!selectedStation) {
              setError("Please select a station first");
              return;
            }
            setShowConnectorModal(true);
          }}
        >
          <Text style={styles.pickerButtonText}>{selectedConnectorType}</Text>
        </TouchableOpacity>

        {/* Date Selection */}
        <Text style={styles.label}>Select Date *</Text>
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => changeDate(-1)}
          >
            <Text style={styles.dateArrowText}>◀</Text>
          </TouchableOpacity>
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => changeDate(1)}
          >
            <Text style={styles.dateArrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Time Selection */}
        <Text style={styles.label}>Select Time *</Text>
        <View style={styles.timeSelector}>
          <View style={styles.timeInputGroup}>
            <TextInput
              style={styles.timeInput}
              value={timeHour}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (timeAMPM === "AM" || timeAMPM === "PM") {
                  if (!isNaN(num) && num >= 1 && num <= 12) {
                    setTimeHour(text);
                  } else if (text === "") {
                    setTimeHour("");
                  }
                } else {
                  if (!isNaN(num) && num >= 0 && num <= 23) {
                    setTimeHour(text);
                  } else if (text === "") {
                    setTimeHour("");
                  }
                }
              }}
              keyboardType="numeric"
              maxLength={2}
              placeholder="HH"
            />
            <Text style={styles.timeColon}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={timeMinute}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (!isNaN(num) && num >= 0 && num <= 59 || text === "") {
                  setTimeMinute(text.padStart(2, '0'));
                }
              }}
              keyboardType="numeric"
              maxLength={2}
              placeholder="MM"
            />
            <TouchableOpacity 
              style={styles.ampmButton}
              onPress={() => setTimeAMPM(timeAMPM === "AM" ? "PM" : "AM")}
            >
              <Text style={styles.ampmButtonText}>{timeAMPM}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration Selection */}
        <Text style={styles.label}>Charging Duration (minutes) *</Text>
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={() => setShowDurationModal(true)}
        >
          <Text style={styles.pickerButtonText}>{durationLabel}</Text>
        </TouchableOpacity>

        {/* Battery Percentage Input */}
        <Text style={styles.label}>Current Battery Percentage (%) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 25"
          value={batteryPercentage}
          onChangeText={(text) => {
            const num = parseInt(text);
            if (!isNaN(num) && num >= 0 && num <= 100 || text === "") {
              setBatteryPercentage(text);
            }
          }}
          keyboardType="numeric"
          maxLength={3}
          placeholderTextColor="#9ca3af"
        />

        {/* Vehicle Details */}
        {userVehicle && (
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleInfoTitle}>Vehicle Information</Text>
            <Text style={styles.vehicleInfoText}>
              {userVehicle.make} {userVehicle.model} ({userVehicle.year})
            </Text>
            <Text style={styles.vehicleInfoText}>
              Battery Capacity: {userVehicle.batteryCapacity} kWh
            </Text>
            <Text style={styles.vehicleInfoText}>
              Max Charging Rate: {userVehicle.maxChargingRate} kW
            </Text>
          </View>
        )}

        {/* Station Details */}
        {selectedStationDetails && (
          <View style={styles.stationInfo}>
            <Text style={styles.stationInfoTitle}>Station Information</Text>
            {selectedStationDetails.address && (
              <Text style={styles.stationInfoText}>
                {selectedStationDetails.address.street}, {selectedStationDetails.address.city}
              </Text>
            )}
            {selectedStationDetails.operatingHours && (
              <Text style={styles.stationInfoText}>
                Operating Hours: {selectedStationDetails.operatingHours.start} - {selectedStationDetails.operatingHours.end}
              </Text>
            )}
            {selectedStationDetails.pricing && (
              <Text style={styles.stationInfoText}>
                Price: ${selectedStationDetails.pricing.ratePerHour}/hour
              </Text>
            )}
            {batteryPercentage && selectedStationDetails.pricing && (
              <Text style={styles.estimatedCost}>
                Estimated Cost: ${calculateEstimatedCost()}
              </Text>
            )}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleBooking}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Book Now</Text>
          )}
        </TouchableOpacity>

        {/* Error and Success Messages */}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
      </View>

      {/* Additional Information */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Booking Information</Text>
        <Text style={styles.infoText}>
          • Bookings can be made up to 30 days in advance
        </Text>
        <Text style={styles.infoText}>
          • Cancellations are free up to 2 hours before your booking
        </Text>
        <Text style={styles.infoText}>
          • Arrive 10 minutes before your scheduled time
        </Text>
        <Text style={styles.infoText}>
          • Payment will be processed when you start charging
        </Text>
      </View>

      {/* Station Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStationModal}
        onRequestClose={() => setShowStationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Charging Station</Text>
            <ScrollView style={styles.modalScrollView}>
              {stations.map((station) => (
                <TouchableOpacity
                  key={station._id}
                  style={styles.modalItem}
                  onPress={() => selectStation(station._id, station.name)}
                >
                  <Text style={styles.modalItemText}>{station.name}</Text>
                  {station.address && (
                    <Text style={styles.modalItemSubtext}>
                      {station.address.city}, {station.address.state}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Connector Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConnectorModal}
        onRequestClose={() => setShowConnectorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Connector Type</Text>
            <ScrollView style={styles.modalScrollView}>
              {selectedStationDetails?.connectors?.filter(c => c.status === 'available').map((connector, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => selectConnector(connector.type)}
                >
                  <Text style={styles.modalItemText}>{connector.type}</Text>
                  <Text style={styles.modalItemSubtext}>
                    Power Output: {connector.powerOutput} kW
                  </Text>
                </TouchableOpacity>
              ))}
              {(!selectedStationDetails?.connectors || selectedStationDetails.connectors.filter(c => c.status === 'available').length === 0) && (
                <Text style={styles.modalNoItems}>No available connectors at this station</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowConnectorModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Duration Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDurationModal}
        onRequestClose={() => setShowDurationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Duration</Text>
            <ScrollView style={styles.modalScrollView}>
              {durationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalItem}
                  onPress={() => selectDuration(option.value, option.label)}
                >
                  <Text style={styles.modalItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDurationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#1e3a8a",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  logoImage: {
    width: 100,
    height: 60,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#3bc449",
  },
  // Auth message styles
  authContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingVertical: 40,
    paddingHorizontal: 25,
    alignItems: "center",
  },
  authTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginTop: 15,
    marginBottom: 30,
  },
  authMessageContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3bc449",
  },
  authMessage: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
  },
  signInButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#3bc449",
    alignItems: "center",
    marginBottom: 20,
  },
  signInButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerText: {
    fontSize: 14,
    color: "#4b5563",
  },
  registerLink: {
    color: "#3bc449",
    fontWeight: "500",
  },
  // Form styles
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#111827",
    marginBottom: 15,
  },
  pickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginBottom: 15,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  dateArrow: {
    padding: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  dateArrowText: {
    fontSize: 16,
    color: "#1f2937",
  },
  dateDisplay: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginHorizontal: 10,
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#111827",
  },
  timeSelector: {
    marginBottom: 15,
  },
  timeInputGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#111827",
    width: 60,
    textAlign: "center",
  },
  timeColon: {
    fontSize: 20,
    marginHorizontal: 5,
    color: "#1f2937",
  },
  ampmButton: {
    marginLeft: 10,
    padding: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    width: 60,
    alignItems: "center",
  },
  ampmButtonText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#3bc449",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginTop: 10,
    textAlign: "center",
  },
  success: {
    color: "#10b981",
    marginTop: 10,
    textAlign: "center",
  },
  infoSection: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a8a",
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
    lineHeight: 20,
  },
  vehicleInfo: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  vehicleInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  vehicleInfoText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 5,
  },
  stationInfo: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 15,
  },
  stationInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  stationInfoText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 5,
  },
  estimatedCost: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3bc449",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a8a",
    marginBottom: 15,
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111827",
  },
  modalItemSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  modalNoItems: {
    padding: 15,
    textAlign: "center",
    color: "#6b7280",
    fontStyle: "italic",
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  }
});