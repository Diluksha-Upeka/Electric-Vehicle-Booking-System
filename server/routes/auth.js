const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Middleware: Authenticate JWT and log user status
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("🔴 User is NOT logged in - No token provided");
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log("🔴 User authentication failed - User not found");
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`🟢 User is logged in: ${user.email} (Role: ${user.role})`);
    req.user = user;
    next();
  } catch (error) {
    console.log("🔴 Invalid token - Authentication failed");
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware: Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log("🔴 Access Denied - User not authenticated");
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`🔴 Access Denied - Insufficient permissions for ${req.user.role}`);
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    console.log(`🟢 Access Granted - ${req.user.email} (Role: ${req.user.role})`);
    next();
  };
};

// Register route
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const fullName = `${firstName} ${lastName}`; 

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("🔴 Registration failed - User already exists");
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with default 'user' role
    user = new User({ name: fullName, email, password: hashedPassword, role: 'USER' });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

    console.log(`🟢 User registered: ${email}`);
    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    console.error("🔴 Registration error:", error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("🔴 Login failed - Invalid credentials");
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("🔴 Login failed - Invalid password");
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

    console.log(`🟢 User logged in: ${email}`);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    console.error("🔴 Login error:", error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get current user profile
router.get('/profile', authenticateJWT, (req, res) => {
  res.json(req.user);
});

// Update user profile
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { firstName, lastName, email, vehicleDetails, chargingPreferences } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, email, vehicleDetails, chargingPreferences },
      { new: true }
    ).select('-password');

    console.log(`🟢 Profile updated: ${req.user.email}`);
    res.json(updatedUser);
  } catch (error) {
    console.error("🔴 Error updating profile:", error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Admin: Get all users
router.get('/users', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    console.log("🟢 Admin accessed user list");
    res.json(users);
  } catch (error) {
    console.error("🔴 Error fetching users:", error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Admin: Update user
router.put('/users/:userId', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, role, vehicleDetails, chargingPreferences } = req.body;

    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { firstName, lastName, email, role, vehicleDetails, chargingPreferences },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.log("🔴 User update failed - User not found");
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`🟢 User updated by admin: ${updatedUser.email}`);
    res.json(updatedUser);
  } catch (error) {
    console.error("🔴 Error updating user:", error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Admin: Delete user
router.delete('/users/:userId', authenticateJWT, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      console.log("🔴 User deletion failed - User not found");
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`🟢 User deleted by admin: ${user.email}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("🔴 Error deleting user:", error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = { router, authenticateJWT, authorize };
