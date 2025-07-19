import express from 'express';
import SaveService from '../services/saveService.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { EQUIPMENT, STAT_EFFECTS } from '../public/js/modules/gameData.js';
import {
  getCardValue,
  generateStandardDeck,
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
  const effectToMultiplier = EQUIPMENT.effectToMultiplier;

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

    // Get current deck from active save using deck service
    let currentDeck = [];
    let deckSize = 0;

    // Get user's active save slot
    const activeSaveSlot = user?.activeSaveSlot || 1;

    if (
      activeSave &&
      activeSave.saveSlot === activeSaveSlot &&
      activeSave.runData
    ) {
      // In a run - show player's main deck using deck service
      currentDeck = getDeck(activeSave, DECK_TYPES.PLAYER_MAIN);
      deckSize = currentDeck.length;
    } else {
      // Not in a run or no save - show standard 52-card deck
      currentDeck = generateStandardDeck();
      deckSize = currentDeck.length;
    }

    // Get equipment collection from active save (all unlocked equipment)
    const equipmentCollection = { weapons: [], armor: [], artifacts: [] };

    if (
      activeSave &&
      activeSave.unlockedEquipment &&
      Array.isArray(activeSave.unlockedEquipment)
    ) {
      // Use unlockedEquipment to show all equipment the player owns
      activeSave.unlockedEquipment.forEach((equipmentKey) => {
        // Determine equipment type and get full data
        let equipmentType = 'weapon'; // Default
        let equipmentData = null;

        // Check each equipment category to find the item
        if (EQUIPMENT.weapons[equipmentKey]) {
          equipmentType = 'weapon';
          equipmentData = EQUIPMENT.weapons[equipmentKey];
        } else if (EQUIPMENT.armor[equipmentKey]) {
          equipmentType = 'armor';
          equipmentData = EQUIPMENT.armor[equipmentKey];
        } else if (EQUIPMENT.artifacts && EQUIPMENT.artifacts[equipmentKey]) {
          equipmentType = 'artifact';
          equipmentData = EQUIPMENT.artifacts[equipmentKey];
        }

        if (equipmentData) {
          const collectionItem = {
            name: equipmentKey,
            displayName: equipmentData.name || equipmentKey,
            description: equipmentData.description || '',
            owned: true,
            type: equipmentType,
          };

          switch (equipmentType) {
            case 'weapon':
              equipmentCollection.weapons.push(collectionItem);
              break;
            case 'armor':
              equipmentCollection.armor.push(collectionItem);
              break;
            case 'artifact':
              equipmentCollection.artifacts.push(collectionItem);
              break;
          }
        }
      });
    } else if (activeSave && activeSave.legacyArtifacts) {
      // Fallback to legacy artifacts
      equipmentCollection.artifacts = activeSave.legacyArtifacts.map(
        (artifact) => ({
          name: artifact.name,
          displayName: artifact.name,
          effect: artifact.effect,
          description: artifact.description,
          owned: true,
          type: 'artifact',
        })
      );
    }

    // Add default unlocked equipment for new users
    if (
      equipmentCollection.weapons.length === 0 &&
      equipmentCollection.armor.length === 0
    ) {
      // Default unlocked equipment: Sword and Light Armor
      const swordData = EQUIPMENT.weapons['sword'];
      const lightArmorData = EQUIPMENT.armor['light'];

      if (swordData) {
        equipmentCollection.weapons.push({
          name: 'sword',
          displayName: swordData.name || 'Sword',
          description: swordData.description || '',
          owned: true,
          type: 'weapon',
        });
      }

      if (lightArmorData) {
        equipmentCollection.armor.push({
          name: 'light',
          displayName: lightArmorData.name || 'Light Armor',
          description: lightArmorData.description || '',
          owned: true,
          type: 'armor',
        });
      }
    }

    // Get current equipment from runData.equipment (canonical source)
    const currentEquipment = {
      weapons: [],
      armor: [],
      artifacts: [],
      inventory: {
        current: 0,
        max: 0,
        capacity: '0/0',
      },
    };

    if (
      activeSave &&
      activeSave.runData &&
      activeSave.runData.equipment &&
      Array.isArray(activeSave.runData.equipment)
    ) {
      // In a run - use equipment from run data
      activeSave.runData.equipment.forEach((item) => {
        const equipmentData = getEquipmentData(
          item.value,
          item.type,
          EQUIPMENT
        );
        const stats = equipmentData
          ? calculateDynamicStats(equipmentData, currentDeck, 4)
          : null;

        const equipmentItem = {
          name: item.value,
          displayName: equipmentData?.name || item.value,
          type: item.type,
          stats: stats,
          description: equipmentData?.description || '',
        };

        switch (item.type) {
          case 'weapon':
            currentEquipment.weapons.push(equipmentItem);
            break;
          case 'armor':
            currentEquipment.armor.push(equipmentItem);
            break;
          case 'artifact':
            currentEquipment.artifacts.push(equipmentItem);
            break;
        }
      });

      // Calculate inventory capacity
      const baseCraftStat = activeSave.gameData?.stats?.craft || 4;
      const craftModifier = activeSave.runData?.statModifiers?.craft || 0;
      const totalCraftStat = baseCraftStat + craftModifier;
      const maxCapacity = totalCraftStat; // Inventory size = current craft amount
      const currentCount = activeSave.runData.equipment.length;

      currentEquipment.inventory = {
        current: currentCount,
        max: maxCapacity,
        capacity: `${currentCount}/${maxCapacity}`,
      };
    } else if (
      activeSave &&
      activeSave.metadata &&
      activeSave.metadata.lastSelectedEquipment
    ) {
      // Not in a run - use last selected equipment from metadata
      const lastWeapon = activeSave.metadata.lastSelectedEquipment.weapon;
      const lastArmor = activeSave.metadata.lastSelectedEquipment.armor;

      if (lastWeapon) {
        const weaponData = EQUIPMENT.weapons[lastWeapon.toLowerCase()];
        currentEquipment.weapons.push({
          name: lastWeapon.toLowerCase(),
          displayName: weaponData?.name || lastWeapon,
          type: 'weapon',
          stats: weaponData
            ? calculateDynamicStats(weaponData, currentDeck, 4)
            : null,
          description: weaponData?.description || '',
        });
      }

      if (lastArmor) {
        const armorData =
          EQUIPMENT.armor[lastArmor.toLowerCase().replace(' ', '')];
        currentEquipment.armor.push({
          name: lastArmor.toLowerCase().replace(' ', ''),
          displayName: armorData?.name || lastArmor,
          type: 'armor',
          stats: armorData
            ? calculateDynamicStats(armorData, currentDeck, 4)
            : null,
          description: armorData?.description || '',
        });
      }

      // Calculate inventory capacity for non-run state
      const baseCraftStat = activeSave.gameData?.stats?.craft || 4;
      const craftModifier = activeSave.runData?.statModifiers?.craft || 0;
      const totalCraftStat = baseCraftStat + craftModifier;
      const maxCapacity = totalCraftStat; // Inventory size = current craft amount
      const currentCount =
        currentEquipment.weapons.length +
        currentEquipment.armor.length +
        currentEquipment.artifacts.length;

      currentEquipment.inventory = {
        current: currentCount,
        max: maxCapacity,
        capacity: `${currentCount}/${maxCapacity}`,
      };
    }

    // Add default equipment only for new users who haven't started a run yet
    // (not for users who are in a run but have lost all equipment)
    if (
      currentEquipment.weapons.length === 0 &&
      currentEquipment.armor.length === 0 &&
      !activeSave?.runData?.equipment // Only show defaults if no run data exists
    ) {
      // Default starting equipment: Sword and Light Armor
      const swordData = EQUIPMENT.weapons['sword'];
      const lightArmorData = EQUIPMENT.armor['light'];

      currentEquipment.weapons.push({
        name: 'sword',
        displayName: swordData?.name || 'Sword',
        type: 'weapon',
        stats: swordData
          ? calculateDynamicStats(swordData, currentDeck, 4)
          : null,
        description: swordData?.description || '',
      });

      currentEquipment.armor.push({
        name: 'light',
        displayName: lightArmorData?.name || 'Light Armor',
        type: 'armor',
        stats: lightArmorData
          ? calculateDynamicStats(lightArmorData, currentDeck, 4)
          : null,
        description: lightArmorData?.description || '',
      });

      // Calculate inventory capacity for default state
      const baseCraftStat = activeSave?.gameData?.stats?.craft || 4;
      const craftModifier = activeSave?.runData?.statModifiers?.craft || 0;
      const totalCraftStat = baseCraftStat + craftModifier;
      const maxCapacity = totalCraftStat; // Inventory size = current craft amount
      const currentCount = 2; // Sword + Light Armor

      currentEquipment.inventory = {
        current: currentCount,
        max: maxCapacity,
        capacity: `${currentCount}/${maxCapacity}`,
      };
    }

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
    const statModifiers = activeSave
      ? activeSave.runData.statModifiers || {
          power: 0,
          will: 0,
          craft: 0,
          focus: 0,
        }
      : { power: 0, will: 0, craft: 0, focus: 0 };

    const renderData = {
      title: 'Status - Deckrift',
      user: { username: req.session.username },
      gameSave: activeSave ? { ...activeSave, isActive: true } : null, // Add isActive property for navbar
      currentDeck: currentDeck || [],
      deckSize: deckSize || 52,
      equipmentCollection: equipmentCollection || {
        weapons: [],
        armor: [],
        artifacts: [],
      },
      currentEquipment: currentEquipment || {
        weapons: [],
        armor: [],
        artifacts: [],
        inventory: { current: 0, max: 4, capacity: '0/4' },
      },
      purchasedUpgrades: purchasedUpgrades || [],
      xpThresholds,
      statModifiers,
      statEffects: STAT_EFFECTS,
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
