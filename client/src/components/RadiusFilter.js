import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const RADIUS_OPTIONS = [
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' }
];

const RadiusFilter = ({ radius, onRadiusChange }) => {
  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Search Radius</InputLabel>
        <Select
          value={radius}
          label="Search Radius"
          onChange={(e) => onRadiusChange(e.target.value)}
        >
          {RADIUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default RadiusFilter; 