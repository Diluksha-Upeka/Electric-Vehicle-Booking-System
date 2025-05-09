import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Card,
  CardContent,
  Stack,
  Divider,
  Link,
  CircularProgress
} from '@mui/material';
import {
  LocationOn,
  AccessTime,
  AttachMoney,
  Receipt,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Directions as DirectionsIcon
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import BookingInvoice from '../invoice/BookingInvoice';
import { QRCodeSVG } from 'qrcode.react';

const BookingsSection = ({ bookings, onRefresh, onCancelBooking }) => {
  const theme = useTheme();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setCancelDialogOpen(true);
    setCancelError('');
  };

  const handleConfirmCancel = async () => {
    try {
      setLoading(true);
      setCancelError('');

      // Make sure we have a valid booking ID
      if (!selectedBookingId) {
        throw new Error('No booking selected for cancellation');
      }

      console.log('Confirming cancellation for booking:', selectedBookingId);

      // Call the cancellation function
      await onCancelBooking(selectedBookingId);
      
      // Close dialog and reset state
      setCancelDialogOpen(false);
      setSelectedBookingId(null);
      
      // Refresh the bookings list
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error in handleConfirmCancel:', error);
      
      // Extract error message
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to cancel booking. Please try again.';
      
      console.error('Detailed error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage
      });

      setCancelError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedBookingId(null);
    setCancelError('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return 'Invalid date';
      }
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not available';
    if (typeof location === 'string') return location;
    if (location.coordinates) {
      return `${location.coordinates[1].toFixed(6)}, ${location.coordinates[0].toFixed(6)}`;
    }
    return 'Location not available';
  };

  const formatTimeSlot = (timeSlot) => {
    if (!timeSlot) return 'Time not specified';
    if (typeof timeSlot === 'string') return timeSlot;
    if (timeSlot.startTime && timeSlot.endTime) {
      return `${timeSlot.startTime} - ${timeSlot.endTime}`;
    }
    return 'Time not specified';
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredAndSortedBookings = useMemo(() => {
    return bookings
      .filter(booking => {
        const matchesSearch = 
          booking.station?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.station?.address?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
        
        const bookingDate = new Date(booking.date);
        const today = new Date();
        const matchesDate = dateFilter === 'ALL' || 
          (dateFilter === 'UPCOMING' && bookingDate >= today) ||
          (dateFilter === 'PAST' && bookingDate < today);

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (sortField === 'date') {
          return sortDirection === 'asc' 
            ? new Date(aValue) - new Date(bValue)
            : new Date(bValue) - new Date(aValue);
        }
        
        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
  }, [bookings, searchQuery, statusFilter, dateFilter, sortField, sortDirection]);

  const paginatedBookings = useMemo(() => {
    return filteredAndSortedBookings.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredAndSortedBookings, page, rowsPerPage]);

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

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Date Range"
              >
                <MenuItem value="ALL">All Dates</MenuItem>
                <MenuItem value="UPCOMING">Upcoming</MenuItem>
                <MenuItem value="PAST">Past</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Tooltip title="Export">
                <IconButton>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Print">
                <IconButton>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortField === 'date'}
                direction={sortDirection}
                onClick={() => handleSort('date')}
              >
                Date & Time
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'station.name'}
                direction={sortDirection}
                onClick={() => handleSort('station.name')}
              >
                Station
              </TableSortLabel>
            </TableCell>
            <TableCell>Location</TableCell>
            <TableCell>
              <TableSortLabel
                active={sortField === 'status'}
                direction={sortDirection}
                onClick={() => handleSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>Amount</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedBookings.map((booking) => (
            <TableRow key={booking._id} hover>
              <TableCell>
                {formatDate(booking.date)} at {formatTimeSlot(booking.timeSlot)}
              </TableCell>
              <TableCell>{booking.station?.name || 'Unknown Station'}</TableCell>
              <TableCell>{formatLocation(booking.station?.location)}</TableCell>
              <TableCell>
                <Chip
                  label={booking.status}
                  color={getStatusColor(booking.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  LKR {(booking.totalAmount || 0).toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Advance: LKR {(booking.advanceAmount || 0).toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  {getDirectionsUrl(booking.station?.location) && (
                    <Tooltip title="Get Directions">
                      <IconButton 
                        size="small"
                        component="a"
                        href={getDirectionsUrl(booking.station?.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <DirectionsIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {booking.status !== 'CANCELLED' && (
                    <Tooltip title="Cancel Booking">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleCancelClick(booking._id)}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredAndSortedBookings.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      p: 2
    }}>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight="bold">
          My Bookings
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filters Section */}
      {renderFilters()}

      {/* Bookings Content */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme.palette.grey[100],
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.grey[400],
          borderRadius: '4px',
          '&:hover': {
            background: theme.palette.grey[500],
          },
        },
      }}>
        {renderTable()}
      </Box>

      {/* Cancel Confirmation Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={handleCloseCancelDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          {cancelError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cancelError}
            </Alert>
          )}
          <Typography>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>No, Keep Booking</Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Yes, Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>

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
                      color={getStatusColor(selectedBooking.status)}
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
                        {formatDate(selectedBooking.date)}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Time
                      </Typography>
                      <Typography variant="body1">
                        {formatTimeSlot(selectedBooking.timeSlot)}
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
    </Box>
  );
};

export default BookingsSection; 