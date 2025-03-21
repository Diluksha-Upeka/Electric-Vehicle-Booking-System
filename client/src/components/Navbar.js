import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  Slide,
  useScrollTrigger,
  Divider,
} from '@mui/material';
import {
  AccountCircle,
  KeyboardArrowDown,
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Person,
  Settings,
  History,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';
import logo from '../assets/4.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const trigger = useScrollTrigger({
    threshold: 100,
    disableHysteresis: true,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
    handleClose();
    setMobileMenuOpen(false);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          background: isScrolled 
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: isScrolled 
            ? '1px solid rgba(0, 0, 0, 0.05)'
            : 'none',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: '64px !important',
            px: { xs: 2, sm: 4 },
            justifyContent: 'space-between',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
            onClick={() => navigate('/')}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px',
              }}
            >
              EVCONNECT
            </Typography>
          </Box>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                edge="end"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                sx={{
                  color: isScrolled ? 'text.primary' : 'white',
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={mobileMenuOpen}
                open={Boolean(mobileMenuOpen)}
                onClose={() => setMobileMenuOpen(false)}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: '12px',
                    minWidth: 200,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                {user ? (
                  <>
                    <MenuItem onClick={() => {
                      handleClose();
                      navigate(user?.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
                    }}>
                      <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => {
                      handleClose();
                      navigate('/user-dashboard?tab=1');
                    }}>
                      <History sx={{ mr: 1 }} /> My Bookings
                    </MenuItem>
                    <MenuItem onClick={() => {
                      handleClose();
                      navigate('/user-dashboard?tab=2');
                    }}>
                      <Person sx={{ mr: 1 }} /> Profile
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => {
                      handleClose();
                      handleLogout();
                    }}>
                      <LogoutIcon sx={{ mr: 1 }} /> Logout
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => navigate('/login')}>
                      Login
                    </MenuItem>
                    <MenuItem onClick={() => navigate('/register')}>
                      Register
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {user ? (
                <>
                  <IconButton
                    onClick={handleMenu}
                    sx={{
                      p: 0,
                      '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s ease-in-out',
                      },
                    }}
                  >
                    <Avatar
                      src={user.photoURL}
                      alt={user.displayName}
                      sx={{
                        width: 40,
                        height: 40,
                        border: '2px solid transparent',
                        background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
                        backgroundClip: 'padding-box',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {user.displayName?.[0] || <AccountCircle />}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        borderRadius: '12px',
                        minWidth: 200,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <MenuItem onClick={() => {
                      handleClose();
                      navigate(user?.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
                    }}>
                      <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => {
                      handleClose();
                      navigate('/user-dashboard?tab=1');
                    }}>
                      <History sx={{ mr: 1 }} /> My Bookings
                    </MenuItem>
                    <MenuItem onClick={() => {
                      handleClose();
                      navigate('/user-dashboard?tab=2');
                    }}>
                      <Person sx={{ mr: 1 }} /> Profile
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => {
                      handleClose();
                      handleLogout();
                    }}>
                      <LogoutIcon sx={{ mr: 1 }} /> Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/login')}
                    sx={{
                      color: isScrolled ? 'text.primary' : 'white',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/register')}
                    sx={{
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
                    Register
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </Slide>
  );
};

export default Navbar; 