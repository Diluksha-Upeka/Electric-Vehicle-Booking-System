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
  TextField,
  MenuItem,
} from '@mui/material';
import { Cancel as CancelIcon, Info as InfoIcon, Edit as EditIcon } from '@mui/icons-material';
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
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      const endpoint = user?.role === 'ADMIN' ? '' : '/my-bookings';
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Transform the data to ensure all required fields are present
      const transformedBookings = response.data.map(booking => ({
        ...booking,
        user: booking.user || { firstName: 'Unknown', lastName: 'User' },
        station: booking.station || { name: 'Unknown Station' },
        connectorType: booking.connectorType || 'N/A',
        powerOutput: booking.powerOutput || 0,
        estimatedCost: booking.cost?.estimated || 0
      }));
      
      setBookings(transformedBookings);
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setError('');
      fetchBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/bookings/${selectedBooking._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setStatusUpdateDialog(false);
      setNewStatus('');
      setError('');
      fetchBookings();
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(err.response?.data?.message || 'Failed to update booking status');
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

  const handleOpenStatusUpdate = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setStatusUpdateDialog(true);
  };

  const handleCloseStatusUpdate = () => {
    setStatusUpdateDialog(false);
    setSelectedBooking(null);
    setNewStatus('');
  };

  const getStatusChipColor = (status) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
      case 'pending':
        return 'primary';
      case 'in_progress':
        return 'warning';
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
          {user?.role === 'ADMIN' ? 'All Bookings' : 'My Booking History'}
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
                      {user?.role === 'ADMIN' && (
                        <Typography variant="body2" color="text.secondary">
                          User: {booking.user.name}
                        </Typography>
                      )}
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
                        {user?.role === 'ADMIN' && (
                          <IconButton
                            size="small"
                            onClick={() => handleOpenStatusUpdate(booking)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        {(activeTab === 0 && booking.status !== 'cancelled' && 
                         (user?.role === 'ADMIN' || booking.user._id === user?._id)) && (
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
                  {user?.role === 'ADMIN' && (
                    <Typography color="text.secondary">
                      User: {selectedBooking.user.name}
                    </Typography>
                  )}
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
                    Estimated Cost: ${selectedBooking.estimatedCost?.toFixed(2)}
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

        {/* Status Update Dialog */}
        {user?.role === 'ADMIN' && (
          <Dialog open={statusUpdateDialog} onClose={handleCloseStatusUpdate} maxWidth="xs" fullWidth>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogContent>
              <TextField
                select
                fullWidth
                label="Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                margin="normal"
              >
                {validStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseStatusUpdate}>Cancel</Button>
              <Button onClick={handleUpdateStatus} variant="contained" color="primary">
                Update
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Paper>
    </Container>
  );
};

export default BookingHistory; 



//updated the booking history page to include a status update dialog for admin users, allowing them to change the status of bookings.