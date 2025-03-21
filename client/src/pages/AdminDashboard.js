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
  MenuItem,
  Card,
  CardContent,
  useTheme,
  alpha,
  Fade,
  Tooltip,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  EvStation as EvStationIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import axios from 'axios';
import AddStation from '../components/AddStation';
import EditStation from '../components/EditStation';

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const theme = useTheme();
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
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={500}>
        <Grid container spacing={3}>
          {/* Welcome Section */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Welcome back, Admin
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Here's what's happening with your EV charging network
              </Typography>
            </Paper>
          </Grid>

          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={users.length}
              icon={<PeopleIcon />}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Stations"
              value={stations.length}
              icon={<EvStationIcon />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Admin Users"
              value={users.filter(user => user.role === 'admin').length}
              icon={<AdminIcon />}
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Regular Users"
              value={users.filter(user => user.role === 'user').length}
              icon={<PersonIcon />}
              color={theme.palette.info.main}
            />
          </Grid>

          {/* Tabs */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 'none',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    minHeight: 48,
                  }
                }}
              >
                <Tab 
                  label="Users" 
                  icon={<PeopleIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  label="Stations" 
                  icon={<EvStationIcon />} 
                  iconPosition="start"
                />
              </Tabs>
            </Paper>
          </Grid>

          {/* Content */}
          <Grid item xs={12}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: '2rem',
                  }
                }}
              >
                {error}
              </Alert>
            )}

            {activeTab === 0 ? (
              // Users Table
              <TableContainer 
                component={Paper}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow 
                        key={user._id}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                              }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Typography variant="body2">
                              {`${user.firstName} ${user.lastName}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role}
                            size="small"
                            color={user.role === 'ADMIN' ? 'warning' : 'default'}
                            sx={{ 
                              borderRadius: 1,
                              textTransform: 'uppercase',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit user">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditUserClick(user)}
                              sx={{ 
                                color: theme.palette.primary.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteUserClick(user)}
                              sx={{ 
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              // Stations Table
              <TableContainer 
                component={Paper}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Box 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Charging Stations
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddStationOpen(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3,
                    }}
                  >
                    Add Station
                  </Button>
                </Box>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stations.map((station) => (
                      <TableRow 
                        key={station._id}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: theme.palette.success.main,
                              }}
                            >
                              <EvStationIcon />
                            </Avatar>
                            <Typography variant="body2">
                              {station.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {station.location?.address || 'No address'}
                          </Typography>
                          {station.location?.coordinates && (
                            <Typography variant="caption" color="text.secondary">
                              {`${station.location.coordinates[1].toFixed(6)}, ${station.location.coordinates[0].toFixed(6)}`}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={station.status || 'Active'}
                            size="small"
                            color={station.status === 'Active' ? 'success' : 'default'}
                            sx={{ 
                              borderRadius: 1,
                              textTransform: 'uppercase',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit station">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditClick(station)}
                              sx={{ 
                                color: theme.palette.primary.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete station">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteClick(station)}
                              sx={{ 
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </Fade>

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