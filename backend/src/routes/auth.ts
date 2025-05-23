import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User';

const router = express.Router();

// Registration route
const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // Validate input format
  if (!username || !email || !password) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  // Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ error: 'Email already registered' });
    return;
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create and save user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser._id.toString() },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      userId: newUser._id.toString(),
      username: newUser.username
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login route
const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input format
  if (!email || !password || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid email or password format' });
    return;
  }

  try {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Validate password existence
    if (!user.password) {
      console.error('User exists but has no password:', email);
      res.status(500).json({ error: 'Account configuration error' });
      return;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      userId: user._id.toString(),
      username: user.username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', registerHandler);
router.post('/login', loginHandler);

export default router;
