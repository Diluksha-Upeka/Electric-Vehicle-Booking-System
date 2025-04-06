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
  Upgrade as UpgradeIcon,
  PersonOff as PersonOffIcon,
  Build as BuildIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import AddStation from '../components/AddStation';
import EditStation from '../components/EditStation';

const StatCard = ({ title, value, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        minWidth: 200,
        maxWidth: 200,
        height: 120,
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
        }
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
          <Avatar 
            sx={{ 
              bgcolor: alpha(color, 0.1),
              color: color,
              width: 32,
              height: 32,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
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
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteUserData, setPromoteUserData] = useState(null);

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
      
      // Ensure all required fields are present and status is properly formatted
      const updatedStationData = {
        ...stationData,
        status: stationData.status?.toLowerCase() || 'active', // Ensure status is lowercase
        openingTime: stationData.openingTime || '08:00 AM',
        closingTime: stationData.closingTime || '08:00 PM'
      };

      console.log('Updating station with data:', updatedStationData);
      
      const response = await axios.put(`http://localhost:5000/api/stations/${stationId}`, updatedStationData, { headers });
      
      console.log('Update response:', response.data);
      
      // Update the stations state with the new data
      setStations(prevStations => 
        prevStations.map(station => 
          station._id === stationId ? response.data : station
        )
      );
      
      setEditStationOpen(false);
      setSelectedStation(null);
    } catch (error) {
      console.error('Error updating station:', error.response?.data || error);
      setError(error.response?.data?.message || 'Failed to update station');
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
      
      // Construct the full name from firstName and lastName
      const name = `${userData.firstName} ${userData.lastName}`.trim();
      
      // Prepare the update data
      const updatedUserData = {
        name,
        email: userData.email,
        role: userData.role.toUpperCase(),
        vehicleDetails: userData.vehicleDetails || {},
        chargingPreferences: userData.chargingPreferences || {}
      };
      
      await axios.put(`http://localhost:5000/api/auth/users/${userId}`, updatedUserData, { headers });
      fetchData(); // Refresh the users list
      setEditUserOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
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

  const handlePromoteUser = async (userId, currentRole) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const newRole = currentRole === 'USER' ? 'ADMIN' : 'USER';
      const updatedUserData = {
        role: newRole
      };
      
      await axios.put(`http://localhost:5000/api/auth/users/${userId}`, updatedUserData, { headers });
      fetchData(); // Refresh the users list
      setPromoteDialogOpen(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handlePromoteClick = (user) => {
    setPromoteUserData(user);
    setPromoteDialogOpen(true);
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
    // Split the name into first and last name for the form
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setEditUserData({
      firstName,
      lastName,
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
    <Box sx={{ p: 3, pt: 9 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 600,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
          letterSpacing: '-0.5px'
        }}>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, letterSpacing: '0.3px' }}>
          Manage stations, users, and bookings
        </Typography>
      </Box>

      <Fade in timeout={500}>
        <Grid container spacing={3}>
          {/* Welcome Section */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, letterSpacing: '-0.5px' }}>
                    Welcome back, Admin
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ letterSpacing: '0.3px', mb: 3 }}>
                    Here's what's happening with your EV charging network
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    gap: 2,
                    mt: 2
                  }}>
                    <Paper sx={{ 
                      p: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      borderRadius: 2,
                      width: '200px',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
                        <Typography variant="subtitle2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                          Network Status
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {Math.round((stations.filter(station => station.status === 'active').length / stations.length) * 100)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stations Active
                      </Typography>
                    </Paper>

                    <Paper sx={{ 
                      p: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 2,
                      width: '200px',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EvStationIcon sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="subtitle2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                          Total Capacity
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {stations.reduce((total, station) => total + (station.numberOfConnectors || 0), 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Available Connectors
                      </Typography>
                    </Paper>
                  </Box>
                </Box>

                {/* Stats Cards */}
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  alignItems: 'flex-end'
                }}>
                  {/* Users Group */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <StatCard
                      title="Total Users"
                      value={users.length}
                      icon={<PeopleIcon />}
                      color={theme.palette.primary.main}
                    />
                    <StatCard
                      title="Admin Users"
                      value={users.filter(user => user.role === 'ADMIN').length}
                      icon={<AdminIcon />}
                      color={theme.palette.warning.main}
                    />
                    <StatCard
                      title="Regular Users"
                      value={users.filter(user => user.role === 'USER').length}
                      icon={<PersonIcon />}
                      color={theme.palette.info.main}
                    />
                  </Box>

                  {/* Stations Group */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <StatCard
                      title="Total Stations"
                      value={stations.length}
                      icon={<EvStationIcon />}
                      color={theme.palette.success.main}
                    />
                    <StatCard
                      title="Active Stations"
                      value={stations.filter(station => station.status === 'active').length}
                      icon={<SpeedIcon />}
                      color={theme.palette.success.main}
                    />
                    <StatCard
                      title="Maintenance"
                      value={stations.filter(station => station.status === 'maintenance').length}
                      icon={<BuildIcon />}
                      color={theme.palette.warning.main}
                    />
                    <StatCard
                      title="Inactive Stations"
                      value={stations.filter(station => station.status === 'inactive').length}
                      icon={<PauseIcon />}
                      color={theme.palette.error.main}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Tabs */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                }
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
                    letterSpacing: '0.3px',
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                    }
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
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
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
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Role</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Actions</TableCell>
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
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                }
                              }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Typography variant="body2" sx={{ letterSpacing: '0.3px' }}>
                              {user.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ letterSpacing: '0.3px' }}>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role}
                            size="small"
                            color={user.role === 'ADMIN' ? 'warning' : 'default'}
                            sx={{ 
                              borderRadius: 1,
                              textTransform: 'uppercase',
                              fontWeight: 500,
                              letterSpacing: '0.3px',
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
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.3s ease-in-out',
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.role === 'USER' ? "Promote to Admin" : "Demote to User"}>
                            <IconButton 
                              size="small" 
                              onClick={() => handlePromoteClick(user)}
                              color={user.role === 'USER' ? 'success' : 'warning'}
                              sx={{
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                }
                              }}
                            >
                              {user.role === 'USER' ? <UpgradeIcon /> : <PersonOffIcon />}
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
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.3s ease-in-out',
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
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                  }
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
                  <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>
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
                      letterSpacing: '0.3px',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    Add Station
                  </Button>
                </Box>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Rate/Hour (LKR)</TableCell>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Connectors</TableCell>
                      <TableCell sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, letterSpacing: '0.3px' }}>Actions</TableCell>
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
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                }
                              }}
                            >
                              <EvStationIcon />
                            </Avatar>
                            <Typography variant="body2" sx={{ letterSpacing: '0.3px' }}>
                              {station.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ letterSpacing: '0.3px' }}>{station.description}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ letterSpacing: '0.3px' }}>
                            {station.location?.address || 'No address'}
                          </Typography>
                          {station.location?.coordinates && (
                            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.3px' }}>
                              {`${station.location.coordinates[1].toFixed(6)}, ${station.location.coordinates[0].toFixed(6)}`}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ letterSpacing: '0.3px' }}>
                            {station.ratePerHour || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ letterSpacing: '0.3px' }}>
                            {station.numberOfConnectors || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box 
                            sx={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.5,
                              px: 1.5,
                              borderRadius: '20px',
                              background: station.status === 'active' 
                                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`
                                : station.status === 'maintenance'
                                ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(theme.palette.error.light, 0.05)} 100%)`,
                              border: station.status === 'active'
                                ? `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                                : station.status === 'maintenance'
                                ? `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                                : `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                              transition: 'all 0.3s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: station.status === 'active'
                                  ? `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`
                                  : station.status === 'maintenance'
                                  ? `0 4px 12px ${alpha(theme.palette.warning.main, 0.2)}`
                                  : `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
                              }
                            }}
                          >
                            <Box 
                              sx={{ 
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: station.status === 'active'
                                  ? theme.palette.success.main
                                  : station.status === 'maintenance'
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                                boxShadow: station.status === 'active'
                                  ? `0 0 8px ${alpha(theme.palette.success.main, 0.6)}`
                                  : station.status === 'maintenance'
                                  ? `0 0 8px ${alpha(theme.palette.warning.main, 0.6)}`
                                  : `0 0 8px ${alpha(theme.palette.error.main, 0.6)}`,
                              }} 
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                color: station.status === 'active'
                                  ? theme.palette.success.main
                                  : station.status === 'maintenance'
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main
                              }}
                            >
                              {station.status || 'Active'}
                            </Typography>
                          </Box>
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
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.3s ease-in-out',
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
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.3s ease-in-out',
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
      <Dialog 
        open={editUserOpen} 
        onClose={() => setEditUserOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ 
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            Edit User Profile
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            pt: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2.5 
          }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                name="firstName"
                value={editUserData.firstName}
                onChange={handleEditUserChange}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.background.paper, 1),
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }
                }}
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={editUserData.lastName}
                onChange={handleEditUserChange}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.background.paper, 1),
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }
                  }
                }}
              />
            </Box>
            <TextField
              label="Email Address"
              name="email"
              value={editUserData.email}
              onChange={handleEditUserChange}
              fullWidth
              required
              type="email"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  },
                  '&.Mui-focused': {
                    backgroundColor: alpha(theme.palette.background.paper, 1),
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                }
              }}
            />
            <TextField
              select
              label="User Role"
              name="role"
              value={editUserData.role}
              onChange={handleEditUserChange}
              fullWidth
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  },
                  '&.Mui-focused': {
                    backgroundColor: alpha(theme.palette.background.paper, 1),
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                }
              }}
            >
              <MenuItem value="USER">Regular User</MenuItem>
              <MenuItem value="ADMIN">Administrator</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setEditUserOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.divider, 0.1),
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleEditUser(selectedUser._id, editUserData)}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Update Profile
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

      {/* Promote/Demote User Dialog */}
      <Dialog
        open={promoteDialogOpen}
        onClose={() => setPromoteDialogOpen(false)}
      >
        <DialogTitle>
          {promoteUserData?.role === 'USER' ? 'Promote to Admin' : 'Demote to User'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {promoteUserData?.role === 'USER' ? 'promote' : 'demote'} {promoteUserData?.name}?
            {promoteUserData?.role === 'USER' 
              ? ' This user will gain admin privileges.'
              : ' This user will lose admin privileges.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handlePromoteUser(promoteUserData._id, promoteUserData.role)}
            color={promoteUserData?.role === 'USER' ? 'success' : 'warning'}
            variant="contained"
          >
            {promoteUserData?.role === 'USER' ? 'Promote' : 'Demote'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 