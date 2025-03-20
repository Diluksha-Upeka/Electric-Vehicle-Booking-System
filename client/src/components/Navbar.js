import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
    handleClose();
  };

  return (
    <AppBar position="static" className="app-bar">
      <Toolbar className="toolbar">
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          className="brand"
        >
          EVCONNECT
        </Typography>

        {user ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" className="user-name">
                {user.firstName} {user.lastName}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar className="avatar">
                  <AccountCircle />
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  className: 'menu-paper'
                }}
              >
                {user.role === 'admin' ? (
                  <MenuItem
                    component={RouterLink}
                    to="/admin-dashboard"
                    onClick={handleClose}
                    className="menu-item"
                  >
                    Admin Dashboard
                  </MenuItem>
                ) : (
                  <MenuItem
                    component={RouterLink}
                    to="/user-dashboard"
                    onClick={handleClose}
                    className="menu-item"
                  >
                    Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} className="menu-item">Logout</MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Box>
            <Button
              component={RouterLink}
              to="/login"
              className="auth-button"
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              className="auth-button"
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 