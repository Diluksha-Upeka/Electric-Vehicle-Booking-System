import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';

const EditStation = ({ open, onClose, onUpdate, station }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    numberOfConnectors: '',
    ratePerHour: '',
    status: ''
  });

  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || '',
        description: station.description || '',
        numberOfConnectors: station.numberOfConnectors || '',
        ratePerHour: station.ratePerHour || '',
        status: station.status || 'active'
      });
    }
  }, [station]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(station._id, formData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
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
          Edit Charging Station
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ 
            pt: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5
          }}
        >
          <TextField
            label="Station Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
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
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Number of Connectors"
              name="numberOfConnectors"
              type="number"
              value={formData.numberOfConnectors}
              onChange={handleChange}
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
              label="Rate per Hour (LKR)"
              name="ratePerHour"
              type="number"
              value={formData.ratePerHour}
              onChange={handleChange}
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
            select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
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
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={onClose}
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
          onClick={handleSubmit}
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
          Update Station
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStation;