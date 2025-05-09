import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Button,
  Stack,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Event,
  BatteryChargingFull,
  NavigateNext,
  AccessTime,
  Receipt,
  AttachMoney,
  Cancel as CancelIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Directions as DirectionsIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import BookingInvoice from '../invoice/BookingInvoice';
import { QRCodeSVG } from 'qrcode.react';

const UpcomingBookings = ({ bookings, onViewAll }) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Filter and sort upcoming bookings
  const upcomingBookings = bookings
    .filter(booking => {
      const bookingDate = new Date(booking.date || booking.startTime);
      const today = new Date();
      return booking.status !== 'CANCELLED' && bookingDate >= today;
    })
    .sort((a, b) => {
      const aDate = new Date(a.date || a.startTime);
      const bDate = new Date(b.date || b.startTime);
      return aDate - bDate;
    });

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % upcomingBookings.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + upcomingBookings.length) % upcomingBookings.length);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setInvoiceDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedBooking(null);
  };

  const getDirectionsUrl = (location) => {
    if (!location?.coordinates) return null;
    const [longitude, latitude] = location.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  if (upcomingBookings.length === 0) {
    return (
      <Card sx={{ 
        height: '100%',
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        bgcolor: 'background.paper'
      }}>
        <CardContent>
          <Typography variant="subtitle1" color="text.secondary" align="center">
            No upcoming bookings
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ 
        height: '100%',
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <CardContent sx={{ 
          height: '100%', 
          position: 'relative', 
          p: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 500,
              color: 'text.primary'
            }}>
              Upcoming Bookings
            </Typography>
            <Tooltip title="View all bookings">
              <IconButton 
                size="small" 
                onClick={onViewAll}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: theme.palette.grey[100]
                  }
                }}
              >
                <NavigateNext />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ 
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            p: 1.5
          }}>
            {/* Swipe Arrows */}
            {upcomingBookings.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrev}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 3,
                    color: 'text.secondary',
                    backgroundColor: 'background.paper',
                    boxShadow: theme.shadows[1],
                    opacity: 0.6,
                    '&:hover': {
                      backgroundColor: theme.palette.grey[100],
                      opacity: 1
                    }
                  }}
                >
                  <KeyboardArrowLeft />
                </IconButton>

                <IconButton
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 3,
                    color: 'text.secondary',
                    backgroundColor: 'background.paper',
                    boxShadow: theme.shadows[1],
                    opacity: 0.6,
                    '&:hover': {
                      backgroundColor: theme.palette.grey[100],
                      opacity: 1
                    }
                  }}
                >
                  <KeyboardArrowRight />
                </IconButton>
              </>
            )}

            {upcomingBookings.map((booking, index) => (
              <Fade 
                key={booking._id}
                in={index === currentIndex}
                timeout={300}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: index === currentIndex ? 1 : 0,
                    zIndex: 1,
                    p: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Typography variant="subtitle1" fontWeight={500} color="text.primary">
                        {booking.station?.name || 'Unknown Station'}
                      </Typography>
                      <Chip
                        label={booking.status}
                        color={booking.status === 'CONFIRMED' ? 'success' : 'warning'}
                        size="small"
                        sx={{
                          backgroundColor: booking.status === 'CONFIRMED' 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.warning.main, 0.1),
                          color: booking.status === 'CONFIRMED'
                            ? theme.palette.success.dark
                            : theme.palette.warning.dark,
                          fontWeight: 500,
                          borderRadius: 1,
                          height: 24
                        }}
                      />
                    </Box>

                    <Stack spacing={1.5}>
                      {/* Date and Time Section */}
                      <Box 
                        sx={{
                          p: 1.5,
                          bgcolor: theme.palette.grey[100],
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
                          {booking.date ? format(new Date(booking.date), 'MMM dd, yyyy') : 'Date not available'}
                        </Typography>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
                          {booking.timeSlot?.startTime || 'Time not available'}
                        </Typography>
                      </Box>

                      {/* Payment Section */}
                      <Box 
                        sx={{
                          p: 1.5,
                          bgcolor: theme.palette.grey[100],
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Payment Details
                        </Typography>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
                          LKR {(booking.advanceAmount || 0).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Remaining: LKR {((booking.totalAmount || 0) - (booking.advanceAmount || 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Box display="flex" justifyContent="flex-start" mt={1.5}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Receipt />}
                      onClick={() => handleViewDetails(booking)}
                      sx={{
                        borderRadius: 1,
                        textTransform: 'none',
                        px: 2,
                        py: 0.5,
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: 'none',
                          backgroundColor: theme.palette.primary.dark
                        }
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </Fade>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog
        open={invoiceDialogOpen}
        onClose={handleCloseInvoiceDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                EVCONNECT
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Your Trusted EV Charging Partner
              </Typography>
            </Box>
            <IconButton onClick={handleCloseInvoiceDialog} size="small">
              <CancelIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {selectedBooking.station?.name || 'Unknown Station'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Booking ID: {selectedBooking._id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Chip
                      label={selectedBooking.status}
                      color={selectedBooking.status === 'CONFIRMED' ? 'success' : 'warning'}
                      size="small"
                      sx={{ 
                        fontWeight: 500,
                        borderRadius: 1
                      }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body1">
                        {format(new Date(selectedBooking.date), 'MMM dd, yyyy')}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Time
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.timeSlot?.startTime || 'Time not available'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Payment Details
                      </Typography>
                      <Box sx={{ 
                        bgcolor: theme.palette.grey[100],
                        p: 2,
                        borderRadius: 1
                      }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Total Amount:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            LKR {(selectedBooking.totalAmount || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">Advance Paid:</Typography>
                          <Typography variant="body2" color="primary">
                            LKR {(selectedBooking.advanceAmount || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Remaining:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            LKR {((selectedBooking.totalAmount || 0) - (selectedBooking.advanceAmount || 0)).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    {selectedBooking && (
                      <PDFDownloadLink
                        document={<BookingInvoice booking={selectedBooking} />}
                        fileName={`booking-invoice-${selectedBooking._id}.pdf`}
                      >
                        {({ blob, url, loading, error }) => (
                          <Box sx={{ 
                            width: '100%',
                            aspectRatio: '1',
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            p: 1,
                            boxShadow: theme.shadows[1],
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1
                          }}>
                            {loading ? (
                              <CircularProgress size={40} />
                            ) : (
                              <>
                                <QRCodeSVG
                                  value={JSON.stringify({
                                    bookingId: selectedBooking._id,
                                    station: selectedBooking.station?.name,
                                    date: selectedBooking.date,
                                    time: selectedBooking.timeSlot?.startTime,
                                    status: selectedBooking.status
                                  })}
                                  size={120}
                                  level="H"
                                  bgColor="#ffffff"
                                  fgColor="#2e7d32"
                                />
                                <Typography variant="caption" color="text.secondary" align="center">
                                  Scan to verify booking
                                </Typography>
                              </>
                            )}
                          </Box>
                        )}
                      </PDFDownloadLink>
                    )}
                  </Box>
                </Grid>

                {getDirectionsUrl(selectedBooking.station?.location) && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<DirectionsIcon />}
                      component="a"
                      href={getDirectionsUrl(selectedBooking.station?.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      fullWidth
                    >
                      Get Directions
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvoiceDialog}>Close</Button>
          {selectedBooking && (
            <PDFDownloadLink
              document={<BookingInvoice booking={selectedBooking} />}
              fileName={`booking-invoice-${selectedBooking._id}.pdf`}
            >
              {({ blob, url, loading, error }) =>
                loading ? (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    disabled
                  >
                    Loading...
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                  >
                    Download Invoice
                  </Button>
                )
              }
            </PDFDownloadLink>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UpcomingBookings; 