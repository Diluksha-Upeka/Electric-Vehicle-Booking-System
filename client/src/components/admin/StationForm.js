import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

const StationForm = ({ station, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    openingTime: '08:00 AM',
    closingTime: '08:00 PM',
    totalChargers: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || '',
        location: station.location || '',
        openingTime: '08:00 AM',
        closingTime: '08:00 PM',
        totalChargers: station.totalChargers || '',
        status: station.status || 'Active'
      });
    }
  }, [station]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.totalChargers) newErrors.totalChargers = 'Number of chargers is required';
    else if (formData.totalChargers < 1) newErrors.totalChargers = 'Must have at least 1 charger';
    else if (formData.totalChargers > 50) newErrors.totalChargers = 'Maximum 50 chargers allowed';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTimeChange = (name, value) => {
    if (value) {
      const formattedTime = value.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setFormData(prev => ({
        ...prev,
        [name]: formattedTime
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Station Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={!!errors.location}
            helperText={errors.location}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Operating Hours: 8:00 AM - 8:00 PM (Fixed)
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Opening Time"
            value="08:00 AM"
            disabled
            helperText="Fixed operating hours"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Closing Time"
            value="08:00 PM"
            disabled
            helperText="Fixed operating hours"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Chargers"
            name="totalChargers"
            type="number"
            value={formData.totalChargers}
            onChange={handleChange}
            error={!!errors.totalChargers}
            helperText={errors.totalChargers}
            required
            inputProps={{ min: 1, max: 50 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {station ? 'Update' : 'Create'} Station
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationForm; 