import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  MenuItem,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const connectorTypes = ['Type 1', 'Type 2', 'CCS', 'CHAdeMO', 'Tesla'];

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    vehicleDetails: {
      make: user?.vehicleDetails?.make || '',
      model: user?.vehicleDetails?.model || '',
      year: user?.vehicleDetails?.year || '',
      batteryCapacity: user?.vehicleDetails?.batteryCapacity || '',
      maxChargingPower: user?.vehicleDetails?.maxChargingPower || '',
    },
    chargingPreferences: {
      preferredConnectorType: user?.chargingPreferences?.preferredConnectorType || '',
      preferredPowerOutput: user?.chargingPreferences?.preferredPowerOutput || '',
      preferredTimeSlot: {
        start: user?.chargingPreferences?.preferredTimeSlot?.start || '',
        end: user?.chargingPreferences?.preferredTimeSlot?.end || '',
      },
    },
  });

  const handleChange = (section, field, value) => {
    if (section === 'timeSlot') {
      setFormData((prev) => ({
        ...prev,
        chargingPreferences: {
          ...prev.chargingPreferences,
          preferredTimeSlot: {
            ...prev.chargingPreferences.preferredTimeSlot,
            [field]: value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Profile Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your vehicle details and charging preferences
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Vehicle Details Section */}
          <Typography variant="h6" gutterBottom>
            Vehicle Details
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Make"
                value={formData.vehicleDetails.make}
                onChange={(e) => handleChange('vehicleDetails', 'make', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.vehicleDetails.model}
                onChange={(e) => handleChange('vehicleDetails', 'model', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={formData.vehicleDetails.year}
                onChange={(e) => handleChange('vehicleDetails', 'year', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Battery Capacity (kWh)"
                type="number"
                value={formData.vehicleDetails.batteryCapacity}
                onChange={(e) => handleChange('vehicleDetails', 'batteryCapacity', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Charging Power (kW)"
                type="number"
                value={formData.vehicleDetails.maxChargingPower}
                onChange={(e) => handleChange('vehicleDetails', 'maxChargingPower', e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Charging Preferences Section */}
          <Typography variant="h6" gutterBottom>
            Charging Preferences
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Preferred Connector Type"
                value={formData.chargingPreferences.preferredConnectorType}
                onChange={(e) => handleChange('chargingPreferences', 'preferredConnectorType', e.target.value)}
              >
                {connectorTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Power Output (kW)"
                type="number"
                value={formData.chargingPreferences.preferredPowerOutput}
                onChange={(e) => handleChange('chargingPreferences', 'preferredPowerOutput', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Start Time"
                type="time"
                value={formData.chargingPreferences.preferredTimeSlot.start}
                onChange={(e) => handleChange('timeSlot', 'start', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred End Time"
                type="time"
                value={formData.chargingPreferences.preferredTimeSlot.end}
                onChange={(e) => handleChange('timeSlot', 'end', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
            >
              Save Changes
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile; 