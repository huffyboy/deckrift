import express from 'express';
import GameSave from '../models/GameSave.js';

const router = express.Router();

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
    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.redirect('/home-realm');
    }

    // Check if we're in a shop event
    if (!activeSave.currentEvent || activeSave.currentEvent.type !== 'shop') {
      return res.redirect('/game');
    }

    // Calculate shop costs based on challenge modifier
    const challengeModifier = calculateChallengeModifier(
      activeSave.realm,
      activeSave.level
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
      gameSave: activeSave,
      shopCosts,
      availableItems: generateShopItems(),
    });
  } catch (error) {
    return res.status(500).render('error', {
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

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const healCost =
      10 + calculateChallengeModifier(activeSave.realm, activeSave.level);
    const healAmount = 10;

    // Check if player can afford it
    if (activeSave.currency < healCost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Apply healing
    activeSave.currency -= healCost;
    activeSave.health = Math.min(
      activeSave.maxHealth,
      activeSave.health + healAmount
    );
    await activeSave.save();

    return res.json({
      success: true,
      newHealth: activeSave.health,
      newCurrency: activeSave.currency,
      message: `Healed for ${healAmount} HP`,
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

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Check if player can afford it
    if (activeSave.currency < cost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Get equipment details
    const equipment = getEquipmentDetails(equipmentId);
    if (!equipment) {
      return res.status(400).json({ error: 'Invalid equipment' });
    }

    // Purchase equipment
    activeSave.currency -= cost;
    if (!activeSave.equipment) activeSave.equipment = [];
    activeSave.equipment.push(equipment);
    await activeSave.save();

    return res.json({
      success: true,
      newCurrency: activeSave.currency,
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

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    const cardRemovalCost =
      25 + calculateChallengeModifier(activeSave.realm, activeSave.level);

    // Check if player can afford it
    if (activeSave.currency < cardRemovalCost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Check if card exists
    if (!activeSave.deck || cardIndex >= activeSave.deck.length) {
      return res.status(400).json({ error: 'Invalid card index' });
    }

    // Remove card
    const removedCard = activeSave.deck.splice(cardIndex, 1)[0];
    activeSave.currency -= cardRemovalCost;
    await activeSave.save();

    return res.json({
      success: true,
      newCurrency: activeSave.currency,
      removedCard,
      message: `Removed ${removedCard.value} of ${removedCard.suit}`,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove card' });
  }
});

// API endpoint to leave shop
router.post('/leave', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    if (!activeSave) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Clear shop event
    if (activeSave.currentEvent && activeSave.currentEvent.type === 'shop') {
      activeSave.currentEvent = null;
      await activeSave.save();
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
