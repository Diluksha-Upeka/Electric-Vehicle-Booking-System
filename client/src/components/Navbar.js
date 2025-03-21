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
import styles from './Navbar.module.css';
import logo from '../assets/4.png';

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
    <AppBar position="static" className={styles.navbar}>
      <Toolbar className={styles.toolbar}>
        <RouterLink to="/" className={styles.brand}>
          <img src={logo} alt="EVCONNECT Logo" className={styles.brandLogo} />
        </RouterLink>

        {user ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" className={styles.userName}>
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
                <Avatar className={styles.avatar}>
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
                  className: styles.menuPaper
                }}
              >
                {user.role === 'admin' ? (
                  <MenuItem
                    component={RouterLink}
                    to="/admin-dashboard"
                    onClick={handleClose}
                    className={styles.menuItem}
                  >
                    Admin Dashboard
                  </MenuItem>
                ) : (
                  <MenuItem
                    component={RouterLink}
                    to="/user-dashboard"
                    onClick={handleClose}
                    className={styles.menuItem}
                  >
                    Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} className={styles.menuItem}>Logout</MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Box>
            <Button
              component={RouterLink}
              to="/login"
              className={styles.authButton}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              className={styles.authButtonRegister}
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