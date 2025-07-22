import mongoose from 'mongoose';

const saveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    saveName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    saveSlot: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    // New save system structure - Run Data (Temporary/Session)
    runData: {
      version: { type: String, required: true },
      timestamp: { type: Number, required: true },
      map: {
        tiles: [
          {
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            visited: { type: Boolean, default: false },
            revealed: { type: Boolean, default: false },
            suit: {
              type: String,
              enum: ['hearts', 'diamonds', 'clubs', 'spades', 'joker'],
              required: true,
            },
            value: {
              type: String,
              enum: [
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                '10',
                'J',
                'Q',
                'K',
                'A',
                '𝕁',
              ],
              required: true,
            },
            type: {
              type: String,
              enum: ['standard', 'joker', 'player-start', 'unknown'],
              default: 'standard',
            },
          },
        ],
        width: { type: Number, required: true },
        height: { type: Number, required: true },
      },
      location: {
        realm: { type: Number, required: true, min: 1, max: 4 },
        level: { type: Number, required: true, min: 1 },
        mapX: { type: Number, required: true, min: 0 },
        mapY: { type: Number, required: true, min: 0 },
      },
      fightStatus: {
        inBattle: { type: Boolean, default: false },
        playerHand: [{ type: mongoose.Schema.Types.Mixed }],
        playerDeck: [{ type: mongoose.Schema.Types.Mixed }], // Cards remaining to draw
        playerDiscard: [{ type: mongoose.Schema.Types.Mixed }], // Cards played/discarded
        enemyHand: [{ type: mongoose.Schema.Types.Mixed }],
        enemyDeck: [{ type: mongoose.Schema.Types.Mixed }],
        enemyDiscard: [{ type: mongoose.Schema.Types.Mixed }], // Enemy cards played/discarded
        enemyStats: { type: mongoose.Schema.Types.Mixed, default: {} },
        enemyHealth: { type: Number, default: 0 },
        enemyMaxHealth: { type: Number, default: 0 },
        turn: { type: String, enum: ['player', 'enemy'], default: 'player' },
      },
      eventStatus: {
        currentEvent: { type: mongoose.Schema.Types.Mixed, default: null },
        drawnCards: [{ type: mongoose.Schema.Types.Mixed }],
        eventStep: { type: Number, default: 0 },
        eventPhase: { type: String, default: 'start' },
      },
      statModifiers: {
        power: { type: Number, default: 0 },
        will: { type: Number, default: 0 },
        craft: { type: Number, default: 0 },
        focus: { type: Number, default: 0 },
      },
      equipment: [
        {
          type: {
            type: String,
            enum: ['weapon', 'armor', 'artifact'],
            required: true,
          },
          value: { type: String, required: true },
        },
      ],
      playerDeck: [{ type: mongoose.Schema.Types.Mixed }], // All cards player owns for this run
      runCurrency: { type: Number, required: true, min: 0, default: 0 }, // Currency earned during this run
      activeEffects: [{ type: String }], // List of active effect strings (e.g., 'xpBoost', 'currencyBoost')
      health: { type: Number, required: true, min: 0 }, // Current health during this run
      maxHealth: { type: Number, required: true, min: 1 }, // Max health during this run (can change due to artifacts)
    },

    // New save system structure - Game Data (Persistent)
    gameData: {
      version: { type: String, required: true },
      timestamp: { type: Number, required: true },
      saveCurrency: { type: Number, required: true, min: 0, default: 0 }, // Currency outside of runs
      stats: {
        power: { type: Number, required: true, min: 1 },
        will: { type: Number, required: true, min: 1 },
        craft: { type: Number, required: true, min: 1 },
        focus: { type: Number, required: true, min: 1 },
      },
      statXP: {
        power: { type: Number, required: true, min: 0 },
        will: { type: Number, required: true, min: 0 },
        craft: { type: Number, required: true, min: 0 },
        focus: { type: Number, required: true, min: 0 },
      },
      // Per-save upgrades and realm progress
      upgrades: [{ type: String }],
      unlockedEquipment: [{ type: String }],
      completedRealms: { type: [Number], default: [] },
      unlockedRealms: { type: [Number], default: [1] }, // Start with first realm unlocked
    },

    // Metadata
    metadata: {
      totalPlayTime: { type: Number, default: 0 },
      lastPlayed: { type: Date, default: Date.now },
      lastSelectedEquipment: {
        weapon: { type: String, default: null },
        armor: { type: String, default: null },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
saveSchema.index({ userId: 1, saveSlot: 1 }, { unique: true }); // Ensure one save per slot per user
saveSchema.index({ lastPlayed: -1 });
saveSchema.index({ 'runData.location.realm': 1, 'runData.location.level': 1 });

// Methods
saveSchema.methods.updateLastPlayed = function () {
  this.metadata.lastPlayed = new Date();
  return this.save();
};

saveSchema.methods.addPlayTime = function (minutes) {
  this.metadata.totalPlayTime += minutes;
  return this.save();
};

saveSchema.methods.markCompleted = function () {
  this.isActive = false;
  this.metadata.lastPlayed = new Date();
  return this.save();
};

const Save = mongoose.model('Save', saveSchema);

export default Save;
