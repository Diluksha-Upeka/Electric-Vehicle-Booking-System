import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Person,
  ElectricCar,
} from '@mui/icons-material';
import styles from './Register.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all required fields
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      };
      console.log('Sending registration data:', { ...userData, password: '[REDACTED]' });
      await register(userData);
      
      // Add a small delay before navigation to ensure the auth state is updated
      setTimeout(() => {
        navigate('/user-dashboard');
      }, 100);
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={styles.root}>
      <Container maxWidth="sm">
        <Fade in timeout={1000}>
          <Paper 
            elevation={0}
            sx={{
              p: 4,
              mt: 8,
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <ElectricCar 
                sx={{ 
                  fontSize: 48, 
                  color: '#2ecc71',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }} 
              />
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  mt: 2,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Create Account
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ mt: 1 }}
              >
                Join our eco-friendly charging community
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#1a5f7a' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#1a5f7a' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#1a5f7a' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#1a5f7a' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#1a5f7a' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a5f7a 20%, #2ecc71 120%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Button
                  onClick={() => navigate('/login')}
                  sx={{
                    color: '#1a5f7a',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'transparent',
                      color: '#2ecc71',
                    },
                  }}
                >
                  Login here
                </Button>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Register; 