import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Features from './pages/Features';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a5f7a',
      light: '#2ecc71',
      dark: '#27ae60',
    },
    secondary: {
      main: '#2ecc71',
      light: '#a5d6a7',
      dark: '#27ae60',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1a5f7a 0%, #2ecc71 100%)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '25px',
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
          },
        },
      },
    },
  },
});

// Role-based route component
const RoleBasedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} />;
  }

  if (requiredRole && user.role.toUpperCase() !== requiredRole.toUpperCase()) {
    return <Navigate to={user.role.toUpperCase() === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }

  return children;
};

// Separate component for routes that need auth context
const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/admin-dashboard"
        element={
          <RoleBasedRoute requiredRole="admin">
            <AdminDashboard />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/user-dashboard"
        element={
          <RoleBasedRoute requiredRole="user">
            <UserDashboard />
          </RoleBasedRoute>
        }
      />
      <Route path="/features" element={<Features />} />
    </Routes>
  );
};

// Main App component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
