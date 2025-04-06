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
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Badge,
  Tabs,
  Tab,
  Zoom,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn,
  AccessTime,
  CalendarToday,
  CheckCircle,
  Error,
  Info,
  BatteryChargingFull,
  Timer,
  Payment as PaymentIcon,
  ConfirmationNumber,
  ArrowForward,
  ArrowBack,
  CreditCard,
  AccountBalance,
  LocalAtm
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import bookingService from '../services/bookingService';
import { loadStripe } from '@stripe/stripe-js';

const BookingDialog = ({ open, onClose, station }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [consecutiveSlots, setConsecutiveSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  const steps = [
    { label: 'Select Date', icon: <CalendarToday /> },
    { label: 'Choose Time Slot', icon: <AccessTime /> },
    { label: 'Payment', icon: <PaymentIcon /> },
    { label: 'Confirm Booking', icon: <ConfirmationNumber /> }
  ];

  const sortSlots = (slots) => {
    return [...slots].sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a.startTime}`);
      const timeB = new Date(`1970/01/01 ${b.startTime}`);
      return timeA - timeB;
    });
  };

  useEffect(() => {
    if (open && station) {
      fetchAvailableSlots();
    }
  }, [open, station, selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const slots = await bookingService.getAvailableSlots(station._id, selectedDate);
      setAvailableSlots(sortSlots(slots));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlots([]);
  };

  const handleSlotSelect = (slot) => {
    if (selectedSlots.some(s => s._id === slot._id)) {
      setSelectedSlots(selectedSlots.filter(s => s._id !== slot._id));
      return;
    }

    if (selectedSlots.length === 0) {
      setSelectedSlots([slot]);
      return;
    }

    const sortedSlots = [...selectedSlots, slot].sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a.startTime}`);
      const timeB = new Date(`1970/01/01 ${b.startTime}`);
      return timeA - timeB;
    });

    const isConsecutive = sortedSlots.some((currentSlot, index) => {
      if (index === sortedSlots.length - 1) return false;
      const nextSlot = sortedSlots[index + 1];
      const currentEndTime = new Date(`1970/01/01 ${currentSlot.endTime}`);
      const nextStartTime = new Date(`1970/01/01 ${nextSlot.startTime}`);
      return currentEndTime.getTime() === nextStartTime.getTime();
    });

    if (!isConsecutive) {
      setError('You can only select consecutive time slots');
      return;
    }

    setSelectedSlots(sortedSlots);
    setError('');
  };

  const calculateTotalCost = () => {
    if (selectedSlots.length === 0) return 0;
    return selectedSlots.reduce((total, slot) => {
      const startTime = new Date(`1970/01/01 ${slot.startTime}`);
      const endTime = new Date(`1970/01/01 ${slot.endTime}`);
      const hours = (endTime - startTime) / (1000 * 60 * 60);
      return total + (station.ratePerHour * hours);
    }, 0);
  };

  const calculateAdvancePayment = () => {
    return calculateTotalCost() * 0.1; // 10% of total cost
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleBooking();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0) {
      setError('Please select at least one time slot');
      return;
    }

    try {
      setLoading(true);
      const bookingData = {
        stationId: station._id,
        timeSlots: selectedSlots.map(slot => ({
          timeSlotId: slot._id,
          date: selectedDate.toISOString(),
          startTime: slot.startTime,
          endTime: slot.endTime
        })),
        date: selectedDate.toISOString(),
        totalCost: calculateTotalCost(),
        advancePayment: calculateAdvancePayment(),
        paymentStatus: 'pending'
      };

      // Create payment intent with Stripe for advance payment
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(calculateAdvancePayment() * 100), // Convert to cents
          currency: 'lkr',
        bookingData
        }),
      });

      const { clientSecret } = await response.json();
      setPaymentIntent(clientSecret);

      // Initialize Stripe Elements
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      const elements = stripe.elements();
      const card = elements.create('card');
      card.mount('#card-element');

      // Handle payment submission
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: 'Customer Name', // You can collect this from a form
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      // If payment successful, create booking
      await bookingService.createBooking(bookingData);
      setSuccess('Booking confirmed successfully! Advance payment received.');
      setShowConfirmation(true);
      setTimeout(() => {
      onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const findConsecutiveSlots = (slots) => {
    const sortedSlots = sortSlots(slots);
    const consecutive = [];
    
    for (let i = 0; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      if (currentSlot.availableSpots === 0) continue;
      
      const currentEndTime = new Date(`1970/01/01 ${currentSlot.endTime}`);
      const nextStartTime = new Date(`1970/01/01 ${sortedSlots[i + 1]?.startTime}`);
      
      if (nextStartTime && currentEndTime.getTime() === nextStartTime.getTime()) {
        consecutive.push([currentSlot, sortedSlots[i + 1]]);
      }
    }
    
    return consecutive;
  };

  useEffect(() => {
    if (availableSlots.length > 0) {
      setConsecutiveSlots(findConsecutiveSlots(availableSlots));
    }
  }, [availableSlots]);

  const TimeSlotCard = ({ slot }) => {
    const isSelected = selectedSlots.some(s => s._id === slot._id);
    const isAvailable = slot.availableSpots > 0;
    const isConsecutive = consecutiveSlots.some(pair => 
      pair.some(s => s._id === slot._id)
    );
    
    const canBeSelected = selectedSlots.length === 0 || 
      selectedSlots.some(selectedSlot => {
        const selectedEndTime = new Date(`1970/01/01 ${selectedSlot.endTime}`);
        const slotStartTime = new Date(`1970/01/01 ${slot.startTime}`);
        const selectedStartTime = new Date(`1970/01/01 ${selectedSlot.startTime}`);
        const slotEndTime = new Date(`1970/01/01 ${slot.endTime}`);
        
        return selectedEndTime.getTime() === slotStartTime.getTime() ||
               selectedStartTime.getTime() === slotEndTime.getTime();
      });
    
    return (
      <Zoom in={true} style={{ transitionDelay: '100ms' }}>
        <Card
          onClick={() => isAvailable && canBeSelected && handleSlotSelect(slot)}
          sx={{
            cursor: isAvailable && canBeSelected ? 'pointer' : 'not-allowed',
            bgcolor: isSelected 
              ? alpha(theme.palette.primary.main, 0.08) 
              : isAvailable && canBeSelected
                ? 'background.paper' 
                : alpha(theme.palette.grey[500], 0.08),
            border: isSelected 
              ? `2px solid ${theme.palette.primary.main}` 
              : isConsecutive && canBeSelected
                ? `1px solid ${theme.palette.success.main}`
                : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 2,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': isAvailable && canBeSelected ? {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
              bgcolor: isSelected 
                ? alpha(theme.palette.primary.main, 0.12) 
                : alpha(theme.palette.primary.main, 0.04)
            } : {},
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: isAvailable && canBeSelected
                ? isConsecutive
                  ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                  : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                : theme.palette.grey[400],
              opacity: isSelected ? 1 : 0.5
            }
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flex: 1
              }}>
                <AccessTime sx={{ 
                  fontSize: '1.2rem',
                  color: isAvailable && canBeSelected ? theme.palette.primary.main : theme.palette.grey[400]
                }} />
                <Box>
                  <Typography
                    variant="subtitle1"
                    color={isAvailable && canBeSelected ? 'text.primary' : 'text.disabled'}
                    sx={{ fontWeight: 500 }}
                  >
                    {slot.startTime} - {slot.endTime}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={isAvailable && canBeSelected ? 'text.secondary' : 'text.disabled'}
                  >
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1
              }}>
                {isConsecutive && (
                  <Chip
                    size="small"
                    label="Consecutive"
                    color="success"
                    sx={{ 
                      height: 24,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                )}
                <Badge
                  badgeContent={slot.availableSpots}
                  color={isAvailable ? 'success' : 'error'}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '0.75rem',
                      height: '20px',
                      minWidth: '20px',
                      padding: '0 4px',
                      borderRadius: '10px',
                      background: isAvailable 
                        ? `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                        : `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.light})`
                    }
                  }}
                >
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isAvailable 
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.error.main, 0.1),
                    border: `2px solid ${isAvailable ? theme.palette.success.main : theme.palette.error.main}`,
                    transition: 'all 0.3s ease'
                  }}>
                    <Typography 
                      variant="caption" 
                      color={isAvailable ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 600 }}
                    >
                      {isAvailable ? 'Open' : 'Full'}
                    </Typography>
                  </Box>
                </Badge>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  const PaymentCard = ({ icon, title, selected, onClick }) => (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
        border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid rgba(0, 0, 0, 0.12)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon}
        <Typography variant="body1">{title}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        color: 'white',
        py: 2,
        px: 3,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BatteryChargingFull />
          <Typography variant="h6">Book Charging Session</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel StepIconProps={{ icon: step.icon }}>
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                label="Select Date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                          Available Time Slots
                        </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
              ) : availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <TimeSlotCard key={slot._id} slot={slot} />
                ))
              ) : (
                <Alert severity="info">No available slots for this date</Alert>
              )}
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <Typography variant="h6" gutterBottom>
                    Payment Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Selected Time Slots
                      </Typography>
                      {selectedSlots.map((slot, index) => (
                        <Typography key={slot._id} variant="body1">
                          {index + 1}. {slot.startTime} - {slot.endTime}
                        </Typography>
                      ))}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography color="text.secondary">Rate per Hour</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography align="right">LKR {station.ratePerHour.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6">Total Cost</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" align="right" color="primary">
                        LKR {calculateTotalCost().toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Advance Payment (10%)
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle1" align="right" color="primary">
                        LKR {calculateAdvancePayment().toLocaleString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Please pay the advance payment of 10% to confirm your booking. The remaining amount should be paid at the station.
                      </Alert>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}>
                  <div id="card-element" />
              </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Confirm Booking
            </Typography>
            <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Station
                  </Typography>
                  <Typography variant="body1">{station.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {selectedDate.toLocaleDateString()} at {selectedSlots.map(slot => slot.startTime).join(' - ')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Total Cost
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" align="right">
                    LKR {calculateTotalCost().toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Advance Payment
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" align="right" color="primary">
                    LKR {calculateAdvancePayment().toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Please pay the remaining amount at the station before starting your charging session.
                  </Alert>
                </Grid>
        </Grid>
            </Paper>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || 
            (activeStep === 1 && selectedSlots.length === 0)}
          endIcon={activeStep === steps.length - 1 ? <ConfirmationNumber /> : <ArrowForward />}
          sx={{ 
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            },
          }}
        >
          {activeStep === steps.length - 1 ? 'Confirm Booking' : 'Next'}
        </Button>
      </DialogActions>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default BookingDialog;