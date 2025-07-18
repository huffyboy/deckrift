import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Auth Controller
 * Handles user authentication and settings management
 */

// User registration endpoint
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.redirect('/register?error=All fields are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.redirect('/register?error=Username or email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;

    // Redirect to home realm on successful registration
    res.redirect('/home-realm');
  } catch (error) {
    res.redirect('/register?error=Registration failed');
  }
};

// User login endpoint
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.redirect('/login?error=Username and password are required');
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.redirect('/login?error=Invalid credentials');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.redirect('/login?error=Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;

    // Redirect to home realm on successful login
    res.redirect('/home-realm');
  } catch (error) {
    res.redirect('/login?error=Login failed');
  }
};

// User logout endpoint
export const logoutUser = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      // Redirect to home page after successful logout
      res.redirect('/');
    });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Get user settings endpoint
export const getUserSettings = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Check authentication status
export const checkAuth = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ authenticated: false });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Authentication check failed' });
  }
};

// Get user dashboard data
export const getDashboard = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId);

    res.json({
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// Update user settings
export const updateSettings = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { displayName, preferences } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user settings fields
    if (displayName !== undefined) user.displayName = displayName;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Settings saved successfully',
      user: {
        displayName: user.displayName,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
};

// Get user settings
export const getSettings = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      profile: {
        displayName: user.displayName || '',
        preferences: user.preferences || {
          autoSave: true,
          soundEnabled: true,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
};
