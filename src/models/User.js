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
    currency: {
      type: Number,
      default: 0,
    },
    // Indicates which save slot is currently active for this user
    // Since users can have multiple save slots, only one should be active at a time
    activeSaveSlot: {
      type: Number,
      default: 1,
      min: 1,
      max: 10, // Allow up to 10 save slots
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
