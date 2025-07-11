import mongoose from 'mongoose';

const gameSaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
    },
    saveName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Game progression
    realm: {
      type: Number,
      required: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    playerPosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    // Map data
    map: {
      type: [[mongoose.Schema.Types.Mixed]],
      default: [],
    },
    // Current screen/state
    currentScreen: {
      type: String,
      default: 'overworld',
      enum: ['overworld', 'battle', 'event', 'shop', 'game-over'],
    },
    // Current event (if in event screen)
    currentEvent: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Player stats
    stats: {
      power: { type: Number, default: 4 },
      will: { type: Number, default: 4 },
      craft: { type: Number, default: 4 },
      control: { type: Number, default: 4 },
    },
    statXP: {
      power: { type: Number, default: 0 },
      will: { type: Number, default: 0 },
      craft: { type: Number, default: 0 },
      control: { type: Number, default: 0 },
    },
    // Equipment
    equipment: {
      weapon: { type: String, default: 'sword' },
      armor: { type: String, default: 'light' },
    },
    // Health and currency
    health: {
      type: Number,
      default: 100,
    },
    maxHealth: {
      type: Number,
      default: 100,
    },
    currency: {
      type: Number,
      default: 0,
    },
    // Deck and artifacts
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
    // Game state (for backward compatibility)
    gameState: {
      currentScreen: {
        type: String,
        default: 'home',
      },
      overworldMap: [
        {
          suit: String,
          value: String,
          type: String,
          position: {
            x: Number,
            y: Number,
          },
          visited: {
            type: Boolean,
            default: false,
          },
        },
      ],
      currentPosition: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
      },
    },
    // Battle state
    battleState: {
      inBattle: {
        type: Boolean,
        default: false,
      },
      enemy: {
        name: String,
        health: Number,
        maxHealth: Number,
        attack: Number,
        defense: Number,
        abilities: [String],
      },
      playerHand: [
        {
          suit: String,
          value: String,
          type: String,
        },
      ],
      turn: {
        type: String,
        enum: ['player', 'enemy'],
        default: 'player',
      },
    },
    // Event tracking
    events: [
      {
        type: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    // Save metadata
    version: {
      type: String,
      default: '1.0.0',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastSaved: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
gameSaveSchema.index({ userId: 1, profileId: 1 });
gameSaveSchema.index({ userId: 1, isActive: 1 });
gameSaveSchema.index({ lastSaved: -1 });

const GameSave = mongoose.model('GameSave', gameSaveSchema);

export default GameSave;
