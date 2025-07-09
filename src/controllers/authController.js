import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Statistics from '../models/Statistics.js';
import GameSave from '../models/GameSave.js';

/**
 * Auth Controller
 * Handles user authentication and profile management
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

    // Create default profile
    const profile = new Profile({
      userId: user._id,
      profileName: 'Default Profile',
    });

    await profile.save();

    // Create statistics record
    const statistics = new Statistics({
      userId: user._id,
      profileId: profile._id,
    });

    await statistics.save();

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

// Get user profile endpoint
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's profiles
    const profiles = await Profile.find({ userId }).sort({ lastPlayed: -1 });

    // Get statistics
    const statistics = await Statistics.find({ userId });

    res.json({
      user,
      profiles,
      statistics,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
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

    const user = await User.findById(userId).populate('profile');
    const gameSaves = await GameSave.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5);
    const stats = await Statistics.findOne({ userId });

    res.json({
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      profile: user.profile || {},
      recentSaves: gameSaves,
      statistics: stats || {},
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.session;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { displayName, bio, preferences } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user profile fields
    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        displayName: user.displayName,
        bio: user.bio,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
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
        bio: user.bio || '',
        preferences: user.preferences || {
          autoSave: true,
          soundEnabled: true,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
};
