const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    // Convert both the user's role and required roles to uppercase for comparison
    const userRole = req.user.role.toUpperCase();
    const requiredRoles = roles.map(role => role.toUpperCase());
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Create initial admin user (only works if no admin exists)
router.post('/create-admin', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      return res.status(403).json({ message: 'Admin user already exists' });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          firstName: !firstName ? 'First name is required' : null,
          lastName: !lastName ? 'Last name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    user = new User({
      name: `${firstName} ${lastName}`.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'ADMIN'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role.toUpperCase() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ 
      message: 'Error creating admin user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Log the incoming request (excluding password)
    console.log('Registration request received:', { firstName, lastName, email, role, password: '[REDACTED]' });

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      console.error('Missing required fields:', { firstName, lastName, email, hasPassword: !!password });
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          firstName: !firstName ? 'First name is required' : null,
          lastName: !lastName ? 'Last name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name: `${firstName} ${lastName}`.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER'
    });

    console.log('Attempting to save user:', { 
      name: user.name, 
      email: user.email, 
      role: user.role,
      hasPassword: !!user.password,
      firstName,
      lastName
    });

    try {
      await user.save();
      console.log('User saved successfully');
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      if (saveError.code === 11000) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      throw saveError;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role.toUpperCase() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role.toUpperCase() },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    try {
      const userData = await User.findById(decoded.id).select('-password');
      if (!userData) {
        return res.status(404).json({ message: 'User not found' });
      }
      req.user = userData;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
};

// Get current user profile
router.get('/profile', authenticateJWT, (req, res) => {
  res.json(req.user);
});

// Update user profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { firstName, lastName, vehicleDetails } = req.body;
    
    // Construct the full name
    const name = `${firstName} ${lastName}`.trim();
    
    // Update user with the new data
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        name,
        vehicleDetails
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin routes
// Get all users (admin only)
router.get('/users', authenticateJWT, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user (admin only)
router.put('/users/:userId', authenticateJWT, authorize('ADMIN'), async (req, res) => {
  try {
    const { firstName, lastName, email, role, vehicleDetails, chargingPreferences } = req.body;
    
    // If only role is being updated, skip other validations
    if (Object.keys(req.body).length === 1 && role) {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        { role: role.toUpperCase() },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(updatedUser);
    }

    // Validate required fields for full updates
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          firstName: !firstName ? 'First name is required' : null,
          lastName: !lastName ? 'Last name is required' : null,
          email: !email ? 'Email is required' : null
        }
      });
    }

    // Validate role if provided
    if (role && !['USER', 'ADMIN'].includes(role.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.userId } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already taken' });
    }

    // Construct the full name
    const name = `${firstName} ${lastName}`.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { 
        name,
        email: email.toLowerCase().trim(),
        role: role ? role.toUpperCase() : undefined,
        vehicleDetails,
        chargingPreferences
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ 
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateJWT, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Delete user by email (development only)
router.delete('/delete-user/:email', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'This endpoint is not available in production' });
    }

    const user = await User.findOneAndDelete({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = { router, authenticateJWT, authorize }; 