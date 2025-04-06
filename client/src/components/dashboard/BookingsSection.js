import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  useTheme
} from '@mui/material';
import {
  ElectricCar,
  AccessTime,
  LocationOn
} from '@mui/icons-material';

const BookingsSection = ({ bookings, onCancelBooking }) => {
  const theme = useTheme();
  
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4]
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: 1,
        borderColor: 'divider'
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Your Bookings
      </Typography>
      <Grid container spacing={3}>
        {bookings.map((booking) => (
          <Grid item xs={12} md={6} lg={4} key={booking._id}>
            <Card 
              sx={{
                borderRadius: 2,
                ...cardStyle
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ElectricCar sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    {booking.station.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="body2">
                      {new Date(booking.timeSlot.date).toLocaleDateString()} at {booking.timeSlot.startTime}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="body2">
                      {booking.station.location.address || 'Location not available'}
                    </Typography>
                  </Box>
                  <Chip 
                    label={booking.status}
                    color={
                      booking.status === 'CONFIRMED' ? 'success' :
                      booking.status === 'PENDING' ? 'warning' :
                      'error'
                    }
                    size="small"
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  color="error" 
                  onClick={() => onCancelBooking(booking._id)}
                  disabled={booking.status === 'CANCELLED'}
                >
                  Cancel Booking
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default BookingsSection; 