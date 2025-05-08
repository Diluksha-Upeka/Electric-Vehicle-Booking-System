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
  Divider
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
  Visibility as ViewIcon
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [loading, setLoading] = useState(false);

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
              <Tooltip title="Grid View">
                <IconButton 
                  onClick={() => setViewMode('grid')}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Table View">
                <IconButton 
                  onClick={() => setViewMode('table')}
                  color={viewMode === 'table' ? 'primary' : 'default'}
                >
                  <SortIcon />
                </IconButton>
              </Tooltip>
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
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
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

  const renderGrid = () => (
    <Grid container spacing={2}>
      {paginatedBookings.map((booking) => (
        <Grid item xs={12} md={6} key={booking._id}>
    <Paper 
            elevation={2}
      sx={{ 
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {booking.station?.name || 'Unknown Station'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatLocation(booking.station?.location)}
                </Typography>
              </Box>
              <Chip
                label={booking.status || 'UNKNOWN'}
                color={getStatusColor(booking.status)}
                size="small"
              />
            </Box>

            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2">
                  {formatDate(booking.date)} at {formatTimeSlot(booking.timeSlot)}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">
                  {booking.station?.address || 'Address not available'}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Receipt fontSize="small" color="action" />
                <Typography variant="body2">
                  Booking ID: {booking._id}
      </Typography>
              </Box>

              <Box 
              sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <AttachMoney fontSize="small" color="primary" />
                  <Typography variant="body2" color="primary">
                    Advance Paid: LKR {(booking.advanceAmount || 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <AttachMoney fontSize="small" color="text.secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Remaining: LKR {((booking.totalAmount || 0) - (booking.advanceAmount || 0)).toFixed(2)}
                    </Typography>
                  </Box>
                  </Box>

              {booking.status !== 'CANCELLED' && (
                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancelClick(booking._id)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                >
                  Cancel Booking
                </Button>
                </Box>
              )}
            </Box>
          </Paper>
          </Grid>
        ))}
      </Grid>
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
        {viewMode === 'grid' ? renderGrid() : renderTable()}
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
    </Box>
  );
};

export default BookingsSection; 