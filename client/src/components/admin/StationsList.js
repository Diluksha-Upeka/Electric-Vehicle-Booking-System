import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  Typography,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import adminService from '../../services/adminService';
import StationForm from './StationForm';
import StationStats from './StationStats';

const StationsList = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    station: null,
    newStatus: null
  });

  const fetchStations = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await adminService.getAllStations(filters);
      setStations(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, [statusFilter]);

  const handleOpenForm = (station = null) => {
    setSelectedStation(station);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelectedStation(null);
    setOpenForm(false);
  };

  const handleOpenStats = (station) => {
    setSelectedStation(station);
    setOpenStats(true);
  };

  const handleCloseStats = () => {
    setSelectedStation(null);
    setOpenStats(false);
  };

  const handleDelete = async (stationId) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        await adminService.deleteStation(stationId);
        fetchStations();
      } catch (err) {
        setError(err.message || 'Failed to delete station');
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedStation) {
        await adminService.updateStation(selectedStation._id, formData);
      } else {
        await adminService.createStation(formData);
      }
      handleCloseForm();
      fetchStations();
    } catch (err) {
      setError(err.message || 'Failed to save station');
    }
  };

  const handleStatusChange = (station) => {
    const newStatus = station.status === 'Active' ? 'Inactive' : 'Active';
    setConfirmDialog({
      open: true,
      station,
      newStatus
    });
  };

  const handleConfirmStatusChange = async () => {
    try {
      await handleFormSubmit({
        ...confirmDialog.station,
        status: confirmDialog.newStatus
      });
      setConfirmDialog({ open: false, station: null, newStatus: null });
    } catch (error) {
      console.error('Error updating station status:', error);
    }
  };

  const handleCancelStatusChange = () => {
    setConfirmDialog({ open: false, station: null, newStatus: null });
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </TextField>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Add Station
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Operating Hours</TableCell>
              <TableCell>Chargers</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stations.map((station) => (
              <TableRow key={station._id}>
                <TableCell>{station.name}</TableCell>
                <TableCell>{station.location}</TableCell>
                <TableCell>
                  {station.openingTime} - {station.closingTime}
                </TableCell>
                <TableCell>{station.totalChargers}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={station.status === 'Active'}
                        onChange={() => handleStatusChange(station)}
                        color="primary"
                      />
                    }
                    label={
                      <Chip
                        label={station.status}
                        color={station.status === 'Active' ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenStats(station)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpenForm(station)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(station._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedStation ? 'Edit Station' : 'Add New Station'}
        </DialogTitle>
        <DialogContent>
          <StationForm
            station={selectedStation}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openStats} onClose={handleCloseStats} maxWidth="sm" fullWidth>
        <DialogTitle>Station Statistics</DialogTitle>
        <DialogContent>
          {selectedStation && <StationStats stationId={selectedStation._id} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStats}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialog.open} onClose={handleCancelStatusChange}>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmDialog.newStatus?.toLowerCase()} the station "{confirmDialog.station?.name}"?
            {confirmDialog.newStatus === 'Inactive' && (
              <Typography color="error" sx={{ mt: 1 }}>
                Note: This will prevent new bookings at this station.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStatusChange}>Cancel</Button>
          <Button 
            onClick={handleConfirmStatusChange} 
            color={confirmDialog.newStatus === 'Inactive' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StationsList; 