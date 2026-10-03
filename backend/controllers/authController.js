const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, role, name) =>
  jwt.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: '30d' });

/**
 * POST /api/auth/login
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const token = generateToken(user._id, user.role, user.name);
    res.json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('[AUTH LOGIN]', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * POST /api/auth/register
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'Email already exists. Please use a different email.' });
    }
    const user = await User.create({ name, email: email.toLowerCase().trim(), password, role: role || 'admin' });
    const token = generateToken(user._id, user.role, user.name);
    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('[AUTH REGISTER]', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * GET /api/auth/me  — returns current authenticated user
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('[AUTH ME]', error.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { loginUser, registerUser, getMe };