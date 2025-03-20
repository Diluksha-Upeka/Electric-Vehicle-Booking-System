import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import axios from 'axios';

const TimeSlotSelection = ({ stationId, selectedDate, onSlotSelect }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [batteryDetails, setBatteryDetails] = useState({
    initialPercentage: '',
  });

  useEffect(() => {
    if (stationId && selectedDate) {
      fetchTimeSlots();
    }
  }, [stationId, selectedDate]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stations/${stationId}/time-slots`,
        {
          params: { date: selectedDate },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setTimeSlots(response.data.slots);
      setError('');
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError(err.response?.data?.message || 'Failed to fetch time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setConfirmDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookings`,
        {
          stationId,
          timeSlotId: selectedSlot._id,
          batteryDetails,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Update local state to reflect the booking
      setTimeSlots(prevSlots =>
        prevSlots.map(slot =>
          slot._id === selectedSlot._id
            ? { ...slot, availableSpots: slot.availableSpots - 1 }
            : slot
        )
      );

      setConfirmDialogOpen(false);
      setSelectedSlot(null);
      setBatteryDetails({ initialPercentage: '' });
      onSlotSelect(response.data);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {timeSlots.map((slot) => (
          <Grid item xs={12} sm={6} md={4} key={slot._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {slot.startTime} - {slot.endTime}
                </Typography>
                <Typography color="text.secondary">
                  Available Spots: {slot.availableSpots}
                </Typography>
                <Typography color="text.secondary">
                  Status: {slot.status}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={slot.availableSpots === 0 || slot.status === 'Booked'}
                  onClick={() => handleSlotSelect(slot)}
                >
                  {slot.availableSpots === 0 ? 'Fully Booked' : 'Select Slot'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>
              Selected Time Slot: {selectedSlot?.startTime} - {selectedSlot?.endTime}
            </Typography>
            <TextField
              label="Current Battery Percentage"
              type="number"
              fullWidth
              value={batteryDetails.initialPercentage}
              onChange={(e) => setBatteryDetails({ initialPercentage: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmBooking}
            variant="contained"
            disabled={!batteryDetails.initialPercentage}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeSlotSelection; 