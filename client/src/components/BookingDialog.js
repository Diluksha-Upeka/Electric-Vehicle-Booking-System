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
  CardContent,
  useTheme,
  alpha,
  Fade,
  IconButton,
  Divider,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn,
  AccessTime,
  CalendarToday,
  CheckCircle,
  Error
} from '@mui/icons-material';
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
  const theme = useTheme();

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
              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : isAvailable ? 'background.paper' : alpha(theme.palette.grey[500], 0.08),
              border: 'none',
              boxShadow: isSelected ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': isAvailable ? {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4],
                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04)
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
                        color: isAvailable ? 'text.primary' : 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <AccessTime sx={{ fontSize: '1.2rem' }} />
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 1,
                        gap: 1
                      }}
                    >
                      {isAvailable ? (
                        <CheckCircle color="success" sx={{ fontSize: '1rem' }} />
                      ) : (
                        <Error color="error" sx={{ fontSize: '1rem' }} />
                      )}
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
                  <Chip
                    label={`${slot.availableSpots} ${slot.availableSpots === 1 ? 'spot' : 'spots'} available`}
                    color={isAvailable ? "success" : "error"}
                    variant={isAvailable ? "filled" : "outlined"}
                    sx={{ fontWeight: 500 }}
                  />
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
                    px: 2,
                    py: 0.5,
                    borderBottomLeftRadius: 8,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <CheckCircle sx={{ fontSize: '1rem' }} />
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
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.08)
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Book Charging Station
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'grey.500',
            '&:hover': {
              color: 'grey.700'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {station ? (
            <>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'background.paper', border: 'none', boxShadow: theme.shadows[1] }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      {station.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                      <LocationOn fontSize="small" />
                      <Typography variant="body2">
                        {formatLocation(station.location)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">
                        Operating Hours: 8:00 AM - 8:00 PM
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'background.paper', border: 'none', boxShadow: theme.shadows[1] }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CalendarToday color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Select Date
                      </Typography>
                    </Box>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Choose a date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        minDate={new Date()}
                        maxDate={new Date(new Date().setDate(new Date().getDate() + 30))}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'background.paper', border: 'none', boxShadow: theme.shadows[1] }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Available Time Slots
                        </Typography>
                      </Box>
                      <Chip
                        label={selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>

                    {loading ? (
                      <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                      </Box>
                    ) : error ? (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                    ) : availableSlots.length === 0 ? (
                      <Box
                        sx={{
                          textAlign: 'center',
                          py: 4,
                          bgcolor: alpha(theme.palette.grey[500], 0.04),
                          borderRadius: 2
                        }}
                      >
                        <Typography color="textSecondary" variant="h6" gutterBottom>
                          No available slots for the selected date
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Please try selecting a different date
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: '500px', overflowY: 'auto', pr: 1 }}>
                        <TimeSlotList slots={sortSlots(availableSlots)} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
        <Button 
          onClick={onClose}
          sx={{ 
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleBooking}
          variant="contained"
          color="primary"
          disabled={!selectedSlot || loading}
          sx={{ 
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
        </Button>
      </DialogActions>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess(false)}
          sx={{ 
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }}
        >
          Booking confirmed successfully!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BookingDialog;