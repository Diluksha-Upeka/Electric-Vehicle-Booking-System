import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  alpha,
  Button,
  IconButton,
  Tooltip,
  Fade,
  Paper,
  useMediaQuery,
  Stack,
  Chip
} from '@mui/material';
import {
  LocationOn,
  AccessTime,
  Payment,
  Speed,
  Security,
  Support,
  ArrowForward,
  ElectricCar,
  ChargingStation,
  CalendarToday,
  Notifications,
  Analytics,
  Person,
  Bolt,
  TrendingUp,
  Timeline,
  Eco
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ title, description, icon, image, delay, index }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Fade in timeout={1000} style={{ transitionDelay: `${delay}ms` }}>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: 'none',
          borderRadius: 4,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.2)}`,
            '& .MuiCardMedia-root': {
              transform: 'scale(1.05)'
            },
            '& .feature-icon': {
              transform: 'scale(1.1) rotate(5deg)',
              backgroundColor: theme.palette.primary.main
            }
          }
        }}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="240"
            image={image}
            alt={title}
            sx={{
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              objectFit: 'cover'
            }}
          />
          <Box
            className="feature-icon"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: alpha(theme.palette.primary.main, 0.9),
              color: 'white',
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            {icon}
          </Box>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: `linear-gradient(to top, ${alpha(theme.palette.background.paper, 0.9)}, transparent)`,
              display: 'flex',
              alignItems: 'flex-end',
              p: 3
            }}
          >
            <Typography variant="h5" component="h2" sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              textShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.2)}`
            }}>
              {title}
            </Typography>
          </Box>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ 
            lineHeight: 1.7,
            mb: 2
          }}>
            {description}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip 
              icon={<Bolt />} 
              label="EV Ready" 
              size="small" 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '& .MuiChip-icon': { color: theme.palette.primary.main }
              }}
            />
            <Chip 
              icon={<TrendingUp />} 
              label="Smart" 
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                '& .MuiChip-icon': { color: theme.palette.secondary.main }
              }}
            />
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );
};

const Features = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      title: 'Smart Station Locator',
      description: 'Find the nearest charging stations with real-time availability and detailed information about each location.',
      icon: <LocationOn />,
      image: '/images/features/station-locator.webp'
    },
    {
      title: 'Easy Booking System',
      description: 'Book your charging slot in advance with our intuitive booking system. Choose your preferred time slot and get instant confirmation.',
      icon: <CalendarToday />,
      image: '/images/features/booking-system.webp'
    },
    {
      title: 'Advanced Analytics',
      description: 'Track your charging patterns, energy consumption, and cost analysis with our comprehensive analytics dashboard.',
      icon: <Analytics />,
      image: '/images/features/analytics.webp'
    },
    {
      title: 'Fleet Management',
      description: 'Efficiently manage your electric vehicle fleet with dedicated tools for scheduling, monitoring, and optimizing charging operations.',
      icon: <ElectricCar />,
      image: '/images/features/fleet-management.webp'
    },
    {
      title: 'Fast Charging',
      description: 'Experience rapid charging capabilities with our high-power charging stations, minimizing your waiting time.',
      icon: <Speed />,
      image: '/images/features/fast-charging.webp'
    },
    {
      title: 'Eco-Friendly Solutions',
      description: 'Join our sustainable initiative with green energy charging options and carbon footprint tracking.',
      icon: <ChargingStation />,
      image: '/images/features/eco-friendly.webp'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: alpha(theme.palette.background.default, 0.8),
      pt: { xs: 6, md: 12 },
      pb: { xs: 6, md: 12 },
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.1)}, transparent 50%),
                    radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.main, 0.1)}, transparent 50%)`,
        zIndex: 0
      }
    }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          textAlign: 'center', 
          mb: { xs: 6, md: 10 },
          maxWidth: '800px',
          mx: 'auto'
        }}>
          <Typography
            variant={isMobile ? 'h3' : 'h2'}
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              backgroundClip: 'text',
              textFillColor: 'transparent',
              mb: 3
            }}
          >
            Discover Our Features
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              maxWidth: '800px', 
              mx: 'auto',
              lineHeight: 1.7
            }}
          >
            Experience the future of electric vehicle charging with our comprehensive suite of features designed to make your charging experience seamless and efficient.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={feature.title} xs={12} sm={6} md={4}>
              <FeatureCard
                {...feature}
                delay={index * 100}
                index={index}
              />
            </Grid>
          ))}
        </Grid>

        <Fade in timeout={1000} style={{ transitionDelay: '600ms' }}>
          <Box sx={{ 
            textAlign: 'center', 
            mt: { xs: 8, md: 12 },
            p: { xs: 3, md: 6 },
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
              Join thousands of EV owners who are already enjoying our seamless charging experience.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              sx={{
                borderRadius: 2,
                px: 6,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
                }
              }}
            >
              Create Your Account
            </Button>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Features; 