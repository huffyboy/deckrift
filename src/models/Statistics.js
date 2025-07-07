import mongoose from 'mongoose';

const statisticsSchema = new mongoose.Schema(
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
    // Game performance
    totalGamesPlayed: {
      type: Number,
      default: 0,
    },
    totalGamesWon: {
      type: Number,
      default: 0,
    },
    totalGamesLost: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    // Combat statistics
    totalBattles: {
      type: Number,
      default: 0,
    },
    battlesWon: {
      type: Number,
      default: 0,
    },
    battlesLost: {
      type: Number,
      default: 0,
    },
    bossesDefeated: {
      type: Number,
      default: 0,
    },
    // Card statistics
    totalCardsDrawn: {
      type: Number,
      default: 0,
    },
    totalCardsPlayed: {
      type: Number,
      default: 0,
    },
    uniqueCardsCollected: {
      type: Number,
      default: 0,
    },
    // Progression statistics
    highestLevel: {
      type: Number,
      default: 1,
    },
    totalExperience: {
      type: Number,
      default: 0,
    },
    totalCurrency: {
      type: Number,
      default: 0,
    },
    // Realm statistics
    realmsCompleted: [
      {
        name: String,
        completedAt: Date,
        difficulty: String,
      },
    ],
    // Time statistics
    totalPlayTime: {
      type: Number,
      default: 0, // in minutes
    },
    averageGameTime: {
      type: Number,
      default: 0, // in minutes
    },
    longestGame: {
      type: Number,
      default: 0, // in minutes
    },
    // Achievement tracking
    achievements: [
      {
        name: String,
        description: String,
        unlockedAt: Date,
        category: String,
      },
    ],
    // Event statistics
    eventsEncountered: {
      bane: { type: Number, default: 0 },
      boon: { type: Number, default: 0 },
      rest: { type: Number, default: 0 },
      shop: { type: Number, default: 0 },
      challenge: { type: Number, default: 0 },
    },
    // Equipment statistics
    weaponsUsed: [
      {
        name: String,
        uses: Number,
        wins: Number,
      },
    ],
    armorUsed: [
      {
        name: String,
        uses: Number,
        damageBlocked: Number,
      },
    ],
    // Artifact statistics
    artifactsCollected: {
      type: Number,
      default: 0,
    },
    artifactsUsed: [
      {
        name: String,
        uses: Number,
        effect: String,
      },
    ],
    // Session tracking
    sessions: [
      {
        startTime: Date,
        endTime: Date,
        duration: Number, // in minutes
        events: Number,
        battles: Number,
        levelGained: Number,
      },
    ],
    // Last updated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
statisticsSchema.index({ userId: 1, profileId: 1 });
statisticsSchema.index({ totalGamesPlayed: -1 });
statisticsSchema.index({ winRate: -1 });
statisticsSchema.index({ highestLevel: -1 });

// Methods
statisticsSchema.methods.updateWinRate = function () {
  if (this.totalGamesPlayed > 0) {
    this.winRate = (this.totalGamesWon / this.totalGamesPlayed) * 100;
  }
  return this.winRate;
};

statisticsSchema.methods.addGameResult = function (won, duration = 0) {
  this.totalGamesPlayed++;
  if (won) {
    this.totalGamesWon++;
  } else {
    this.totalGamesLost++;
  }

  if (duration > 0) {
    this.totalPlayTime += duration;
    this.averageGameTime = this.totalPlayTime / this.totalGamesPlayed;
    if (duration > this.longestGame) {
      this.longestGame = duration;
    }
  }

  this.updateWinRate();
  this.lastUpdated = new Date();
};

const Statistics = mongoose.model('Statistics', statisticsSchema);

export default Statistics;
