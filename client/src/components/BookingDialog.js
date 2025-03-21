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
  TextField,
  Card,
  CardContent
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
    if (open) {
      setSelectedSlot(null);
      setAvailableSlots([]);
      setError(null);
    }
  }, [open]);

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
      
      if (!selectedSlot || !station || !station._id) {
        throw new Error('Please select a time slot');
      }

      const bookingData = {
        stationId: station._id,
        timeSlotId: selectedSlot._id,
        date: selectedDate.toISOString(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      };

      const booking = await bookingService.createBooking(
        bookingData.stationId,
        bookingData.timeSlotId,
        bookingData
      );
      
      setSuccess(true);
      if (onBookingSuccess) {
        onBookingSuccess(booking);
      }
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.message || 'Failed to create booking');
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

  const sortSlots = (slots) => {
    return [...slots].sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a.startTime}`);
      const timeB = new Date(`1970/01/01 ${b.startTime}`);
      return timeA - timeB;
    });
  };

  const TimeSlotList = ({ slots }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {slots.map((slot) => {
        const isSelected = selectedSlot?._id === slot._id;
        const isAvailable = slot.availableSpots > 0;
        return (
          <Card
            key={slot._id}
            sx={{
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              bgcolor: isSelected ? 'primary.light' : isAvailable ? 'background.paper' : 'grey.100',
              borderLeft: 4,
              borderColor: isSelected
                ? 'primary.main'
                : isAvailable
                  ? 'success.main'
                  : 'error.main',
              transition: 'all 0.2s ease-in-out',
              '&:hover': isAvailable ? {
                transform: 'translateY(-2px)',
                boxShadow: 3,
                bgcolor: isSelected ? 'primary.light' : 'grey.50'
              } : {},
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => isAvailable && handleSlotSelect(slot)}
          >
            <CardContent sx={{ p: 2 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: isAvailable ? 'text.primary' : 'text.secondary'
                      }}
                    >
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 0.5
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: isAvailable ? 'success.main' : 'error.main',
                          mr: 1
                        }}
                      />
                      <Typography
                        variant="body2"
                        color={isAvailable ? "success.main" : "error.main"}
                        sx={{ fontWeight: 500 }}
                      >
                        {isAvailable ? 'Available' : 'Fully Booked'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 1,
                        bgcolor: isAvailable ? 'success.light' : 'error.light',
                        color: isAvailable ? 'success.dark' : 'error.dark',
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      {slot.availableSpots} {slot.availableSpots === 1 ? 'spot' : 'spots'} available
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {isSelected && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderBottomLeftRadius: 8,
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  Selected
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      key={`booking-dialog-${open}`}
    >
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
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Operating Hours: 8:00 AM - 8:00 PM
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Available Time Slots
                  </Typography>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Box>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : availableSlots.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 4,
                      bgcolor: 'grey.50',
                      borderRadius: 2
                    }}
                  >
                    <Typography color="textSecondary" variant="h6">
                      No available slots for the selected date
                    </Typography>
                    <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
                      Please try selecting a different date
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: '500px', overflowY: 'auto', pr: 1 }}>
                    <TimeSlotList slots={sortSlots(availableSlots)} />
                  </Box>
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