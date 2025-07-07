import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    // Game progression
    level: {
      type: Number,
      default: 1,
    },
    experience: {
      type: Number,
      default: 0,
    },
    currency: {
      type: Number,
      default: 100,
    },
    // Stats
    power: {
      type: Number,
      default: 4,
    },
    will: {
      type: Number,
      default: 4,
    },
    craft: {
      type: Number,
      default: 4,
    },
    control: {
      type: Number,
      default: 4,
    },
    // Stat XP
    powerXP: {
      type: Number,
      default: 0,
    },
    willXP: {
      type: Number,
      default: 0,
    },
    craftXP: {
      type: Number,
      default: 0,
    },
    controlXP: {
      type: Number,
      default: 0,
    },
    // Game state
    currentRealm: {
      type: String,
      default: 'forest',
    },
    currentLocation: {
      type: String,
      default: 'home',
    },
    // Equipment
    weapon: {
      type: String,
      default: 'fists',
    },
    armor: {
      type: String,
      default: 'none',
    },
    // Deck and cards
    deck: [
      {
        suit: String,
        value: String,
        type: String,
      },
    ],
    artifacts: [
      {
        name: String,
        effect: String,
        description: String,
      },
    ],
    // Upgrades
    upgrades: {
      xpBonus: { type: Number, default: 0 },
      extraDraws: { type: Number, default: 0 },
      currencyBoost: { type: Number, default: 0 },
    },
    // Statistics
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    gamesWon: {
      type: Number,
      default: 0,
    },
    bossesDefeated: {
      type: Number,
      default: 0,
    },
    cardsCollected: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastPlayed: {
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

// Indexes
profileSchema.index({ userId: 1, profileName: 1 });
profileSchema.index({ userId: 1, lastPlayed: -1 });

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
