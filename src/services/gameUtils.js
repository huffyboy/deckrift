/**
 * Game utility functions shared across routes
 */

import {
  CHALLENGE_MODIFIERS,
  TEXT_TO_VALUE_MAP,
  MAP_CARD_SUITS,
  MAP_CARD_VALUES,
} from '../shared/gameConstants.js';

/**
 * Calculate XP threshold for a stat level
 * @param {number} statLevel - Current stat level
 * @returns {number} XP needed to reach next level
 */
export function calculateXPThreshold(statLevel) {
  const targetLevel = statLevel + 1;
  return 40 * (targetLevel - 4); // Level 4 needs 40 XP to reach level 5, Level 5 needs 80 XP to reach level 6, etc.
}

/**
 * Calculate XP thresholds for all stats
 * @param {Object} profile - User profile with stat levels
 * @returns {Object} XP thresholds for each stat
 */
export function calculateAllXPThresholds(profile) {
  return {
    power: calculateXPThreshold(profile.power || 4),
    will: calculateXPThreshold(profile.will || 4),
    craft: calculateXPThreshold(profile.craft || 4),
    focus: calculateXPThreshold(profile.focus || 4),
  };
}

/**
 * Generate a standard 52-card deck
 * @returns {Array} - Array of card objects with value, suit, and display properties
 */
export function generateStandardDeck() {
  const deck = [];

  for (const suit of MAP_CARD_SUITS) {
    for (const value of MAP_CARD_VALUES) {
      deck.push({
        value,
        suit,
        display: `${value}${suit}`,
        code: `${value}${suit}`,
      });
    }
  }

  // Add 4 jokers, uncomment when needed for testing
  // for (let i = 0; i < 4; i++) {
  //   deck.push({
  //     value: '𝕁',
  //     suit: '🃏',
  //     display: '𝕁🃏',
  //     code: '𝕁',
  //   });
  // }

  return deck;
}

/**
 * Shuffle an array of cards
 * @param {Array} deck - Array of card objects
 * @returns {Array} - Shuffled array of card objects
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get card value from card object or string value
 * @param {Object|string} cardInput - The card object with value property or string value
 * @returns {number} Numeric value of the card
 */
export function getCardValue(cardInput) {
  const value = typeof cardInput === 'string' ? cardInput : cardInput.value;
  return TEXT_TO_VALUE_MAP[value] || parseInt(value) || 0;
}

/**
 * Get challenge modifier for a given realm and level
 * @param {number} realmId - The realm ID
 * @param {number} level - The level (1-based)
 * @returns {number} The challenge modifier
 */
export function getChallengeModifier(realmId, level) {
  const realmModifiers = CHALLENGE_MODIFIERS[realmId];
  if (!realmModifiers) return 1;

  // Level is 1-based, so subtract 1 for array index
  const levelIndex = level - 1;
  return (
    realmModifiers[levelIndex] || realmModifiers[realmModifiers.length - 1]
  );
}

// ============================================================================
// EQUIPMENT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get the maximum equipment slots based on craft stat
 * @param {number} craftStat - The player's craft stat
 * @returns {number} - Maximum equipment slots
 */
export function getMaxEquipmentSlots(craftStat) {
  return craftStat; // 1 slot per craft point
}

/**
 * Get currently equipped items from equipment array
 * @param {Array} equipment - Array of equipment items
 * @returns {Object} - Object with equipped weapon and armor
 */
export function getEquippedItems(equipment) {
  if (!equipment || !Array.isArray(equipment)) {
    return { weapon: null, armor: null };
  }

  const equippedWeapon = equipment.find((item) => item.type === 'weapon');
  const equippedArmor = equipment.find((item) => item.type === 'armor');

  return {
    weapon: equippedWeapon,
    armor: equippedArmor,
  };
}

/**
 * Check if player can carry more equipment
 * @param {Array} equipment - Current equipment array
 * @param {number} craftStat - Player's craft stat
 * @returns {boolean} - True if player can carry more equipment
 */
