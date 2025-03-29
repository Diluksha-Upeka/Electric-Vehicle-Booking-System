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

// Interface for time slot
interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  availableSpots: number;
}

// Add this after the TimeSlot interface
const PREDEFINED_TIME_SLOTS = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
  { start: '20:00', end: '21:00' },
  { start: '21:00', end: '22:00' },
];

export default function BookingScreen() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedStationName, setSelectedStationName] = useState("Select a station...");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlotId, setTimeSlotId] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("Select a time slot...");
  
  // Modal states
  const [showStationModal, setShowStationModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  
  // API configuration based on platform
  const API_BASE_URL = __DEV__
    ? Platform.select({
        android: 'http://192.168.170.216:5000',
        ios: 'http://192.168.170.216:5000',
        default: 'http://192.168.170.216:5000'
      })
    : 'http://192.168.170.216:5000';


  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');

      console.log("🔍 Retrieved Token in booking.tsx:", token);
      console.log("🔍 Retrieved User ID in booking.tsx:", userId);

      if (token && userId) {
        console.log('🟢 User authenticated with ID:', userId);
        setIsAuthenticated(true);
      } else {
        console.log('🔴 User not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('🔴 Error checking authentication:', error);
      setIsAuthenticated(false);
    }
  };

  // Check authentication status and fetch stations on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStations();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch time slots when station and date are selected
  useEffect(() => {
    if (selectedStation && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedStation, selectedDate]);



  const handleSignIn = () => {
    // Navigate to sign-in screen
    router.push("/authentication");
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
    } catch (error) {
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

  const fetchTimeSlots = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      // Format date as YYYY-MM-DD for API
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      console.log('Fetching time slots for:', {
        stationId: selectedStation,
        date: formattedDate
      });
      
      // Fetch time slots from the server
      const response = await axios.get(
        `${API_BASE_URL}/api/bookings/stations/${selectedStation}/time-slots?date=${formattedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Time slots response:', response.data);
      
      if (response.data) {
        setTimeSlots(response.data);
        // Reset time slot selection when fetching new slots
        setTimeSlotId("");
        setSelectedTimeSlot("Select a time slot...");
        setError("");
      } else {
        console.log('No time slots in response');
        setError('No time slots available');
        setTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      setError('Error loading available time slots');
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
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

  // Format time slot for display
  const formatTimeSlot = (timeSlot: TimeSlot) => {
    const start = new Date(timeSlot.startTime);
    const end = new Date(timeSlot.endTime);
    
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const endTime = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${startTime} - ${endTime}`;
  };

  // Handle date changes
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    // Don't allow dates in the past
    if (newDate >= new Date()) {
      setSelectedDate(newDate);
    }
  };

  // Select station
  const selectStation = (id: string, name: string) => {
    setSelectedStation(id);
    setSelectedStationName(name);
    setShowStationModal(false);
  };
  
  // Select time slot
  const selectTimeSlot = (id: string, timeSlot: TimeSlot) => {
    setTimeSlotId(id);
    setSelectedTimeSlot(formatTimeSlot(timeSlot));
    setShowTimeSlotModal(false);
  };

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedStation) {
      setError("Please select a station");
      return;
    }

    if (!timeSlotId) {
      setError("Please select a time slot");
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
      
      // Get the selected time slot details
      const selectedSlot = timeSlots.find(slot => slot._id === timeSlotId);
      if (!selectedSlot) {
        setError("Invalid time slot selected");
        setIsLoading(false);
        return;
      }

      // Format the booking data according to the server's expected format
      const bookingData = {
        stationId: selectedStation,  // Changed from station to stationId
        timeSlotId: timeSlotId,      // Changed from nested timeSlot object to timeSlotId
        userId: userId               // Changed from user to userId
      };
      
      console.log('Sending booking data:', bookingData); // Debug log
      
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
        setTimeSlotId("");
        setSelectedTimeSlot("Select a time slot...");
        
        // Navigate to bookings page after short delay
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorMessage = error.response.data?.message || error.response.data?.error || "Failed to create booking";
          console.error('Server error details:', error.response.data); // Added detailed error logging
          setError(errorMessage);
        } else if (error.request) {
          // The request was made but no response was received
          setError("No response from server. Please check your connection.");
        } else {
          // Something happened in setting up the request that triggered an Error
          setError("Error setting up the request");
        }
      } else {
        // Something else happened
        setError("An unexpected error occurred");
      }
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
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.dateArrow}
            onPress={() => changeDate(1)}
          >
            <Text style={styles.dateArrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Time Slot Selection */}
        <Text style={styles.label}>Select Time Slot *</Text>
        <TouchableOpacity 
          style={styles.pickerButton}
          onPress={() => {
            if (selectedStation) {
              setShowTimeSlotModal(true);
            } else {
              setError("Please select a station first");
            }
          }}
        >
          <Text style={styles.pickerButtonText}>{selectedTimeSlot}</Text>
        </TouchableOpacity>

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

      {/* Time Slot Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeSlotModal}
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time Slot</Text>
            <ScrollView style={styles.timeSlotList}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot._id}
                  style={[
                    styles.timeSlotItem,
                    timeSlotId === slot._id && styles.selectedTimeSlot
                  ]}
                  onPress={() => selectTimeSlot(slot._id, slot)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    timeSlotId === slot._id && styles.selectedTimeSlotText
                  ]}>
                    {formatTimeSlot(slot)}
                  </Text>
                  <Text style={styles.availableSpots}>
                    Available: {slot.availableSpots}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTimeSlotModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
  },
  timeSlotList: {
    maxHeight: 400,
    width: '100%',
  },
  timeSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedTimeSlot: {
    backgroundColor: '#5ced73',
  },
  timeSlotText: {
    color: '#ffffff',
    fontSize: 16,
  },
  selectedTimeSlotText: {
    color: '#000000',
  },
  availableSpots: {
    color: '#cccccc',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  }
});