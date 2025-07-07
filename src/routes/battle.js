import express from 'express';
import GameSave from '../models/GameSave.js';

const router = express.Router();

// Helper functions for battle logic
function processAttack(battle, _cardIndex, _target) {
  // Battle logic implementation
  // This would contain the actual combat mechanics
  return {
    ...battle,
    round: battle.round + 1,
    battleLog: [...battle.battleLog, 'Attack processed'],
  };
}

function processDefend(battle, _cardIndex) {
  // Defense logic implementation
  return {
    ...battle,
    round: battle.round + 1,
    battleLog: [...battle.battleLog, 'Defense processed'],
  };
}

function processWeaponSwitch(battle, weaponId) {
  // Weapon switching logic
  return {
    ...battle,
    currentWeapon: weaponId,
    battleLog: [...battle.battleLog, `Switched to ${weaponId}`],
  };
}

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  return next();
};

// Battle page
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get active game save
    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.redirect('/home-realm');
    }

    // Check if we're in a battle
    if (!activeSave.currentBattle) {
      return res.redirect('/game');
    }

    return res.render('battle', {
      title: 'Battle - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave,
      battle: activeSave.currentBattle,
    });
  } catch (error) {
    return res.status(500).render('error', {
      title: 'Error - Deckrift',
      message: 'Failed to load battle',
      error,
    });
  }
});

// API endpoint to start a battle
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { enemyType, enemyStats } = req.body;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Create battle state
    const battle = {
      enemy: {
        type: enemyType,
        stats: enemyStats,
        health: enemyStats.hp || 10,
        maxHealth: enemyStats.maxHp || 10,
      },
      round: 1,
      playerHand: [],
      enemyHand: [],
      battleLog: [],
      status: 'active',
    };

    // Update game save with battle
    activeSave.currentBattle = battle;
    await activeSave.save();

    return res.json({
      success: true,
      battle,
      redirect: '/battle',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start battle' });
  }
});

// API endpoint to make a move in battle
router.post('/move', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { action, cardIndex, target } = req.body;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave || !activeSave.currentBattle) {
      return res.status(404).json({ error: 'No active battle found' });
    }

    const battle = activeSave.currentBattle;

    // Process the move based on action type
    let result;
    switch (action) {
      case 'attack':
        result = processAttack(battle, cardIndex, target);
        break;
      case 'defend':
        result = processDefend(battle, cardIndex);
        break;
      case 'switch_weapon':
        result = processWeaponSwitch(battle, target);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Update battle state
    Object.assign(battle, result);
    activeSave.currentBattle = battle;
    await activeSave.save();

    return res.json({
      success: true,
      battle,
      result,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process move' });
  }
});

// API endpoint to end battle
router.post('/end', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { result, rewards } = req.body;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave || !activeSave.currentBattle) {
      return res.status(404).json({ error: 'No active battle found' });
    }

    // Clear battle state
    activeSave.currentBattle = null;

    // Apply rewards if victory
    if (result === 'victory' && rewards) {
      if (rewards.xp) {
        Object.keys(rewards.xp).forEach((stat) => {
          activeSave.statXP[stat] =
            (activeSave.statXP[stat] || 0) + rewards.xp[stat];
        });
      }
      if (rewards.currency) {
        activeSave.currency = (activeSave.currency || 0) + rewards.currency;
      }
      if (rewards.cards) {
        activeSave.deck = [...(activeSave.deck || []), ...rewards.cards];
      }
    }

    await activeSave.save();

    return res.json({
      success: true,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to end battle' });
  }
});

export default router;