export function canCarryMoreEquipment(equipment, craftStat) {
  if (!equipment || !Array.isArray(equipment)) {
    return true; // No equipment means can carry
  }

  const maxSlots = getMaxEquipmentSlots(craftStat);
  const currentCount = equipment.length;

  return currentCount < maxSlots;
}

/**
 * Add equipment to player's inventory
 * @param {Array} equipment - Current equipment array
 * @param {string} equipmentKey - Equipment key to add
 * @param {string} equipmentType - Type of equipment ('weapon', 'armor', 'artifact')
 * @param {number} craftStat - Player's craft stat
 * @returns {Object} - Result with success flag and updated equipment array
 */
export function addEquipment(
  equipment,
  equipmentKey,
  equipmentType,
  craftStat
) {
  if (!equipment || !Array.isArray(equipment)) {
    equipment = [];
  }

  if (!canCarryMoreEquipment(equipment, craftStat)) {
    return {
      success: false,
      equipment: equipment,
      message: 'Cannot carry more equipment - craft limit reached',
    };
  }

  // Add the new equipment
  const newEquipment = {
    key: equipmentKey,
    type: equipmentType,
  };

  const updatedEquipment = [...equipment, newEquipment];

  return {
    success: true,
    equipment: updatedEquipment,
    message: `Added ${equipmentKey} to inventory`,
  };
}

/**
 * Remove equipment from player's inventory
 * @param {Array} equipment - Current equipment array
 * @param {string} equipmentId - ID of equipment to remove
 * @returns {Object} - Result with success flag and updated equipment array
 */
export function removeEquipment(equipment, equipmentId) {
  if (!equipment || !Array.isArray(equipment)) {
    return {
      success: false,
      equipment: equipment,
      message: 'No equipment to remove',
    };
  }

  const updatedEquipment = equipment.filter((item) => item._id !== equipmentId);

  if (updatedEquipment.length === equipment.length) {
    return {
      success: false,
      equipment: equipment,
      message: 'Equipment not found',
    };
  }

  return {
    success: true,
    equipment: updatedEquipment,
    message: 'Equipment removed',
  };
}

/**
 * Equip an item (unequip current item in same slot if exists)
 * @param {Array} equipment - Current equipment array
 * @param {string} equipmentId - ID of equipment to equip
 * @param {string} slot - Slot to equip in ('weapon' or 'armor')
 * @returns {Object} - Result with success flag and updated equipment array
 */
export function equipItem(equipment, equipmentId, slot) {
  if (!equipment || !Array.isArray(equipment)) {
    return {
      success: false,
      equipment: equipment,
      message: 'No equipment available',
    };
  }

  const updatedEquipment = equipment.map((item) => {
    if (item._id === equipmentId) {
      // Equip the target item
      return { ...item, isEquipped: true, equippedSlot: slot };
    } else if (item.equippedSlot === slot && item.isEquipped) {
      // Unequip current item in same slot
      return { ...item, isEquipped: false, equippedSlot: null };
    }
    return item;
  });

  return {
    success: true,
    equipment: updatedEquipment,
    message: 'Item equipped',
  };
}

/**
 * Create equipment item from artifact or equipment data
 * @param {Object} itemData - Data for the equipment item
 * @param {string} type - Type of equipment ('weapon', 'armor', 'artifact')
 * @returns {Object} - Equipment item object
 */
export function createEquipmentItem(itemData, type) {
  const baseItem = {
    name: itemData.name || 'Unknown Item',
    type: type,
    description: itemData.description || '',
    isEquipped: false,
    equippedSlot: null,
  };

  switch (type) {
    case 'weapon':
      return {
        ...baseItem,
        weaponType: itemData.weaponType || itemData.name?.toLowerCase(),
        effect: itemData.effect || '',
      };
    case 'armor':
      return {
        ...baseItem,
        armorType: itemData.armorType || itemData.name?.toLowerCase(),
        effect: itemData.effect || '',
      };
    case 'artifact':
      return {
        ...baseItem,
        artifactType: itemData.artifactType || itemData.effect || '',
        effect: itemData.effect || '',
      };
    default:
      return baseItem;
  }
}
