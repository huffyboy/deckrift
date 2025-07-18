import express from 'express';
import SaveService from '../services/saveService.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

// Helper functions for event logic
function generateBoon() {
  // Generate a random boon
  return {
    type: 'stat_boost',
    stat: 'power',
    value: 1,
  };
}

function generateBane() {
  // Generate a random bane
  return {
    type: 'stat_loss',
    stat: 'power',
    value: 1,
  };
}

function applyBoonEffect(_choice, _gameSave) {
  // Apply boon effect to game save
  return {
    success: true,
    message: 'Boon applied successfully',
  };
}

function applyBaneEffect(_effect, _gameSave) {
  // Apply bane effect to game save
  return {
    success: true,
    message: 'Bane applied successfully',
  };
}

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Event page - Challenge, Boon, or Bane resolution
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    // Get active game save
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.redirect('/home-realm');
    }

    const activeSave = saveResult.saveData;

    // Check if we're in an event
    if (!activeSave.runData.eventStatus.currentEvent) {
      return res.redirect('/game');
    }

    return res.render('event', {
      title: 'Event - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave ? { ...activeSave, isActive: true } : null,
      event: activeSave.runData.eventStatus.currentEvent,
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load event',
      error,
    });
  }
});

// API endpoint to start an event
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { eventType, eventData } = req.body;

    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const activeSave = saveResult.saveData;

    // Create event state
    const event = {
      type: eventType,
      data: eventData,
      status: 'active',
      choices: [],
      result: null,
    };

    // Set up event-specific data
    switch (eventType) {
      case 'challenge':
        event.challenge = {
          stat: eventData.stat,
          difficulty: eventData.difficulty,
          target: eventData.target,
        };
        break;
      case 'boon':
        event.boon = {
          card: eventData.card,
          options: eventData.options,
        };
        break;
      case 'bane':
        event.bane = {
          card: eventData.card,
          effect: eventData.effect,
        };
        break;
      case 'rest':
        event.rest = {
          healAmount: eventData.healAmount,
        };
        break;
      case 'shop':
        event.shop = {
          items: eventData.items,
          costs: eventData.costs,
        };
        break;
      default:
        // Handle unknown event types
        break;
    }

    // Update game save with event
    activeSave.runData.eventStatus.currentEvent = event;
    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      event,
      redirect: '/event',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start event' });
  }
});

// API endpoint to resolve a challenge
router.post('/challenge', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { cardValue, statValue } = req.body;

    const saveResult = await saveService.loadSave(userId);
    if (
      !saveResult.success ||
      !saveResult.saveData.runData.eventStatus.currentEvent
    ) {
      return res.status(404).json({ error: 'No active event found' });
    }

    const activeSave = saveResult.saveData;
    const event = activeSave.runData.eventStatus.currentEvent;

    if (event.type !== 'challenge') {
      return res.status(400).json({ error: 'Not a challenge event' });
    }

    // Calculate challenge result
    const totalValue = cardValue + statValue;
    const success = totalValue >= event.challenge.target;

    // Apply result
    if (success) {
      // Gain XP in the challenged stat
      const { stat } = event.challenge;
      activeSave.gameData.statXP[stat] =
        (activeSave.gameData.statXP[stat] || 0) + cardValue;

      // Gain a boon
      event.result = {
        type: 'success',
        xpGained: cardValue,
        boon: generateBoon(),
      };
    } else {
      // Gain a bane
      event.result = {
        type: 'failure',
        bane: generateBane(),
      };
    }

    event.status = 'completed';
    activeSave.runData.eventStatus.currentEvent = event;
    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      result: event.result,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resolve challenge' });
  }
});

// API endpoint to select a boon
router.post('/boon', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { choice } = req.body;

    const saveResult = await saveService.loadSave(userId);
    if (
      !saveResult.success ||
      !saveResult.saveData.runData.eventStatus.currentEvent
    ) {
      return res.status(404).json({ error: 'No active event found' });
    }

    const activeSave = saveResult.saveData;
    const event = activeSave.runData.eventStatus.currentEvent;

    if (event.type !== 'boon') {
      return res.status(400).json({ error: 'Not a boon event' });
    }

    // Apply boon effect
    const boonEffect = applyBoonEffect(choice, activeSave);

    event.result = {
      type: 'boon',
      choice,
      effect: boonEffect,
    };
    event.status = 'completed';

    activeSave.runData.eventStatus.currentEvent = event;
    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      result: event.result,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to select boon' });
  }
});

// API endpoint to apply a bane
router.post('/bane', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const saveResult = await saveService.loadSave(userId);
    if (
      !saveResult.success ||
      !saveResult.saveData.runData.eventStatus.currentEvent
    ) {
      return res.status(404).json({ error: 'No active event found' });
    }

    const activeSave = saveResult.saveData;
    const event = activeSave.runData.eventStatus.currentEvent;

    if (event.type !== 'bane') {
      return res.status(400).json({ error: 'Not a bane event' });
    }

    // Apply bane effect
    const baneEffect = applyBaneEffect(event.bane.effect, activeSave);

    event.result = {
      type: 'bane',
      effect: baneEffect,
    };
    event.status = 'completed';

    activeSave.runData.eventStatus.currentEvent = event;
    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      result: event.result,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to apply bane' });
  }
});

export default router;
