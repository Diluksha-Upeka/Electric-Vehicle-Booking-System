import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  useTheme,
  alpha,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn,
  AccessTime,
  Payment,
  CheckCircle,
  BatteryChargingFull,
  AttachMoney,
  CreditCard,
  Receipt,
  Business,
  CalendarToday,
  Schedule
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, addDays, isBefore, isAfter, setHours, setMinutes } from 'date-fns';
import axios from 'axios';

const steps = ['Select Date', 'Choose Time Slot', 'Payment', 'Confirmation'];

const BookingDialog = ({ open, onClose, station, onSuccess }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState(null);
  const [advancePaid, setAdvancePaid] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });

  const totalAmount = station?.ratePerHour || 0;
  const advanceAmount = totalAmount * 0.1; // 10% advance

  useEffect(() => {
    if (open && selectedDate) {
      fetchSlots();
    }
  }, [open, selectedDate]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to book a station');
        return;
      }

      if (!station?._id) {
        setError('Invalid station selected');
        return;
      }

      if (!selectedDate) {
        setError('Please select a date first');
        return;
      }

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      console.log('Fetching slots for date:', formattedDate);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bookings/stations/${station._id}/time-slots`,
        {
          params: {
            date: formattedDate
          },
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Received slots response:', response.data);

      if (!response.data) {
        console.error('No response data received');
        throw new Error('No response data received from server');
      }

      // Handle both array and object response formats
      const slotsData = Array.isArray(response.data) ? response.data : response.data.slots;

      if (!slotsData || !Array.isArray(slotsData)) {
        console.error('Invalid slots data:', response.data);
        throw new Error('Invalid slots data received from server');
      }

      // Transform the slots to match the expected format
      const transformedSlots = slotsData.map(slot => {
        if (!slot._id || !slot.startTime || !slot.endTime) {
          console.error('Invalid slot data:', slot);
          throw new Error('Invalid slot data received from server');
        }
        return {
          _id: slot._id,
          time: `${slot.startTime} - ${slot.endTime}`,
          startTime: slot.startTime, // Add startTime for sorting
          remainingSlots: slot.availableSpots || 0,
          totalSlots: slot.totalSpots || 0,
          status: slot.status || 'Available'
        };
      });

      // Sort slots by start time
      const sortedSlots = transformedSlots.sort((a, b) => {
        const timeA = a.startTime.split(':')[0]; // Get hour from startTime
        const timeB = b.startTime.split(':')[0];
        return parseInt(timeA) - parseInt(timeB);
      });

      console.log('Transformed and sorted slots:', sortedSlots);
      setSlots(sortedSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        if (error.response.status === 404) {
          setError('No slots available for this date');
        } else {
          setError(error.response.data.error || 'Failed to fetch available slots');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        setError('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        setError(error.message || 'Failed to fetch available slots');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    if (slot.remainingSlots > 0) {
      setSelectedSlot({
        ...slot,
        remainingSlots: slot.remainingSlots
      });
    }
  };

  const handlePayment = async () => {
    setCardDialogOpen(true);
  };

  const handleCardSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to book a station');
        return;
      }

      if (!station?._id) {
        setError('Invalid station selected');
        return;
      }

      if (!selectedDate || !selectedSlot) {
        setError('Please select a date and time slot');
        return;
      }

      // First check if the user has any existing bookings for this time slot
      try {
        const checkResponse = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bookings/my-bookings`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const existingBookings = checkResponse.data;
        const hasOverlappingBooking = existingBookings.some(booking => {
          if (booking.status === 'CANCELLED') return false;
          const bookingDate = new Date(booking.date);
          const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
          const bookingDateStr = format(bookingDate, 'yyyy-MM-dd');
          return bookingDateStr === selectedDateStr && 
                 booking.timeSlot.startTime === selectedSlot.time.split(' - ')[0];
        });

        if (hasOverlappingBooking) {
          setError('You already have a booking for this time slot. Please choose a different time.');
          return;
        }
      } catch (checkError) {
        console.error('Error checking existing bookings:', checkError);
        // Continue with booking attempt even if check fails
      }

      // Format the booking data according to the API requirements
      const bookingData = {
        stationId: station._id,
        timeSlotId: selectedSlot._id,
        paymentDetails: {
          amount: totalAmount,
          advanceAmount: advanceAmount,
          paymentId: `PAY-${Date.now()}`,
          currency: 'LKR'
        }
      };

      console.log('Creating booking:', bookingData);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bookings`,
        bookingData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Booking response:', response.data);

      if (!response.data || !response.data.booking) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }

      const { booking } = response.data;
      setBookingId(booking.id);
      setAdvancePaid(true);
      setActiveStep(3);

      // Update the slots after successful booking
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot._id === selectedSlot._id 
            ? { ...slot, remainingSlots: slot.remainingSlots - 1 }
            : slot
        )
      );

      setCardDialogOpen(false);
    } catch (error) {
      console.error('Error processing payment:', error);
      
      if (error.response) {
        console.error('Error Response:', error.response.data);
        
        const errorMessage = error.response.data.error || error.response.data.message;
        
        if (errorMessage?.includes('already have a booking') || 
            errorMessage?.includes('overlaps')) {
          setError('You already have a booking for this time slot. Please choose a different time.');
          // Reset the selected slot to allow user to choose another
          setSelectedSlot(null);
        } else {
          switch (error.response.status) {
            case 400:
              setError(errorMessage || 'Invalid booking data. Please check your input.');
              break;
            case 401:
              setError('Your session has expired. Please log in again.');
              break;
            case 403:
              setError('You do not have permission to make this booking.');
              break;
            case 409:
              setError('This time slot is no longer available. Please choose a different time.');
              break;
            case 500:
              setError('An error occurred while processing your booking. Please try again later.');
              break;
            default:
              setError(errorMessage || 'Failed to process booking');
          }
        }
      } else if (error.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(error.message || 'Failed to process booking');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 1) {
      handlePayment();
    } else {
    setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedDate(null);
    setSelectedSlot(null);
    setError('');
    setBookingId(null);
    setAdvancePaid(false);
    setCardDialogOpen(false);
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
  return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select a date for your booking
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Available Time Slots
            </Typography>
            {renderTimeSlots()}
          </Box>
        );

      case 2:
        return renderPaymentSection();

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ 
              textAlign: 'center', 
              mb: 4,
              position: 'relative'
            }}>
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.1)} 0%, transparent 70%)`,
                zIndex: 0
              }} />
              <CheckCircle 
                color="success" 
                sx={{ 
                  fontSize: 80,
                  mb: 2,
                  position: 'relative',
                  zIndex: 1
                }} 
              />
              <Typography 
                variant="h5" 
                sx={{ 
                  mt: 2,
                  fontWeight: 600,
                  color: theme.palette.success.main,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Booking Confirmed!
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mt: 1,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                Your charging station has been successfully booked
              </Typography>
            </Box>

            <Paper 
              sx={{ 
                p: 3,
                background: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Pattern */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
                transform: 'translate(30%, -30%)',
                zIndex: 0
              }} />

              {/* Booking Details */}
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Grid container spacing={3}>
                  {/* Left Column */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Booking Reference
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: theme.palette.primary.main,
                          fontFamily: 'monospace',
                          letterSpacing: 1
                        }}
                      >
                        {bookingId}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Station Details
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 1
                      }}>
                        <Business color="primary" fontSize="small" />
                        <Typography variant="body1">
                          {station.name}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1
                      }}>
                        <LocationOn color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {station.location?.address || 'Location not available'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Right Column */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Booking Schedule
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 1
                      }}>
                        <CalendarToday color="primary" fontSize="small" />
                        <Typography variant="body1">
                          {format(selectedDate, 'MMMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1
                      }}>
                        <Schedule color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {selectedSlot.time}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Payment Status
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        mb: 1
                      }}>
                        <Payment color="success" fontSize="small" />
                        <Typography variant="body1" color="success.main">
                          Advance Paid
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        LKR {advanceAmount.toFixed(2)} (10% of total)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Bottom Section */}
                <Box sx={{ 
                  mt: 3, 
                  pt: 3, 
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <BatteryChargingFull color="primary" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Please arrive 5 minutes before your scheduled time
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  const renderTimeSlots = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" component="div" gutterBottom>
        Available Time Slots
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : slots.length === 0 ? (
        <Alert severity="info">No slots available for this date</Alert>
      ) : (
        <Grid container spacing={2}>
          {slots.map((slot) => (
            <Grid item xs={12} sm={6} md={4} key={slot._id}>
              <Paper
                sx={{
                  p: 2,
                  cursor: slot.remainingSlots > 0 ? 'pointer' : 'not-allowed',
                  bgcolor: selectedSlot?._id === slot._id 
                    ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                    : 'background.paper',
                  border: selectedSlot?._id === slot._id 
                    ? `2px solid ${theme.palette.primary.main}`
                    : '2px solid transparent',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  '&:hover': {
                    bgcolor: slot.remainingSlots > 0 
                      ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                      : 'background.paper',
                  },
                }}
                onClick={() => handleSlotSelect(slot)}
              >
                <Typography variant="subtitle1" component="div" gutterBottom>
                  {slot.time}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`${slot.remainingSlots}/${slot.totalSlots} spots left`}
                    color={slot.remainingSlots > 0 ? 'success' : 'error'}
                    size="small"
                  />
                  <Typography variant="body2" component="span" color="text.secondary">
                    {slot.status}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderPaymentSection = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Payment Details
      </Typography>
      <Paper 
        sx={{ 
          p: 3,
          background: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        {/* Invoice Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            INVOICE
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(), 'MMMM dd, yyyy')}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Station Details */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Business color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {station.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocationOn color="action" />
            <Typography variant="body2" color="text.secondary">
              {station.location?.address || 'Location not available'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule color="action" />
            <Typography variant="body2" color="text.secondary">
              {selectedSlot?.time}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Payment Details */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Payment Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  LKR {totalAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Advance Payment (10%):</Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                  LKR {advanceAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Remaining Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  LKR {(totalAmount - advanceAmount).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Please proceed with the advance payment to confirm your booking
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

  const renderCardPaymentDialog = () => (
    <Dialog 
      open={cardDialogOpen} 
      onClose={() => setCardDialogOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard color="primary" />
            <Typography variant="h6">
              Secure Payment
            </Typography>
          </Box>
          <IconButton onClick={() => setCardDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Payment Summary */}
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3,
              background: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Payment Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Advance Payment:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                LKR {advanceAmount.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Remaining Amount:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                LKR {(totalAmount - advanceAmount).toFixed(2)}
              </Typography>
            </Box>
          </Paper>

          {/* Card Details Form */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Card Details
            </Typography>
            <TextField
              fullWidth
              label="Card Number"
              value={cardDetails.cardNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                setCardDetails({ ...cardDetails, cardNumber: formatted });
              }}
              placeholder="1234 5678 9012 3456"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCard />
                  </InputAdornment>
                ),
              }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  value={cardDetails.expiryDate}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    const formatted = value.replace(/(\d{2})(\d{0,2})/, '$1/$2');
                    setCardDetails({ ...cardDetails, expiryDate: formatted });
                  }}
                  placeholder="MM/YY"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CVV"
                  value={cardDetails.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                    setCardDetails({ ...cardDetails, cvv: value });
                  }}
                  placeholder="123"
                  sx={{ mb: 2 }}
                  type="password"
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Cardholder Name"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
              placeholder="John Doe"
              sx={{ mb: 2 }}
            />
          </Box>

          {/* Security Notice */}
          <Box sx={{ 
            p: 2, 
            bgcolor: alpha(theme.palette.info.main, 0.1),
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CheckCircle color="info" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Your payment information is secure and encrypted
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={() => setCardDialogOpen(false)}
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCardSubmit}
          disabled={!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.name}
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            },
            minWidth: 120
          }}
        >
          Pay LKR {advanceAmount.toFixed(2)}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Book Charging Station
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            renderStepContent(activeStep)
        )}
      </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          {activeStep > 0 && activeStep < 3 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
          {activeStep < 3 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
                (activeStep === 0 && !selectedDate) ||
                (activeStep === 1 && !selectedSlot) ||
                loading
              }
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                }
              }}
            >
              {activeStep === 2 ? 'Pay Now' : 'Next'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => {
                handleClose();
                onSuccess();
              }}
              sx={{
                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                }
              }}
            >
              Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
      {renderCardPaymentDialog()}
    </>
  );
};

export default BookingDialog;