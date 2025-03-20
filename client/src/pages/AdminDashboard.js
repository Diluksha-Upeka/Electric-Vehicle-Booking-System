import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import AddStation from '../components/AddStation';
import EditStation from '../components/EditStation';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addStationOpen, setAddStationOpen] = useState(false);
  const [editStationOpen, setEditStationOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    vehicleDetails: {},
    chargingPreferences: {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [usersResponse, stationsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/users', { headers }),
        axios.get('http://localhost:5000/api/stations', { headers })
      ]);

      setUsers(usersResponse.data);
      setStations(stationsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const handleAddStation = async (stationData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post('http://localhost:5000/api/stations', stationData, { headers });
      fetchData(); // Refresh the stations list
    } catch (error) {
      console.error('Error adding station:', error);
      setError('Failed to add station');
    }
  };

  const handleEditStation = async (stationId, stationData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`http://localhost:5000/api/stations/${stationId}`, stationData, { headers });
      fetchData(); // Refresh the stations list
    } catch (error) {
      console.error('Error updating station:', error);
      setError('Failed to update station');
    }
  };

  const handleDeleteStation = async (stationId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`http://localhost:5000/api/stations/${stationId}`, { headers });
      fetchData(); // Refresh the stations list
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting station:', error);
      setError('Failed to delete station');
    }
  };

  const handleEditUser = async (userId, userData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(`http://localhost:5000/api/auth/users/${userId}`, userData, { headers });
      fetchData(); // Refresh the users list
      setEditUserOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`http://localhost:5000/api/auth/users/${userId}`, { headers });
      fetchData(); // Refresh the users list
      setDeleteUserDialogOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditClick = (station) => {
    setSelectedStation(station);
    setEditStationOpen(true);
  };

  const handleDeleteClick = (station) => {
    setSelectedStation(station);
    setDeleteDialogOpen(true);
  };

  const handleEditUserClick = (user) => {
    setSelectedUser(user);
    setEditUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      vehicleDetails: user.vehicleDetails || {},
      chargingPreferences: user.chargingPreferences || {}
    });
    setEditUserOpen(true);
  };

  const handleDeleteUserClick = (user) => {
    setSelectedUser(user);
    setDeleteUserDialogOpen(true);
  };

  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage users and stations
            </Typography>
          </Paper>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Paper>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Users" />
              <Tab label="Stations" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Content */}
        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeTab === 0 ? (
            // Users Table
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEditUserClick(user)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteUserClick(user)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            // Stations Table
            <>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddStationOpen(true)}
                >
                  Add Station
                </Button>
              </Box>
              <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                    <TableCell>Connectors</TableCell>
                      <TableCell>Rate (LKR/hr)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station._id}>
                      <TableCell>{station.name}</TableCell>
                        <TableCell>{station.description}</TableCell>
                        <TableCell>{station.numberOfConnectors}</TableCell>
                        <TableCell>{station.ratePerHour}</TableCell>
                        <TableCell>{station.status}</TableCell>
                      <TableCell>
                          <IconButton size="small" onClick={() => handleEditClick(station)}>
                          <EditIcon />
                        </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteClick(station)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          )}
        </Grid>
      </Grid>

      {/* Add Station Dialog */}
      <AddStation
        open={addStationOpen}
        onClose={() => setAddStationOpen(false)}
        onAdd={handleAddStation}
      />

      {/* Edit Station Dialog */}
      <EditStation
        open={editStationOpen}
        onClose={() => setEditStationOpen(false)}
        onUpdate={handleEditStation}
        station={selectedStation}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Station</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this station? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDeleteStation(selectedStation._id)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
              label="First Name"
              name="firstName"
              value={editUserData.firstName}
              onChange={handleEditUserChange}
                  fullWidth
                />
                <TextField
              label="Last Name"
              name="lastName"
              value={editUserData.lastName}
              onChange={handleEditUserChange}
                  fullWidth
                />
                <TextField
                  label="Email"
              name="email"
              value={editUserData.email}
              onChange={handleEditUserChange}
                  fullWidth
                />
                <TextField
                  select
                  label="Role"
              name="role"
              value={editUserData.role}
              onChange={handleEditUserChange}
                  fullWidth
                >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
                </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserOpen(false)}>Cancel</Button>
          <Button onClick={() => handleEditUser(selectedUser._id, editUserData)} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteUserDialogOpen}
        onClose={() => setDeleteUserDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleDeleteUser(selectedUser._id)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 