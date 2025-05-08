import React, { useState, useEffect } from 'react';
import {
  Grid,
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
  Alert,
  useTheme,
  alpha
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
  const theme = useTheme();
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar
          sx={{ 
            width: 48,
            height: 48,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            fontSize: '1.5rem',
            mr: 2,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {user?.name}
              </Typography>
              <Chip
            icon={<EmailIcon sx={{ fontSize: 16 }} />}
                label={user?.email}
                size="small"
            sx={{ mt: 0.5 }}
              />
            </Box>
            {!isEditing && (
              <Tooltip title="Edit Profile">
                <IconButton 
                  onClick={() => setIsEditing(true)}
              size="small"
                >
              <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                size="small"
                    label="First Name"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                size="small"
                    label="Last Name"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                size="small"
                    label="Email"
                    value={profileData.email}
                    disabled
                    InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Vehicle Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                size="small"
                label="Make"
                    name="vehicleDetails.make"
                    value={profileData.vehicleDetails.make}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                  startAdornment: <CarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                size="small"
                label="Model"
                    name="vehicleDetails.model"
                    value={profileData.vehicleDetails.model}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                size="small"
                    label="Year"
                    name="vehicleDetails.year"
                    value={profileData.vehicleDetails.year}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                size="small"
                label="Battery Capacity"
                    name="vehicleDetails.batteryCapacity"
                    value={profileData.vehicleDetails.batteryCapacity}
                    onChange={handleChange}
                    disabled={!isEditing}
                    InputProps={{
                  startAdornment: <BatteryIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {isEditing && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button
            size="small"
            startIcon={<CancelIcon />}
                onClick={handleCancel}
            disabled={loading}
              >
                Cancel
              </Button>
              <Button
            size="small"
                variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
          >
            Save Changes
              </Button>
            </Box>
          )}

      <Snackbar 
        open={!!error || success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || 'Profile updated successfully!'}
          </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileSection; 