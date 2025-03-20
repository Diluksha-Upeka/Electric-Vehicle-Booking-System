import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Grid, Card, CardContent, Box } from '@mui/material';
import { LocationOn, AccessTime, BatteryChargingFull, DirectionsCar } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Home.css';
import heroImage from '../assets/2.webp';
import ctaImage from '../assets/3.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    { icon: <LocationOn sx={{ fontSize: 40 }} />, title: 'Find Stations', desc: 'Locate EV charging stations near you instantly.' },
    { icon: <AccessTime sx={{ fontSize: 40 }} />, title: 'Quick Booking', desc: 'Reserve your charging slot with just a few clicks.' },
    { icon: <BatteryChargingFull sx={{ fontSize: 40 }} />, title: 'Smart Charging', desc: 'Calculate battery needs and optimize charge time.' },
    { icon: <DirectionsCar sx={{ fontSize: 40 }} />, title: 'Vehicle Management', desc: 'Manage your EV details and history in one place.' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box className="hero-section">
        <div className="hero-overlay"></div>
        <Container className="hero-content">
          <Typography 
            variant="h1" 
            className="hero-title"
            sx={{ 
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(45deg, #ffffff 30%, #e0e0e0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Power Up Your Journey ⚡
          </Typography>
          <Typography 
            variant="h5" 
            className="hero-subtitle"
            sx={{ 
              maxWidth: '600px', 
              mx: 'auto', 
              mb: 4,
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            Discover, book, and charge your electric vehicle seamlessly.
          </Typography>
          <Button
            className="hero-button"
            onClick={() => navigate('/admin-dashboard')}
          >
            Find Charging Stations
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container className="features-section">
        <Typography 
          variant="h2" 
          className="section-title"
          sx={{ 
            fontWeight: 700, 
            mb: 6,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #1a5f7a 30%, #2ecc71 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Why Choose Us?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card className="feature-card">
                <CardContent>
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <Typography variant="h6" className="feature-title">
                    {feature.title}
                  </Typography>
                  <Typography className="feature-desc">
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box className="cta-section">
        <div className="cta-overlay"></div>
        <Container className="cta-content">
          <Typography 
            variant="h2" 
            className="cta-title"
            sx={{ 
              fontWeight: 700, 
              mb: 3,
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Ready to Go Green? 🌱
          </Typography>
          <Typography 
            variant="h6" 
            className="cta-subtitle"
            sx={{ 
              maxWidth: '600px', 
              mx: 'auto', 
              mb: 4,
              color: 'rgba(255, 255, 255, 0.9)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            Join the EV revolution today and make a sustainable impact.
          </Typography>
          <Button
            className="cta-button"
            onClick={() => navigate('/admin-dashboard')}
          >
            {user ? 'Find Stations' : 'Get Started'}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
