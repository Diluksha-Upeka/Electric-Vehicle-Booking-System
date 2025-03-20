import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import bookingService from '../services/bookingService';

const BookingDialog = ({ open, onClose, station, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && station && station._id) {
      console.log('Station data:', station);
      console.log('Station ID:', station._id);
      fetchAvailableSlots();
    } else if (open && (!station || !station._id)) {
      console.log('Invalid station data:', station);
      setError('Invalid station data');
    }
  }, [open, station, selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!station || !station._id) {
        throw new Error('Invalid station data');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to book a station');
      }

      const formattedDate = selectedDate.toISOString();
      console.log('Fetching slots for station:', station._id, 'date:', formattedDate);
      const slots = await bookingService.getAvailableSlots(station._id, formattedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError(error.message || 'Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const booking = await bookingService.createBooking(station._id, selectedSlot._id);
      setSuccess(true);
      if (onBookingSuccess) {
        onBookingSuccess(booking);
      }
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not available';
    if (typeof location === 'string') return location;
    if (location.type === 'Point' && Array.isArray(location.coordinates)) {
      return `Latitude: ${location.coordinates[1]}, Longitude: ${location.coordinates[0]}`;
    }
    return 'Location not available';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Book Charging Station</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {station ? (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {station.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatLocation(station.location)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    maxDate={new Date(new Date().setDate(new Date().getDate() + 30))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Time Slots
                </Typography>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : availableSlots.length === 0 ? (
                  <Typography color="textSecondary">
                    No available slots for the selected date
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {availableSlots.map((slot) => (
                      <Grid item xs={12} sm={6} md={4} key={slot._id}>
                        <Button
                          variant={selectedSlot?._id === slot._id ? 'contained' : 'outlined'}
                          fullWidth
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {slot.startTime} - {slot.endTime}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Loading station...
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleBooking}
          variant="contained"
          color="primary"
          disabled={!selectedSlot || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
        </Button>
      </DialogActions>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Booking confirmed successfully!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BookingDialog;