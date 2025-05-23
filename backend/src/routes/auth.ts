import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User';

const router = express.Router();

// Check if email exists (for real-time validation)
const checkEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.params;
  
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? 'A user already exists with this email, if this is you, Sign In' : 'Email available'
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({ error: 'Unable to check email' });
  }
});

// Check if username exists (for real-time validation)
const checkUsernameHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;
  
  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  try {
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    res.json({ 
      exists: !!existingUser,
      message: existingUser ? 'A user already exists with this username, if this is you, Sign In' : 'Username available'
    });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Unable to check username' });
  }
});

// Registration route
const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // Validate input format
  if (!username || !email || !password) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  // Validate email format
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address' });
    return;
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    return;
  }

  // Validate password strength
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long' });
    return;
  }

  try {
    // Check for existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(409).json({ 
        error: 'A user already exists with this email, if this is you, Sign In',
        field: 'email',
        action: 'signin'
      });
      return;
    }

    // Check for existing username
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      res.status(409).json({ 
        error: 'A user already exists with this username, if this is you, Sign In',
        field: 'username',
        action: 'signin'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create and save user
    const newUser = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser._id.toString() },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id.toString(),
        userId: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login route
const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input format
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  if (typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid password format' });
    return;
  }

  try {
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      res.status(404).json({ 
        error: 'Email address doesn\'t exist, create Account',
        field: 'email',
        action: 'register'
      });
      return;
    }

    // Validate password existence
    if (!user.password) {
      console.error('User exists but has no password:', email);
      res.status(500).json({ error: 'Account configuration error. Please contact support.' });
      return;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ 
        error: 'Incorrect password. Please try again.',
        field: 'password'
      });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Logout route (optional - mainly for clearing server-side sessions if needed)
const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  // For JWT-based auth, logout is mainly handled client-side by removing the token
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

// Routes
router.get('/check-email/:email', checkEmailHandler);
router.get('/check-username/:username', checkUsernameHandler);
router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);

export default router;
