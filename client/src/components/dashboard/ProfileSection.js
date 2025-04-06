import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DirectionsCar as CarIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  BatteryChargingFull as BatteryIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const ProfileSection = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    vehicleDetails: {
      make: '',
      model: '',
      year: '',
      batteryCapacity: ''
    }
  });

  useEffect(() => {
    if (user) {
      // Split the name into firstName and lastName
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfileData({
        firstName,
        lastName,
        email: user.email,
        vehicleDetails: user.vehicleDetails || {
          make: '',
          model: '',
          year: '',
          batteryCapacity: ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Format the data to match what the server expects
      const updateData = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        vehicleDetails: {
          make: profileData.vehicleDetails.make.trim(),
          model: profileData.vehicleDetails.model.trim(),
          year: profileData.vehicleDetails.year.trim(),
          batteryCapacity: profileData.vehicleDetails.batteryCapacity.trim()
        }
      };

      await updateProfile(updateData);
      
      // Update the local state to match the new data
      setProfileData(prev => ({
        ...prev,
        ...updateData
      }));
      
      setSuccess(true);
      setIsEditing(false);
      
      // Force a re-render of the component
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original user data
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setProfileData({
      firstName,
      lastName,
      email: user.email,
      vehicleDetails: user.vehicleDetails || {
        make: '',
        model: '',
        year: '',
        batteryCapacity: ''
      }
    });
    setIsEditing(false);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                fontSize: '2.5rem',
                mr: 3,
                boxShadow: '0 4px 12px rgba(26, 95, 122, 0.2)',
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {user?.name}
              </Typography>
              <Chip
                icon={<EmailIcon />}
                label={user?.email}
                sx={{
                  background: 'linear-gradient(135deg, rgba(26, 95, 122, 0.1) 0%, rgba(46, 204, 113, 0.1) 100%)',
                  color: '#1a5f7a',
                  border: '1px solid rgba(26, 95, 122, 0.2)',
                  '& .MuiChip-icon': {
                    color: '#1a5f7a',
                  },
                }}
                variant="outlined"
                size="small"
              />
            </Box>
            {!isEditing && (
              <Tooltip title="Edit Profile">
                <IconButton 
                  onClick={() => setIsEditing(true)}
                  sx={{ 
                    color: '#1a5f7a',
                    '&:hover': { 
                      color: '#2ecc71',
                      background: 'rgba(26, 95, 122, 0.1)',
                    }
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Divider sx={{ 
            my: 3,
            background: 'linear-gradient(90deg, transparent, rgba(26, 95, 122, 0.2), transparent)',
            height: '1px',
          }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <PersonIcon sx={{ color: '#1a5f7a', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <PersonIcon sx={{ color: '#1a5f7a', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileData.email}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <EmailIcon sx={{ color: '#1a5f7a', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Vehicle Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Make"
                    name="vehicleDetails.make"
                    value={profileData.vehicleDetails.make}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <CarIcon sx={{ color: '#1a5f7a', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vehicle Model"
                    name="vehicleDetails.model"
                    value={profileData.vehicleDetails.model}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <CarIcon sx={{ color: '#1a5f7a', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year"
                    name="vehicleDetails.year"
                    value={profileData.vehicleDetails.year}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <CarIcon sx={{ color: '#1a5f7a', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Battery Capacity (kWh)"
                    name="vehicleDetails.batteryCapacity"
                    value={profileData.vehicleDetails.batteryCapacity}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <BatteryIcon sx={{ color: '#1a5f7a', mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {isEditing && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CancelIcon />}
                sx={{
                  color: '#1a5f7a',
                  borderColor: '#1a5f7a',
                  '&:hover': {
                    borderColor: '#2ecc71',
                    color: '#2ecc71',
                    background: 'rgba(26, 95, 122, 0.1)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a5f7a 20%, #2ecc71 120%)',
                    boxShadow: '0 4px 12px rgba(26, 95, 122, 0.3)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                  },
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>

      <Snackbar 
        open={!!error || success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {error ? (
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        ) : (
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            Profile updated successfully!
          </Alert>
        )}
      </Snackbar>
    </Grid>
  );
};

export default ProfileSection; 