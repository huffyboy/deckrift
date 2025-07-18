import express from 'express';
import SaveService from '../services/saveService.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

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

// Battle page
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    // Get active game save
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.redirect('/home-realm');
    }

    const activeSave = saveResult.saveData;

    // Check if we're in a battle
    if (!activeSave.runData.fightStatus.inBattle) {
      return res.redirect('/game');
    }

    return res.render('battle', {
      title: 'Battle - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave,
      battle: activeSave.runData.fightStatus,
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
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
    const { enemyStats } = req.body;

    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const activeSave = saveResult.saveData;

    // Create battle state
    const battle = {
      inBattle: true,
      enemyStats: enemyStats,
      enemyHealth: enemyStats.hp || 10,
      enemyMaxHealth: enemyStats.maxHp || 10,
      playerHand: [],
      enemyHand: [],
      turn: 'player',
    };

    // Update game save with battle
    activeSave.runData.fightStatus = battle;
    await saveService.updateSave(userId, activeSave);

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

    const saveResult = await saveService.loadSave(userId);
    if (
      !saveResult.success ||
      !saveResult.saveData.runData.fightStatus.inBattle
    ) {
      return res.status(404).json({ error: 'No active battle found' });
    }

    const activeSave = saveResult.saveData;
    const battle = activeSave.runData.fightStatus;

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
    activeSave.runData.fightStatus = battle;
    await saveService.updateSave(userId, activeSave);

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

    const saveResult = await saveService.loadSave(userId);
    if (
      !saveResult.success ||
      !saveResult.saveData.runData.fightStatus.inBattle
    ) {
      return res.status(404).json({ error: 'No active battle found' });
    }

    const activeSave = saveResult.saveData;

    // Clear battle state
    activeSave.runData.fightStatus.inBattle = false;

    // Apply rewards if victory
    if (result === 'victory' && rewards) {
      if (rewards.xp) {
        Object.keys(rewards.xp).forEach((stat) => {
          activeSave.gameData.statXP[stat] =
            (activeSave.gameData.statXP[stat] || 0) + rewards.xp[stat];
        });
      }
      if (rewards.currency) {
        activeSave.gameData.currency =
          (activeSave.gameData.currency || 0) + rewards.currency;
      }
      if (rewards.cards) {
        activeSave.runData.fightStatus.playerDeck = [
          ...(activeSave.runData.fightStatus.playerDeck || []),
          ...rewards.cards,
        ];
      }
    }

    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to end battle' });
  }
});

export default router;
