import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Rating,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  LocationOn,
  BatteryChargingFull,
  AccessTime,
  LocalParking,
  Restaurant,
  Wifi,
  Wc,
  Store,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const amenityIcons = {
  'Restaurant': <Restaurant />,
  'Cafe': <Restaurant />,
  'Restroom': <Wc />,
  'WiFi': <Wifi />,
  'Parking': <LocalParking />,
  'Shop': <Store />,
};

const StationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openBooking, setOpenBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [currentBattery, setCurrentBattery] = useState('');
  const [targetBattery, setTargetBattery] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);

  useEffect(() => {
    fetchStationDetails();
  }, [id, fetchStationDetails]);

  const fetchStationDetails = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/stations/${id}`
      );
      setStation(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch station details');
      setLoading(false);
    }
  };

  const handleBookingOpen = () => {
    if (!user) {
      navigate('/login', { state: { from: `/stations/${id}` } });
      return;
    }
    setOpenBooking(true);
  };

  const handleBookingClose = () => {
    setOpenBooking(false);
    resetBookingForm();
  };

  const resetBookingForm = () => {
    setSelectedDate(new Date());
    setStartTime(null);
    setEndTime(null);
    setCurrentBattery('');
    setTargetBattery('');
    setEstimatedTime(null);
    setEstimatedCost(null);
    setSelectedConnector(null);
  };

  const calculateChargingTime = async () => {
    if (!currentBattery || !targetBattery || !selectedConnector) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/stations/${id}/calculate-charging-time`,
        {
          currentBatteryPercentage: parseInt(currentBattery),
          targetBatteryPercentage: parseInt(targetBattery),
          connectorType: selectedConnector.type,
        }
      );

      setEstimatedTime(response.data.estimatedChargingTime);
      // Set end time based on start time and estimated charging time
      if (startTime) {
        const endDateTime = new Date(startTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + response.data.estimatedChargingTime);
        setEndTime(endDateTime);
      }
    } catch (error) {
      setError('Failed to calculate charging time');
    }
  };

  const handleBookingSubmit = async () => {
    try {
      const bookingData = {
        stationId: id,
        connector: selectedConnector.type,
        startTime: startTime,
        endTime: endTime,
        batteryDetails: {
          initialPercentage: parseInt(currentBattery),
          targetPercentage: parseInt(targetBattery),
          estimatedChargingTime: estimatedTime,
        },
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookings`,
        bookingData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      handleBookingClose();
      navigate('/bookings');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleSubmitReview = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/stations/${id}/reviews`,
        {
          rating: reviewRating,
          comment: reviewText,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setReviewText('');
      setReviewRating(0);
      fetchStationDetails();
    } catch (error) {
      setError('Failed to submit review');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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

  if (!station) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Station Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {station.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOn color="primary" sx={{ mr: 1 }} />
              <Typography>
                {station.address.street}, {station.address.city}, {station.address.state}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Rating value={station.rating} precision={0.5} readOnly />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({station.reviews.length} reviews)
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Connectors */}
            <Typography variant="h6" gutterBottom>
              Available Connectors
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {station.connectors.map((connector, index) => (
                <Chip
                  key={index}
                  label={`${connector.type} - ${connector.powerOutput}kW`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>

            {/* Pricing */}
            <Typography variant="h6" gutterBottom>
              Pricing
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography>Base Rate: ${station.pricing.baseRate}/hour</Typography>
              <Typography>Energy Rate: ${station.pricing.energyRate}/kWh</Typography>
              <Typography>Minimum Charge: ${station.pricing.minimumCharge}</Typography>
            </Box>

            {/* Amenities */}
            <Typography variant="h6" gutterBottom>
              Amenities
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {station.amenities.map((amenity, index) => (
                <Chip
                  key={index}
                  icon={amenityIcons[amenity]}
                  label={amenity}
                  variant="outlined"
                />
              ))}
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleBookingOpen}
              fullWidth
            >
              Book Now
            </Button>
          </Paper>
        </Grid>

        {/* Reviews Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reviews
            </Typography>
            {user && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Write a Review
                </Typography>
                <Rating
                  value={reviewRating}
                  onChange={(event, newValue) => setReviewRating(newValue)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmitReview}
                  disabled={!reviewRating || !reviewText}
                >
                  Submit Review
                </Button>
              </Box>
            )}
            <List>
              {station.reviews.map((review, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={review.user.picture} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography component="span" variant="subtitle2">
                          {review.user.name}
                        </Typography>
                        <Rating
                          value={review.rating}
                          size="small"
                          readOnly
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {format(new Date(review.date), 'MMM d, yyyy')}
                        </Typography>
                        {" — "}{review.comment}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={openBooking} onClose={handleBookingClose} maxWidth="sm" fullWidth>
        <DialogTitle>Book a Charging Session</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Connector
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {station.connectors.map((connector, index) => (
                <Chip
                  key={index}
                  label={`${connector.type} - ${connector.powerOutput}kW`}
                  color={selectedConnector === connector ? 'primary' : 'default'}
                  onClick={() => setSelectedConnector(connector)}
                  clickable
                />
              ))}
            </Box>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <DatePicker
                    label="Date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDate={new Date()}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={setStartTime}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label="End Time"
                    value={endTime}
                    onChange={setEndTime}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minTime={startTime}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Battery Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Current Battery %"
                    type="number"
                    value={currentBattery}
                    onChange={(e) => setCurrentBattery(e.target.value)}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Target Battery %"
                    type="number"
                    value={targetBattery}
                    onChange={(e) => setTargetBattery(e.target.value)}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Grid>
              </Grid>
              <Button
                sx={{ mt: 2 }}
                onClick={calculateChargingTime}
                disabled={!currentBattery || !targetBattery || !selectedConnector}
              >
                Calculate Charging Time
              </Button>
            </Box>

            {estimatedTime && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">
                  Estimated Charging Time: {Math.round(estimatedTime)} minutes
                </Typography>
                {estimatedCost && (
                  <Typography variant="subtitle1">
                    Estimated Cost: ${estimatedCost.toFixed(2)}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBookingClose}>Cancel</Button>
          <Button
            onClick={handleBookingSubmit}
            variant="contained"
            disabled={!startTime || !endTime || !selectedConnector || !currentBattery || !targetBattery}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StationDetail; 