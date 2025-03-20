import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Cancel as CancelIcon, Info as InfoIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BookingHistory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBookings(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bookings');
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchBookings();
    } catch (err) {
      setError('Failed to cancel booking');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (booking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
  };

  const getStatusChipColor = (status) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const duration = (endTime - startTime) / (1000 * 60); // Duration in minutes
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  const filterBookings = (status) => {
    return bookings.filter((booking) => {
      if (status === 'upcoming') {
        return new Date(booking.startTime) > new Date() && booking.status !== 'cancelled';
      }
      return new Date(booking.startTime) <= new Date() || booking.status === 'cancelled';
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Booking History
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Upcoming Bookings" />
            <Tab label="Past Bookings" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {filterBookings(activeTab === 0 ? 'upcoming' : 'past').map((booking) => (
            <Grid item xs={12} key={booking._id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6">{booking.station.name}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {booking.station.address}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2">
                        Start: {formatDateTime(booking.startTime)}
                      </Typography>
                      <Typography variant="body2">
                        End: {formatDateTime(booking.endTime)}
                      </Typography>
                      <Typography variant="body2">
                        Duration: {calculateDuration(booking.startTime, booking.endTime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2">
                        Connector: {booking.connectorType}
                      </Typography>
                      <Typography variant="body2">
                        Power: {booking.powerOutput}kW
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                        <Chip
                          label={booking.status}
                          color={getStatusChipColor(booking.status)}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(booking)}
                          color="primary"
                        >
                          <InfoIcon />
                        </IconButton>
                        {activeTab === 0 && booking.status !== 'cancelled' && (
                          <IconButton
                            size="small"
                            onClick={() => handleCancelBooking(booking._id)}
                            color="error"
                          >
                            <CancelIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Booking Details Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogContent>
            {selectedBooking && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedBooking.station.name}</Typography>
                  <Typography color="text.secondary">
                    {selectedBooking.station.address}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Booking Information</Typography>
                  <Typography>Start Time: {formatDateTime(selectedBooking.startTime)}</Typography>
                  <Typography>End Time: {formatDateTime(selectedBooking.endTime)}</Typography>
                  <Typography>
                    Duration: {calculateDuration(selectedBooking.startTime, selectedBooking.endTime)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Charging Details</Typography>
                  <Typography>Connector Type: {selectedBooking.connectorType}</Typography>
                  <Typography>Power Output: {selectedBooking.powerOutput}kW</Typography>
                  <Typography>
                    Estimated Cost: ${selectedBooking.estimatedCost.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Status</Typography>
                  <Chip
                    label={selectedBooking.status}
                    color={getStatusChipColor(selectedBooking.status)}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default BookingHistory; 