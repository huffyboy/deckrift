import express from 'express';
import GameSave from '../models/GameSave.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import {
  EQUIPMENT,
  HOME_REALM_UPGRADES,
  EFFECT_TO_MULTIPLIER,
} from '../public/js/modules/gameData.js';
import {
  getCardValue,
  generateStandardDeck,
} from '../public/js/modules/gameUtils.js';

const router = express.Router();

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

// Helper function to get equipment data from gameData
function getEquipmentData(key, type, EQUIPMENT) {
  switch (type) {
    case 'weapon':
      return (
        EQUIPMENT.weapons[key] || {
          name: key,
          description: 'Unknown weapon',
        }
      );
    case 'armor':
      return (
        EQUIPMENT.armor[key] || { name: key, description: 'Unknown armor' }
      );
    case 'artifact':
      // For artifacts, we'll need to handle this differently since they're not in EQUIPMENT
      return { name: key, description: 'Artifact' };
    default:
      return { name: key, description: 'Unknown item' };
  }
}

// Helper function to calculate dynamic stats based on deck
function calculateDynamicStats(equipment, deck, power = 4) {
  if (!equipment || !deck || !Array.isArray(deck)) {
    return equipment; // Return original stats if no deck data
  }

  // Use centralized effect mapping from gameData
  const effectToMultiplier = EFFECT_TO_MULTIPLIER;

  const totalCards = deck.length;
  let hitCards = 0;
  let totalDamageMultiplier = 0;
  let totalMitigation = 0;

  // Count cards that trigger the equipment
  deck.forEach((card) => {
    if (!equipment.hitEffects) {
      return;
    }

    equipment.hitEffects.forEach((effect) => {
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
    ...equipment,
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
    const activeSave = await GameSave.findOne({
      userId,
      isActive: true,
    });

    // Get deck data (from active save or generate standard deck)
    let currentDeck = [];
    let deckSize = 0;

    if (activeSave && activeSave.deck && Array.isArray(activeSave.deck)) {
      currentDeck = activeSave.deck;
      deckSize = currentDeck.length;
    } else {
      // Generate standard 52-card deck
      currentDeck = generateStandardDeck();
      deckSize = currentDeck.length;
    }

    // Get equipment collection from active save
    const equipmentCollection = { weapons: [], armor: [], artifacts: [] };

    if (
      activeSave &&
      activeSave.equipment &&
      Array.isArray(activeSave.equipment)
    ) {
      // Use new unified equipment array - look up full data from gameData
      activeSave.equipment.forEach((item) => {
        const equipmentData = getEquipmentData(item.key, item.type, EQUIPMENT);

        switch (item.type) {
          case 'weapon':
            equipmentCollection.weapons.push({
              ...equipmentData,
            });
            break;
          case 'armor':
            equipmentCollection.armor.push({
              ...equipmentData,
            });
            break;
          case 'artifact':
            equipmentCollection.artifacts.push({
              ...equipmentData,
            });
            break;
        }
      });
    } else if (activeSave && activeSave.legacyArtifacts) {
      // Fallback to legacy artifacts
      equipmentCollection.artifacts = activeSave.legacyArtifacts.map(
        (artifact) => ({
          name: artifact.name,
          effect: artifact.effect,
          description: artifact.description,
        })
      );
    }

    // Get current equipment (from active save or default to starting equipment)
    const currentEquipment = {
      weapon: { name: 'sword', displayName: 'Sword', stats: null },
      armor: { name: 'light', displayName: 'Light Armor', stats: null },
    };

    if (
      activeSave &&
      activeSave.equipment &&
      Array.isArray(activeSave.equipment)
    ) {
      // Use new unified equipment array from active save
      const equippedWeapon = activeSave.equipment.find(
        (item) => item.type === 'weapon'
      );
      const equippedArmor = activeSave.equipment.find(
        (item) => item.type === 'armor'
      );

      if (equippedWeapon) {
        currentEquipment.weapon.name = equippedWeapon.key || 'sword';
        // Look up display name from gameData
        const weaponData = EQUIPMENT.weapons[equippedWeapon.key];
        currentEquipment.weapon.displayName = weaponData?.name || 'Sword';
      }
      if (equippedArmor) {
        currentEquipment.armor.name = equippedArmor.key || 'light';
        // Look up display name from gameData
        const armorData = EQUIPMENT.armor[equippedArmor.key];
        currentEquipment.armor.displayName = armorData?.name || 'Light Armor';
      }
    } else if (activeSave && activeSave.legacyEquipment) {
      // Fallback to legacy equipment structure
      if (activeSave.legacyEquipment.weapon) {
        currentEquipment.weapon.name =
          activeSave.legacyEquipment.weapon.toLowerCase();
      }
      if (activeSave.legacyEquipment.armor) {
        currentEquipment.armor.name = activeSave.legacyEquipment.armor
          .toLowerCase()
          .replace(' ', '');
      }
    } else if (user.startingWeapon && user.startingArmor) {
      // Use starting equipment from user profile
      currentEquipment.weapon.name = user.startingWeapon.toLowerCase();
      currentEquipment.armor.name = user.startingArmor
        .toLowerCase()
        .replace(' ', '');
    }

    // Get equipment stats from gameData and calculate dynamic stats
    if (EQUIPMENT.weapons[currentEquipment.weapon.name]) {
      const weaponStats = EQUIPMENT.weapons[currentEquipment.weapon.name];
      currentEquipment.weapon.displayName = weaponStats.name;
      currentEquipment.weapon.stats = calculateDynamicStats(
        weaponStats,
        currentDeck,
        4
      ); // Assuming power = 4
    }
    if (EQUIPMENT.armor[currentEquipment.armor.name]) {
      const armorStats = EQUIPMENT.armor[currentEquipment.armor.name];
      currentEquipment.armor.displayName = armorStats.name;
      currentEquipment.armor.stats = calculateDynamicStats(
        armorStats,
        currentDeck,
        4
      ); // Assuming power = 4
    }

    // Get purchased upgrades from user profile
    const purchasedUpgrades = [];

    // Check for upgrades in the user's upgrades array
    if (user.upgrades && user.upgrades.length > 0) {
      user.upgrades.forEach((upgrade) => {
        if (HOME_REALM_UPGRADES[upgrade]) {
          purchasedUpgrades.push(HOME_REALM_UPGRADES[upgrade]);
        }
      });
    }

    const renderData = {
      title: 'Status - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave, // Add gameSave data for navbar
      currentDeck: currentDeck || [],
      deckSize: deckSize || 52,
      equipmentCollection: equipmentCollection || {
        weapons: [],
        armor: [],
        artifacts: [],
      },
      currentEquipment: currentEquipment || {
        weapon: { name: 'Sword', stats: null },
        armor: { name: 'Light Armor', stats: null },
      },
      purchasedUpgrades: purchasedUpgrades || [],
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
