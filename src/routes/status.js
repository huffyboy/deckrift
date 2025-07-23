import express from 'express';
import SaveService from '../services/saveService.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import {
  EQUIPMENT,
  STAT_EFFECTS,
  ARTIFACT_DETAILS,
  STARTING_EQUIPMENT,
  REALMS,
} from '../shared/gameConstants.js';
import {
  getCardValue,
  calculateAllXPThresholds,
} from '../services/gameUtils.js';
import { getDeck, DECK_TYPES } from '../services/deckService.js';

const router = express.Router();

// Create save service instance
const saveService = new SaveService();

// Helper function to check if a card matches a condition
function cardMatchesCondition(card, condition) {
  const cardValue = getCardValue(card);

  switch (condition.type) {
    case 'range':
      return cardValue >= condition.from && cardValue <= condition.to;
    case 'card':
      return card.value === condition.value;
    case 'suit':
      return card.suit === condition.value;
    case 'color': {
      const isRed = card.suit === '♥' || card.suit === '♦';
      return (
        (condition.value === 'red' && isRed) ||
        (condition.value === 'black' && !isRed)
      );
    }
    default:
      return false;
  }
}

// Helper function to get details for inventory items
// function getInventoryData(inventory, deck, power) {
function getInventoryData(gameSave) {
  const inventory = gameSave.runData.equipment ?? STARTING_EQUIPMENT;
  const deck = getDeck(gameSave, DECK_TYPES.PLAYER_MAIN);
  const power =
    (gameSave.gameData.stats.power ?? 4) +
    (gameSave.runData.statModifiers.power ?? 0);

  const result = {
    weapons: [],
    armor: [],
    artifacts: [],
    size: inventory.length,
  };

  inventory.forEach((item) => {
    let enrichedItem;

    switch (item.type) {
      case 'weapon': {
        const weaponData = EQUIPMENT.weapons[item.value];
        enrichedItem = {
          ...weaponData,
          ...ARTIFACT_DETAILS[item.value],
          ...calculateDynamicStats(weaponData, deck, power),
        };
        result.weapons.push(enrichedItem);
        break;
      }

      case 'armor': {
        const armorData = EQUIPMENT.armor[item.value];
        enrichedItem = {
          ...armorData,
          ...ARTIFACT_DETAILS[item.value],
          ...calculateDynamicStats(armorData, deck, power),
        };
        result.armor.push(enrichedItem);
        break;
      }

      case 'artifact':
        enrichedItem = {
          ...ARTIFACT_DETAILS[item.value],
        };
        result.artifacts.push(enrichedItem);
        break;

      default:
        enrichedItem = {
          name: item.value,
          type: 'artifact',
          emoji: '🏺',
          flavorText: 'An ancient artifact with mysterious powers.',
          effectText: 'Unknown',
        };
        result.artifacts.push(enrichedItem);
        break;
    }
  });

  return result;
}

function getCollectionData(gameSave) {
  const collection = gameSave.gameData.unlockedEquipment;

  const categorized = {
    weapons: [],
    armor: [],
  };

  collection.forEach((itemKey) => {
    const details = ARTIFACT_DETAILS[itemKey];
    const type = details.type;

    if (type === 'weapon') {
      categorized.weapons.push(details);
    } else if (type === 'armor') {
      categorized.armor.push(details);
    }
  });

  return categorized;
}

