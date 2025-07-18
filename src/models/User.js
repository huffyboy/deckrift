import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    // Profile information
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    preferences: {
      autoSave: {
        type: Boolean,
        default: true,
      },
      soundEnabled: {
        type: Boolean,
        default: true,
      },
    },
    // Game statistics
    totalRuns: {
      type: Number,
      default: 0,
    },
    bestScore: {
      type: Number,
      default: 0,
    },
    totalPlaytime: {
      type: Number,
      default: 0, // in minutes
    },
    currency: {
      type: Number,
      default: 0,
    },
    // Upgrades
    upgrades: [
      {
        type: String,
      },
    ],
    // Realm completion tracking
    completedRealms: {
      type: [Number],
      default: [],
    },
    unlockedRealms: {
      type: [Number],
      default: [1], // Start with first realm unlocked
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Remove duplicate index calls - unique: true already creates indexes
// userSchema.index({ username: 1 });
// userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;
