import express from 'express';
import SaveService from '../services/saveService.js';

import {
  getDeck,
  removeCardFromDeck,
  DECK_TYPES,
} from '../services/deckService.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

// Helper function to calculate challenge modifier
function calculateChallengeModifier(realm, level) {
  return Math.floor((realm - 1) * 4 + level);
}

// Helper function to generate shop items
function generateShopItems() {
  const weapons = [
    { id: 'sword', name: 'Sword', type: 'weapon', cost: 25 },
    { id: 'dagger', name: 'Dagger', type: 'weapon', cost: 30 },
    { id: 'bow', name: 'Bow', type: 'weapon', cost: 35 },
    { id: 'staff', name: 'Staff', type: 'weapon', cost: 30 },
    { id: 'hammer', name: 'Hammer', type: 'weapon', cost: 35 },
  ];

  const armors = [
    { id: 'light_armor', name: 'Light Armor', type: 'armor', cost: 25 },
    { id: 'medium_armor', name: 'Medium Armor', type: 'armor', cost: 30 },
    { id: 'heavy_armor', name: 'Heavy Armor', type: 'armor', cost: 35 },
  ];

  // Randomly select 3 items
  const allItems = [...weapons, ...armors];
  const selectedItems = [];
  const usedIndices = new Set();

  while (selectedItems.length < 3 && usedIndices.size < allItems.length) {
    const index = Math.floor(Math.random() * allItems.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      selectedItems.push(allItems[index]);
    }
  }

  return selectedItems;
}

// Helper function to get equipment details
function getEquipmentDetails(equipmentId) {
  const equipment = {
    sword: { id: 'sword', name: 'Sword', type: 'weapon', damage: 5 },
    dagger: { id: 'dagger', name: 'Dagger', type: 'weapon', damage: 3 },
    bow: { id: 'bow', name: 'Bow', type: 'weapon', damage: 4 },
    staff: { id: 'staff', name: 'Staff', type: 'weapon', damage: 3 },
    hammer: { id: 'hammer', name: 'Hammer', type: 'weapon', damage: 6 },
    light_armor: {
      id: 'light_armor',
      name: 'Light Armor',
      type: 'armor',
      defense: 2,
    },
    medium_armor: {
      id: 'medium_armor',
      name: 'Medium Armor',
      type: 'armor',
      defense: 4,
    },
    heavy_armor: {
      id: 'heavy_armor',
      name: 'Heavy Armor',
      type: 'armor',
      defense: 6,
    },
  };

  return equipment[equipmentId] || null;
}

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Shop page - Healing, item purchasing, card removal
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    // Get active game save
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.redirect('/home-realm');
    }

    const activeSave = saveResult.saveData;

    // Check if we're in a shop event
    if (
      !activeSave.runData.eventStatus.currentEvent ||
      activeSave.runData.eventStatus.currentEvent.type !== 'shop'
    ) {
      return res.redirect('/game');
    }

    // Calculate shop costs based on challenge modifier
    const challengeModifier = calculateChallengeModifier(
      activeSave.runData.location.realm,
      activeSave.runData.location.level
    );
    const shopCosts = {
      heal: 10 + challengeModifier,
      cardRemoval: 25 + challengeModifier,
      equipment: [
        25 + challengeModifier,
        30 + challengeModifier,
        35 + challengeModifier,
      ],
    };

    return res.render('shop', {
      title: 'Shop - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave ? { ...activeSave, isActive: true } : null,
      shopCosts,
      availableItems: generateShopItems(),
    });
  } catch (error) {
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load shop',
      error,
    });
  }
});

// API endpoint to purchase healing
router.post('/heal', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const activeSave = saveResult.saveData;

    const healCost =
      10 +
      calculateChallengeModifier(
        activeSave.runData.location.realm,
        activeSave.runData.location.level
      );
    const healAmount = 10;

    // Check if player has enough currency
    if (activeSave.runData.runCurrency < healCost) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient currency',
        required: healCost,
        current: activeSave.runData.runCurrency,
      });
    }

    // Deduct currency and heal
    activeSave.runData.runCurrency -= healCost;
    activeSave.gameData.health = Math.min(
      activeSave.gameData.health + healAmount,
      activeSave.gameData.maxHealth
    );

    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      message: `Healed for ${healAmount} health`,
      newHealth: activeSave.gameData.health,
      newCurrency: activeSave.runData.runCurrency,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to purchase healing' });
  }
});

// API endpoint to purchase equipment
router.post('/equipment', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { equipmentId, cost } = req.body;

    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const activeSave = saveResult.saveData;

    // Check if player can afford it
    if (activeSave.runData.runCurrency < cost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Get equipment details
    const equipment = getEquipmentDetails(equipmentId);
    if (!equipment) {
      return res.status(400).json({ error: 'Invalid equipment' });
    }

    // Purchase equipment
    activeSave.runData.runCurrency -= cost;
    if (!activeSave.runData.equipment) activeSave.runData.equipment = [];
    activeSave.runData.equipment.push({
      type: equipment.type,
      value: equipment.value,
    });

    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      newCurrency: activeSave.runData.runCurrency,
      equipment,
      message: `Purchased ${equipment.name}`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to purchase equipment' });
  }
});

// API endpoint to remove a card
router.post('/remove-card', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const { cardIndex } = req.body;

    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const activeSave = saveResult.saveData;

    const cardRemovalCost =
      25 +
      calculateChallengeModifier(
        activeSave.runData.location.realm,
        activeSave.runData.location.level
      );

    // Check if player can afford it
    if (activeSave.runData.runCurrency < cardRemovalCost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Check if card exists and remove it using deck service
    const currentDeck = getDeck(activeSave, DECK_TYPES.PLAYER_MAIN);

    if (cardIndex >= currentDeck.length) {
      return res.status(400).json({ error: 'Invalid card index' });
    }

    const cardToRemove = currentDeck[cardIndex];

    // Remove the card from the player's deck
    const updatedSave = removeCardFromDeck(
      activeSave,
      DECK_TYPES.PLAYER_MAIN,
      cardToRemove
    );

    if (!updatedSave.removedCard) {
      return res.status(400).json({ error: 'Card not found in deck' });
    }

    // Update the save data
    Object.assign(activeSave, updatedSave);
    activeSave.runData.runCurrency -= cardRemovalCost;
    await saveService.updateSave(userId, activeSave);

    return res.json({
      success: true,
      newCurrency: activeSave.runData.runCurrency,
      removedCard: updatedSave.removedCard,
      message: `Removed ${updatedSave.removedCard.value} of ${updatedSave.removedCard.suit}`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove card' });
  }
});

// API endpoint to leave shop
router.post('/leave', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;
    const saveResult = await saveService.loadSave(userId);
    if (!saveResult.success) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const activeSave = saveResult.saveData;

    // Clear shop event
    if (
      activeSave.runData.eventStatus.currentEvent &&
      activeSave.runData.eventStatus.currentEvent.type === 'shop'
    ) {
      activeSave.runData.eventStatus.currentEvent = null;
      await saveService.updateSave(userId, activeSave);
    }

    return res.json({
      success: true,
      redirect: '/game',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to leave shop' });
  }
});

export default router;
