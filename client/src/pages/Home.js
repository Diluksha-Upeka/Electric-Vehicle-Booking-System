import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Box, 
  useTheme, 
  useMediaQuery, 
  Grow,
  alpha,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  LocationOn, 
  AccessTime, 
  BatteryChargingFull, 
  DirectionsCar, 
  KeyboardArrowDown, 
  ElectricCar, 
  ArrowForward,
  Bolt,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Home.css';
import heroImage from '../assets/2.webp';
import ctaImage from '../assets/3.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    { 
      icon: <LocationOn sx={{ fontSize: 40 }} />, 
      title: 'Smart Location', 
      desc: 'Find the nearest charging stations with real-time availability updates.',
      color: '#2ecc71',
      gradient: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
    },
    { 
      icon: <AccessTime sx={{ fontSize: 40 }} />, 
      title: 'Instant Booking', 
      desc: 'Reserve your spot in seconds with our streamlined booking process.',
      color: '#3498db',
      gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
    },
    { 
      icon: <BatteryChargingFull sx={{ fontSize: 40 }} />, 
      title: 'Charging Analytics', 
      desc: 'Track your charging history and optimize your energy consumption.',
      color: '#e74c3c',
      gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
    },
    { 
      icon: <DirectionsCar sx={{ fontSize: 40 }} />, 
      title: 'Fleet Management', 
      desc: 'Efficiently manage multiple vehicles with our advanced dashboard.',
      color: '#9b59b6',
      gradient: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'
    },
  ];

  const scrollToFeatures = () => {
    document.querySelector('.features-section').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box className="hero-section">
        <div className="hero-overlay" />
        <Container className="hero-content">
          <Typography 
            variant="h1" 
            className="hero-title"
          >
            Go the Extra Mile with Smarter Charging,<br />Drive Further ⚡
          </Typography>
          <Typography 
            variant="h5" 
            className="hero-subtitle"
          >
            Experience the future of EV charging with our intelligent booking system.
            Seamless, sustainable, and always available.
          </Typography>
          <Button
            variant="contained"
            className="hero-button"
            onClick={() => navigate(user ? '/user-dashboard' : '/register')}
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Button>
          <Box 
            sx={{ 
              mt: 6, 
              cursor: 'pointer',
              animation: 'bounce 2s infinite',
              display: { xs: 'none', md: 'block' }
            }}
            onClick={scrollToFeatures}
          >
            <KeyboardArrowDown sx={{ fontSize: 40, color: 'white' }} />
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box className="features-section">
        <Container maxWidth="lg" className="features-container">
          <Box sx={{ position: 'relative', mb: 8 }}>
            <Typography 
              variant="h2" 
              className="section-title"
            >
              Smart Features for Smart Charging
            </Typography>
            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                color: '#666',
                mt: 3,
                maxWidth: '800px',
                mx: 'auto',
                animation: 'fadeIn 1s ease-out 0.3s forwards',
                opacity: 0
              }}
            >
              Experience the next generation of EV charging with our intelligent features
              designed to make your charging experience seamless and efficient.
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Grow in timeout={500 * (index + 1)}>
                  <Card 
                    className="feature-card"
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <CardContent>
                      <div className="feature-icon-wrapper">
                        <div 
                          className="feature-icon"
                          style={{
                            background: hoveredFeature === index 
                              ? `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}20 100%)`
                              : undefined
                          }}
                        >
                          {feature.icon}
                        </div>
                      </div>
                      <Typography variant="h6" className="feature-title">
                        {feature.title}
                      </Typography>
                      <Typography className="feature-desc">
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>

          <Box 
            sx={{ 
              mt: 8, 
              textAlign: 'center',
              animation: 'fadeIn 1s ease-out 1s forwards',
              opacity: 0
            }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/features')}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: theme.shadows[4]
              }}
            >
              Explore All Features
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box className="cta-section">
        <div className="cta-overlay" />
        <Container className="cta-content">
          <Typography 
            variant="h2" 
            className="cta-title"
          >
            Join the EV Revolution 🌱
          </Typography>
          <Typography 
            variant="h6" 
            className="cta-subtitle"
          >
            Be part of the sustainable future. Our network of charging stations
            is growing every day, making electric mobility more accessible than ever.
          </Typography>
          <Button
            variant="contained"
            className="cta-button"
            onClick={() => navigate(user ? '/user-dashboard' : '/register')}
          >
            {user ? 'View Charging Stations' : 'Start Your Journey'}
          </Button>
        </Container>
      </Box>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </Box>
  );
};

export default Home;
