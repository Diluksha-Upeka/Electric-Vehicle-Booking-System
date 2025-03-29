import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert as RNAlert,
  ActivityIndicator,
  Platform // Added Platform import here
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Define connector types
const connectorTypes = ['Type 1', 'Type 2', 'CCS', 'CHAdeMO', 'Tesla'];

// Define interfaces for TypeScript
interface TimeSlot {
  start: string;
  end: string;
}

interface ChargingPreferences {
  preferredConnectorType: string;
  preferredPowerOutput: string;
  preferredTimeSlot: TimeSlot;
}

interface VehicleDetails {
  make: string;
  model: string;
  year: string;
  batteryCapacity: string;
  maxChargingPower: string;
}

interface ProfileFormData {
  name: string;
  email: string;
  vehicleDetails: VehicleDetails;
  chargingPreferences: ChargingPreferences;
}

interface Booking {
  _id: string;
  station: {
    _id: string;
    name: string;
    address?: string;
  };
  timeSlot: {
    _id: string;
    startTime: string;
    endTime: string;
  };
  status: 'Confirmed' | 'Cancelled' | 'Checked-in' | 'Completed' | 'No Show';
  createdAt: string;
}

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    vehicleDetails: {
      make: user?.vehicleDetails?.make || '',
      model: user?.vehicleDetails?.model || '',
      year: user?.vehicleDetails?.year || '',
      batteryCapacity: user?.vehicleDetails?.batteryCapacity || '',
      maxChargingPower: user?.vehicleDetails?.maxChargingPower || '',
    },
    chargingPreferences: {
      preferredConnectorType: user?.chargingPreferences?.preferredConnectorType || '',
      preferredPowerOutput: user?.chargingPreferences?.preferredPowerOutput || '',
      preferredTimeSlot: {
        start: user?.chargingPreferences?.preferredTimeSlot?.start || '',
        end: user?.chargingPreferences?.preferredTimeSlot?.end || '',
      },
    },
  });

  // Fetch user's bookings when component mounts
  useEffect(() => {
    fetchUserBookings();
  }, []);

 // Import your configured axios instance

 const getApiBaseUrl = () => {
  return __DEV__
    ? Platform.select({
        android: "http://192.168.170.216:5000",
        ios: "http://localhost:5000",
        default: "http://192.168.170.216:5000",
      })
    : "http://192.168.170.216:5000";
};