// Helper function to calculate dynamic stats based on deck
function calculateDynamicStats(item, deck, power) {
  if (!item || !deck || !Array.isArray(deck)) {
    return item; // Return original stats if no deck data
  }

  // Use centralized effect mapping from gameData
  const effectToMultiplier = EQUIPMENT.effectToMultiplier;

  const totalCards = deck.length;
  let hitCards = 0;
  let totalDamageMultiplier = 0;
  let totalMitigation = 0;

  // Count cards that trigger the equipment
  deck.forEach((card) => {
    if (!item.hitEffects) {
      return;
    }

    item.hitEffects.forEach((effect) => {
      const matches = cardMatchesCondition(card, effect.condition);
      if (matches) {
        hitCards++;
        const multiplier = effectToMultiplier[effect.effect];
        totalDamageMultiplier += multiplier;
        // For armor, calculate mitigation (1 - multiplier)
        // multiplier of 0 = 100% mitigation (no damage)
        // multiplier of 0.5 = 50% mitigation (half damage)
        // multiplier of 1 = 0% mitigation (full damage)
        totalMitigation += 1 - multiplier;
      }
    });
  });

  // Calculate hit rate
  const hitRate =
    totalCards > 0 ? ((hitCards / totalCards) * 100).toFixed(2) + '%' : '0%';

  // Calculate average damage multiplier
  const avgDamageMultiplier =
    hitCards > 0 ? totalDamageMultiplier / hitCards : 0;

  // Calculate average damage output (power × average multiplier × hit rate)
  const avgDamage = (
    power *
    avgDamageMultiplier *
    (hitCards / totalCards)
  ).toFixed(2);

  // Calculate mitigation percentage - for armor, this should be the overall mitigation rate
  // (trigger rate × damage reduction) since we want to show how much damage is avoided overall
  let avgMitigation;
  if (totalCards > 0) {
    // For armor, mitigation is the percentage of cards that trigger × the damage reduction
    // This gives us the overall damage avoidance rate
    const triggerRate = hitCards / totalCards;
    const avgDamageReduction = hitCards > 0 ? totalMitigation / hitCards : 0;
    const overallMitigation = triggerRate * avgDamageReduction;
    avgMitigation = (overallMitigation * 100).toFixed(2) + '%';
  } else {
    avgMitigation = '0%';
  }

  return {
    ...item,
    calculatedHitRate: hitRate,
    calculatedDamageOutput: `${avgDamage} damage`,
    calculatedMitigation: avgMitigation,
    hitCards: hitCards,
    totalCards: totalCards,
  };
}

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  return next();
};

// Status page - Current deck, equipment, and upgrades
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.session;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/');
    }

    // Get current active game save to show current deck
    const saveResult = await saveService.loadSave(userId);
    let activeSave = saveResult.success ? saveResult.saveData : null;

    // Create default save for new users who don't have one yet
    if (!activeSave) {
      const { createDefaultSaveData } = await import(
        '../services/saveSchemas.js'
      );
      const defaultSaveData = createDefaultSaveData();

      const createResult = await saveService.createNewSave(
        userId,
        defaultSaveData
      );
      if (createResult.success) {
        activeSave = createResult.saveData;
      }
    }

    const currentDeck = getDeck(activeSave, DECK_TYPES.PLAYER_MAIN);
    const deckSize = currentDeck.length;
    const equipmentCollection = getCollectionData(activeSave);
    const currentEquipment = getInventoryData(activeSave);

    // Calculate inventory capacity
    const baseCraftStat = activeSave.gameData?.stats?.craft || 4;
    const craftModifier = activeSave.runData?.statModifiers?.craft || 0;
    const maxCapacity = baseCraftStat + craftModifier;
    const currentCount = currentEquipment.size;

    currentEquipment.inventory = {
      current: currentCount,
      max: maxCapacity,
      capacity: `${currentCount}/${maxCapacity}`,
    };

    // Get purchased upgrades from save data (now per-save)
    const purchasedUpgrades = [];

    // Check for upgrades in the save's upgrades array
    if (
      activeSave?.gameData?.upgrades &&
      activeSave.gameData.upgrades.length > 0
    ) {
      activeSave.gameData.upgrades.forEach((upgrade) => {
        if (EQUIPMENT.HOME_REALM_UPGRADES[upgrade]) {
          purchasedUpgrades.push(EQUIPMENT.HOME_REALM_UPGRADES[upgrade]);
        }
      });
    }

    // Calculate XP thresholds for each stat
    const stats = activeSave
      ? activeSave.gameData.stats
      : { power: 4, will: 4, craft: 4, focus: 4 };
    const xpThresholds = calculateAllXPThresholds(stats);

    // Get stat modifiers from run data
    const statModifiers = activeSave.runData.statModifiers || {
      power: 0,
      will: 0,
      craft: 0,
      focus: 0,
    };

    const renderData = {
      title: 'Status - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave,
      currentDeck: currentDeck,
      deckSize: deckSize,
      equipmentCollection: equipmentCollection,
      currentEquipment: currentEquipment,
      purchasedUpgrades: purchasedUpgrades,
      xpThresholds,
      statModifiers,
      statEffects: STAT_EFFECTS,
      REALMS,
      EQUIPMENT,
    };

    return res.render('status', renderData);
  } catch (error) {
    logger.error('Error in status route:', error);
    return res.status(500).render('errors/error', {
      title: 'Error - Deckrift',
      message: 'Failed to load status',
      error,
    });
  }
});

export default router;
