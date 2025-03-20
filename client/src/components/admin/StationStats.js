import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import adminService from '../../services/adminService';

const StationStats = ({ stationId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStationStats(stationId);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch station statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [stationId]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!stats) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Total Bookings
            </Typography>
            <Typography variant="h4" color="primary">
              {stats.totalBookings}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Active Bookings
            </Typography>
            <Typography variant="h4" color="success.main">
              {stats.activeBookings}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Completed Bookings
            </Typography>
            <Typography variant="h4" color="info.main">
              {stats.completedBookings}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Utilization Rate
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.utilizationRate}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body1" color="text.secondary">
                {stats.utilizationRate.toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationStats; 