const fetchUserBookings = async () => {
  setBookingsLoading(true);
  setBookingsError('');

  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      setBookingsError('No authentication token found');
      return;
    }

    const apiUrl = `${getApiBaseUrl()}/api/bookings/my-bookings`;

    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Filter out cancelled bookings and only show confirmed ones
    const confirmedBookings = response.data.filter((booking: Booking) => booking.status === 'Confirmed');
    setBookings(confirmedBookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);

    if (axios.isAxiosError(error) && error.response) {
      setBookingsError(`Error ${error.response.status}: ${error.response.data.message || 'Failed to fetch bookings'}`);
    } else {
      setBookingsError('An unexpected error occurred');
    }
  } finally {
    setBookingsLoading(false);
  }
};


  const handleChange = (section: string, field: string, value: string) => {
    if (section === 'user') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (section === 'timeSlot') {
      setFormData((prev) => ({
        ...prev,
        chargingPreferences: {
          ...prev.chargingPreferences,
          preferredTimeSlot: {
            ...prev.chargingPreferences.preferredTimeSlot,
            [field]: value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section as keyof Omit<ProfileFormData, 'name' | 'email'>],
          [field]: value,
        },
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
      RNAlert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      setError(error.message || 'Something went wrong');
      RNAlert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const validateTimeInput = (value: string): boolean => {
    // Simple regex to validate time format HH:MM
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(value);
  };

  const handleTimeChange = (timeType: string, value: string) => {
    // Only update if valid time or empty string
    if (value === '' || validateTimeInput(value)) {
      handleChange('timeSlot', timeType, value);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      console.log('Received date string:', dateTimeString); // Debug log

      // If the string is empty or null, return early
      if (!dateTimeString) {
        return 'No date provided';
      }

      // Try to parse the date string
      let date: Date;
      
      // Check if the string is in ISO format (contains 'T')
      if (dateTimeString.includes('T')) {
        date = new Date(dateTimeString);
      } else {
        // Try to parse as regular date
        date = new Date(dateTimeString);
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateTimeString); // Debug log
        return 'Invalid Date';
      }

      // Format the date
      const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC' // Add UTC timezone to prevent local conversion
      });

      console.log('Formatted date:', formattedDate); // Debug log
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateTimeString);
      return 'Invalid Date';
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        RNAlert.alert('Error', 'Authentication required. Please log in again.');
        return;
      }

      const apiUrl = `${getApiBaseUrl()}/api/bookings/${bookingId}/cancel`;
      
      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Refresh bookings after successful cancellation
        await fetchUserBookings();
        RNAlert.alert('Success', 'Booking cancelled successfully!');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          RNAlert.alert('Error', error.response.data.message || 'Failed to cancel booking');
        } else if (error.request) {
          // The request was made but no response was received
          RNAlert.alert('Error', 'No response from server. Please check your connection.');
        } else {
          // Something happened in setting up the request that triggered an Error
          RNAlert.alert('Error', 'Error setting up the request');
        }
      } else {
        RNAlert.alert('Error', 'An unexpected error occurred');
      }
    }
  };

  // Determine booking status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return '#4CAF50'; // Green
      case 'Cancelled': return '#F44336'; // Red
      case 'Checked-in': return '#2196F3'; // Blue
      case 'Completed': return '#9C27B0'; // Purple
      case 'No Show': return '#FF9800'; // Orange
      default: return '#757575'; // Grey
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Settings</Text>
        <Text style={styles.subtitle}>Manage your profile and preferences</Text>
      </View>

      {success && (
        <View style={styles.successAlert}>
          <Text style={styles.alertText}>Profile updated successfully!</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorAlert}>
          <Text style={styles.alertText}>{error}</Text>
        </View>
      )}

      {/* Booking Records Section - MOVED TO TOP */}
      <View style={styles.bookingsHeader}>
        <Text style={styles.sectionTitle}>Your Booking Records</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={fetchUserBookings}
          disabled={bookingsLoading}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {bookingsLoading ? (
        <ActivityIndicator size="large" color="#1976d2" style={styles.loader} />
      ) : bookingsError ? (
        <View style={styles.errorAlert}>
          <Text style={styles.alertText}>{bookingsError}</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>You don't have any bookings yet.</Text>
        </View>
      ) : (
        bookings.map((booking) => (
          <View key={booking._id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingStationName}>{booking.station.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            
            {booking.station.address && (
              <Text style={styles.bookingAddress}>{booking.station.address}</Text>
            )}
            
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingLabel}>Start Time:</Text>
              <Text style={styles.bookingValue}>{formatDateTime(booking.timeSlot.startTime)}</Text>
            </View>
            
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingLabel}>End Time:</Text>
              <Text style={styles.bookingValue}>{formatDateTime(booking.timeSlot.endTime)}</Text>
            </View>
            
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingLabel}>Booked On:</Text>
              <Text style={styles.bookingValue}>{formatDateTime(booking.createdAt)}</Text>
            </View>
            
            {booking.status === 'Confirmed' && (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => handleCancelBooking(booking._id)}
              >
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={styles.divider} />

      {/* User Information */}
      <Text style={styles.sectionTitle}>User Information</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(value) => handleChange('user', 'name', value)}
          placeholder="Your name"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleChange('user', 'email', value)}
          placeholder="Your email"
          keyboardType="email-address"
          editable={false} // Email shouldn't be editable for security
        />
      </View>

      <View style={styles.divider} />

      {/* Vehicle Details Section */}
      <Text style={styles.sectionTitle}>Vehicle Details</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Make</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleDetails.make}
          onChangeText={(value) => handleChange('vehicleDetails', 'make', value)}
          placeholder="e.g., Tesla"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleDetails.model}
          onChangeText={(value) => handleChange('vehicleDetails', 'model', value)}
          placeholder="e.g., Model 3"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Year</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleDetails.year}
          onChangeText={(value) => handleChange('vehicleDetails', 'year', value)}
          keyboardType="numeric"
          placeholder="e.g., 2022"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Battery Capacity (kWh)</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleDetails.batteryCapacity}
          onChangeText={(value) => handleChange('vehicleDetails', 'batteryCapacity', value)}
          keyboardType="numeric"
          placeholder="e.g., 75"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Max Charging Power (kW)</Text>
        <TextInput
          style={styles.input}
          value={formData.vehicleDetails.maxChargingPower}
          onChangeText={(value) => handleChange('vehicleDetails', 'maxChargingPower', value)}
          keyboardType="numeric"
          placeholder="e.g., 11"
        />
      </View>

      <View style={styles.divider} />

      {/* Charging Preferences Section */}
      <Text style={styles.sectionTitle}>Charging Preferences</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Connector Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.chargingPreferences.preferredConnectorType}
            style={styles.picker}
            onValueChange={(value) => handleChange('chargingPreferences', 'preferredConnectorType', value)}
          >
            <Picker.Item label="Select connector type" value="" />
            {connectorTypes.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Power Output (kW)</Text>
        <TextInput
          style={styles.input}
          value={formData.chargingPreferences.preferredPowerOutput}
          onChangeText={(value) => handleChange('chargingPreferences', 'preferredPowerOutput', value)}
          keyboardType="numeric"
          placeholder="e.g., 7.4"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred Start Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          value={formData.chargingPreferences.preferredTimeSlot.start}
          onChangeText={(value) => handleTimeChange('start', value)}
          placeholder="e.g., 18:30"
          maxLength={5}
        />
        {formData.chargingPreferences.preferredTimeSlot.start && 
         !validateTimeInput(formData.chargingPreferences.preferredTimeSlot.start) && (
          <Text style={styles.errorText}>Please use 24-hour format (HH:MM)</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Preferred End Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          value={formData.chargingPreferences.preferredTimeSlot.end}
          onChangeText={(value) => handleTimeChange('end', value)}
          placeholder="e.g., 07:30"
          maxLength={5}
        />
        {formData.chargingPreferences.preferredTimeSlot.end && 
         !validateTimeInput(formData.chargingPreferences.preferredTimeSlot.end) && (
          <Text style={styles.errorText}>Please use 24-hour format (HH:MM)</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  successAlert: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#d4edda',
    borderRadius: 4,
  },
  errorAlert: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f8d7da',
    borderRadius: 4,
  },
  alertText: {
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 24,
  },
  button: {
    backgroundColor: '#1976d2',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#b0bec5',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 20,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingStationName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookingAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bookingDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bookingLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 100,
  },
  bookingValue: {
    fontSize: 14,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Profile;