// Game Data Module
// Contains all static game data like realms, equipment, upgrades, etc.

// ============================================================================
// CARD SYSTEM CONSTANTS
// ============================================================================

// Card value mappings for easier processing
export const CARD_VALUES = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  10: 10,
  9: 9,
  8: 8,
  7: 7,
  6: 6,
  5: 5,
  4: 4,
  3: 3,
  2: 2,
  joker: 'joker',
};

// Card color mappings
export const CARD_COLORS = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

// Card Unicode symbol mapping
export const CARD_UNICODE_MAP = {
  // Spades (Black)
  AS: '🂡',
  '2S': '🂢',
  '3S': '🂣',
  '4S': '🂤',
  '5S': '🂥',
  '6S': '🂦',
  '7S': '🂧',
  '8S': '🂨',
  '9S': '🂩',
  '10S': '🂪',
  JS: '🂫',
  QS: '🂭',
  KS: '🂮',

  // Hearts (Red)
  AH: '🂱',
  '2H': '🂲',
  '3H': '🂳',
  '4H': '🂴',
  '5H': '🂵',
  '6H': '🂶',
  '7H': '🂷',
  '8H': '🂸',
  '9H': '🂹',
  '10H': '🂺',
  JH: '🂻',
  QH: '🂽',
  KH: '🂾',

  // Diamonds (Red)
  AD: '🃁',
  '2D': '🃂',
  '3D': '🃃',
  '4D': '🃄',
  '5D': '🃅',
  '6D': '🃆',
  '7D': '🃇',
  '8D': '🃈',
  '9D': '🃉',
  '10D': '🃊',
  JD: '🃋',
  QD: '🃍',
  KD: '🃎',

  // Clubs (Black)
  AC: '🃑',
  '2C': '🃒',
  '3C': '🃓',
  '4C': '🃔',
  '5C': '🃕',
  '6C': '🃖',
  '7C': '🃗',
  '8C': '🃘',
  '9C': '🃙',
  '10C': '🃚',
  JC: '🃛',
  QC: '🃝',
  KC: '🃞',

  // Joker
  JOKER: '🃟',
};

// Card back symbol
export const CARD_BACK_SYMBOL = '🂠';

// Helper function to get card Unicode symbol
export function getCardUnicode(cardValue, suit) {
  const key = cardValue + suit.charAt(0).toUpperCase();
  return CARD_UNICODE_MAP[key] || CARD_BACK_SYMBOL;
}

// Helper function to get card value from Unicode symbol
export function getCardValueFromUnicode(unicodeSymbol) {
  // Map Unicode symbols back to card values
  const unicodeToValue = {
    '🂡': 'A',
    '🂱': 'A',
    '🃁': 'A',
    '🃑': 'A',
    '🂢': '2',
    '🂲': '2',
    '🃂': '2',
    '🃒': '2',
    '🂣': '3',
    '🂳': '3',
    '🃃': '3',
    '🃓': '3',
    '🂤': '4',
    '🂴': '4',
    '🃄': '4',
    '🃔': '4',
    '🂥': '5',
    '🂵': '5',
    '🃅': '5',
    '🃕': '5',
    '🂦': '6',
    '🂶': '6',
    '🃆': '6',
    '🃖': '6',
    '🂧': '7',
    '🂷': '7',
    '🃇': '7',
    '🃗': '7',
    '🂨': '8',
    '🂸': '8',
    '🃈': '8',
    '🃘': '8',
    '🂩': '9',
    '🂹': '9',
    '🃉': '9',
    '🃙': '9',
    '🂪': '10',
    '🂺': '10',
    '🃊': '10',
    '🃚': '10',
    '🂫': 'J',
    '🂻': 'J',
    '🃋': 'J',
    '🃛': 'J',
    '🂭': 'Q',
    '🂽': 'Q',
    '🃍': 'Q',
    '🃝': 'Q',
    '🂮': 'K',
    '🂾': 'K',
    '🃎': 'K',
    '🃞': 'K',
    '🃟': 'joker',
  };

  return unicodeToValue[unicodeSymbol] || 'J'; // Default to nothing
}

// Helper function to check if card is red
export function isRedCard(unicodeSymbol) {
  return (
    unicodeSymbol.includes('🂱') ||
    unicodeSymbol.includes('🂲') ||
    unicodeSymbol.includes('🂳') ||
    unicodeSymbol.includes('🂴') ||
    unicodeSymbol.includes('🂵') ||
    unicodeSymbol.includes('🂶') ||
    unicodeSymbol.includes('🂷') ||
    unicodeSymbol.includes('🂸') ||
    unicodeSymbol.includes('🂹') ||
    unicodeSymbol.includes('🂺') ||
    unicodeSymbol.includes('🂻') ||
    unicodeSymbol.includes('🂽') ||
    unicodeSymbol.includes('🂾') ||
    unicodeSymbol.includes('🃁') ||
    unicodeSymbol.includes('🃂') ||
    unicodeSymbol.includes('🃃') ||
    unicodeSymbol.includes('🃄') ||
    unicodeSymbol.includes('🃅') ||
    unicodeSymbol.includes('🃆') ||
    unicodeSymbol.includes('🃇') ||
    unicodeSymbol.includes('🃈') ||
    unicodeSymbol.includes('🃉') ||
    unicodeSymbol.includes('🃊') ||
    unicodeSymbol.includes('🃋') ||
    unicodeSymbol.includes('🃍') ||
    unicodeSymbol.includes('🃎')
  );
}

// Card ranges for easier validation
export const CARD_RANGES = {
  face: [11, 12, 13],
  high: [10, 11, 12, 13, 14],
  low: [2, 3, 4, 5, 6, 7, 8, 9],
  red: ['hearts', 'diamonds'],
  black: ['clubs', 'spades'],
};

// Ace can be represented as 1, 14, A, or ace
// King can be represented as 13, K, or king
// Queen can be represented as 12, Q, or queen
// Jack can be represented as 11, J, or jack
// Joker are represented as joker
export const FACE_CARDS = [11, 12, 13];
export const ACE = 14;
export const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

// ============================================================================
// GAME CONSTANTS & CONFIGURATION
// ============================================================================

export const GAME_CONSTANTS = {
  REST_HEAL_PERCENTAGE: 0.5, // 50% of max HP
  SHOP_HEAL_AMOUNT: 10,
  STARTING_CURRENCY: 0,
  CARDS_PER_LEVEL: 5, // Cards per challenge modifier
  BOSS_JOKER_POSITION: 'bottom-right', // Where joker appears on map
  START_POSITION: 'top-left', // Where player starts on map
};

export const STARTING_STATS = {
  power: 4,
  will: 4,
  craft: 4,
  control: 4,
};

export const LEVELING_THRESHOLDS = {
  base: 40,
  increment: 40,
};

export const STAT_CHALLENGE_BASE = 12;

export const LEVEL_CARD_COUNT_PER_MODIFIER = 5;

// Stat effects and their calculations
export const STAT_EFFECTS = {
  power: {
    damagePerPoint: 1,
    minDamage: 1,
    description: 'Damage',
  },
  will: {
    hpPerPoint: 10,
    description: 'Max HP (Max HP increases also adds to current HP)',
  },
  craft: {
    equipmentSlots: 1,
    description:
      'Determines number of equipment and artifacts player can carry',
  },
  control: {
    handSizePerPoint: 1,
    minHandSize: 2,
    description: 'Hand size',
  },
};

// ============================================================================
// REALMS & PROGRESSION
// ============================================================================

export const REALMS = {
  1: {
    id: 'steel',
    name: 'Steel',
    description:
      'Here talking is done with the blade. All must obey the ruler of steel. The leader of the realm of bandits.',
    ruler: 'Jack of Steel',
    unlocked: true,
    completed: false,
  },
  2: {
    id: 'blood',
    name: 'Blood',
    description:
      'Blood is currency. All seek to draw it from the veins of the living. ' +
      'Among the blood deprived cretins, one commands the blood.',
    ruler: 'Queen of Blood',
    unlocked: false,
    completed: false,
  },
  3: {
    id: 'ash',
    name: 'Ash',
    description:
      'Few survive to tell the tale. The ash is the only thing that remains. In this wasteland, might reigns supreme.',
    ruler: 'King of Ash',
    unlocked: false,
    completed: false,
  },
  4: {
    id: 'speed',
    name: 'Speed',
    description:
      'In a blink of an eye everything can change. Speed is the only thing that matters here. ' +
      'The underbelly rages for a chance race. A chance at freedom. ' +
      'A chance to break through the limits of the realms.',
    ruler: 'Ace of Speed',
    unlocked: false,
    completed: false,
  },
};

export const CHALLENGE_MODIFIERS = {
  // Realm: Challenge Modifier per level
  1: [1, 2, 3, 4],
  2: [2, 3, 4, 5],
  3: [3, 4, 5, 6],
  4: [4, 5, 6, 7],
};

// Helper function to calculate challenge modifier
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
// EQUIPMENT SYSTEM
// ============================================================================

export const EQUIPMENT = {
  weapons: {
    sword: {
      name: 'Sword',
      description: 'More accurate, but slightly weaker than other weapons.',
      baseHitRate: '76.92%',
      baseDamageOutput: '0.5 * Power',
      cardCondition: '5-10: 1/2 damage, J-A: full damage',
      hitEffects: [
        {
          condition: {
            type: 'range',
            from: 5,
            to: 10,
          },
          effect: 'halfDamage',
        },
        {
          condition: {
            type: 'range',
            from: 11,
            to: 14,
          },
          effect: 'fullDamage',
        },
      ],
      starting: true,
    },
    dagger: {
      name: 'Dagger',
      description:
        'Can be thrown or wielded, but requires precise positioning.',
      baseHitRate: '53.85%',
      baseDamageOutput: '0.54 * Power',
      cardCondition: 'Damage if red or A',
      hitEffects: [
        {
          condition: {
            type: 'color',
            value: 'red',
          },
          effect: 'fullDamage',
        },
        {
          condition: {
            type: 'card',
            value: 'A',
          },
          effect: 'fullDamage',
        },
      ],
    },
    bow: {
      name: 'Bow',
      description:
        'Requires distance, but a precise shot can make the difference.',
      baseHitRate: '46.15%',
      baseDamageOutput: '0.54 * Power',
      cardCondition: 'A-6 hit, A does double damage',
      hitEffects: [
        {
          condition: {
            type: 'range',
            from: 2,
            to: 6,
          },
          effect: 'fullDamage',
        },
        {
          condition: {
            type: 'card',
            value: 'A',
          },
          effect: 'doubleDamage',
        },
      ],
    },
    staff: {
      name: 'Staff',
      description:
        'Can be used to heal or attack, but requires precise timing.',
      baseHitRate: '53.85%',
      baseDamageOutput: '0.54 * Power',
      cardCondition: '♥ = heal, ♦+A = damage',
      hitEffects: [
        {
          condition: {
            type: 'suit',
            value: 'hearts',
          },
          effect: 'healSelf', // Heal self for full damage
        },
        {
          condition: {
            type: 'suit',
            value: 'diamonds',
          },
          effect: 'fullDamage',
        },
        {
          condition: {
            type: 'card',
            value: 'A',
          },
          effect: 'fullDamage',
        },
      ],
    },
    hammer: {
      name: 'Hammer',
      description: 'What it lacks in accuracy it makes up in power.',
      baseHitRate: '30.77%',
      baseDamageOutput: '0.62 * Power',
      cardCondition: 'Damage if face cards or A, but double damage',
      hitEffects: [
        {
          condition: {
            type: 'range',
            from: 11,
            to: 14,
          },
          effect: 'doubleDamage',
        },
      ],
    },
    needle: {
      name: 'Needle',
      description: 'Usually not useful, but no weakling stands a chance.',
      baseHitRate: '7.69%',
      baseDamageOutput: '~0.08 * Power * (Enemy HP / Power)',
      cardCondition: 'Only A hits – Instant kill vs non-boss',
      runExclusive: true,
      hitEffects: [
        {
          condition: {
            type: 'card',
            value: 'A',
          },
          effect: 'instantKill',
        },
      ],
    },
  },
  armor: {
    light: {
      name: 'Light Armor',
      description: 'Greater mobility, but no real defense.',
      triggerRate: '30.77%',
      damageMitigation: '~31%',
      cardCondition: 'Dodges if J-A',
      hitEffects: [
        {
          condition: {
            type: 'range',
            from: 11,
            to: 14,
          },
          effect: 'noDamage',
        },
      ],
      starting: true,
    },
    medium: {
      name: 'Medium Armor',
      description: 'A good balance between mobility and defense.',
      triggerRate: '53.85%',
      damageMitigation: '~31%',
      cardCondition: 'Dodges if A, 1/2 damage if 7-K',
      hitEffects: [
        {
          condition: {
            type: 'card',
            value: 'A',
          },
          effect: 'noDamage',
        },
        {
          condition: {
            type: 'range',
            from: 7,
            to: 13,
          },
          effect: 'halfDamage',
        },
      ],
    },
    heavy: {
      name: 'Heavy Armor',
      description: 'Not very mobile, but will protect you from most hits.',
      triggerRate: '76.92%',
      damageMitigation: '~31%',
      cardCondition:
        'Dodges if A, 1/4 damage if Q-K, 1/2 damage if 9-J, 3/4 damage if 5-8',
      hitEffects: [
        {
          condition: {
            type: 'card',
            value: 'A',
          },
          effect: 'noDamage',
        },
        {
          condition: {
            type: 'range',
            from: 12,
            to: 13,
          },
          effect: 'quarterDamage',
        },
        {
          condition: {
            type: 'range',
            from: 9,
            to: 11,
          },
          effect: 'halfDamage',
        },
        {
          condition: {
            type: 'range',
            from: 5,
            to: 8,
          },
          effect: 'threeQuarterDamage',
        },
      ],
    },
    shield: {
      name: 'Shield',
      description: 'A great tool to supplement any defense.',
      triggerRate: '30.77%',
      damageMitigation: '~23%',
      cardCondition: '3/4 damage if 5-8',
      runExclusive: true,
      hitEffects: [
        {
          condition: {
            type: 'range',
            from: 5,
            to: 8,
          },
          effect: 'quarterDamage',
        },
      ],
    },
  },
  hitEffects: {
    noDamage: {
      name: 'No Damage',
      description: 'No damage is dealt.',
      effect: 'noDamage',
      multiplier: 0,
    },
    halfDamage: {
      name: 'Half Damage',
      description: 'Half damage is dealt.',
      effect: 'halfDamage',
      multiplier: 0.5,
    },
    quarterDamage: {
      name: 'Quarter Damage',
      description: 'Quarter damage is dealt.',
      effect: 'quarterDamage',
      multiplier: 0.25,
    },
    threeQuarterDamage: {
      name: 'Three Quarter Damage',
      description: 'Three quarter damage is dealt.',
      effect: 'threeQuarterDamage',
      multiplier: 0.75,
    },
    doubleDamage: {
      name: 'Double Damage',
      description: 'Double damage is dealt.',
      effect: 'doubleDamage',
      multiplier: 2,
    },
    instantKill: {
      name: 'Instant Kill',
      description: 'The enemy is instantly killed.',
      effect: 'instantKill',
      multiplier: 0,
    },
    healSelf: {
      name: 'Heal Self',
      description: 'Heals self for full damage.',
      effect: 'healSelf',
      multiplier: 1,
    },
  },
};

// Equipment reference system for easy lookup
export const EQUIPMENT_REFERENCE = {
  // Weapons
  dagger: { type: 'weapon', category: 'basic' },
  bow: { type: 'weapon', category: 'basic' },
  staff: { type: 'weapon', category: 'basic' },
  hammer: { type: 'weapon', category: 'basic' },
  sword: { type: 'weapon', category: 'basic' },
  needle: { type: 'weapon', category: 'special', runExclusive: true },

  // Armor
  light: { type: 'armor', category: 'basic' },
  medium: { type: 'armor', category: 'basic' },
  heavy: { type: 'armor', category: 'basic' },
  shield: { type: 'armor', category: 'special', runExclusive: true },
};

// Starting equipment (always available)
export const STARTING_EQUIPMENT = {
  weapons: ['sword'],
  armor: ['light'],
};

// ============================================================================
// UPGRADES & PROGRESSION
// ============================================================================

export const HOME_REALM_UPGRADES = {
  // Power XP boosts
  powerXpBoost1: {
    name: 'Power XP Boost 1',
    description: 'Draw an additional card for Power XP gains.',
    cost: 50,
    effect: 'xp_boost',
    stat: 'power',
    level: 1,
    unlocked: false,
  },
  powerXpBoost2: {
    name: 'Power XP Boost 2',
    description: 'Draw an additional card for Power XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'power',
    level: 2,
    unlocked: false,
  },
  // Will XP boosts
  willXpBoost1: {
    name: 'Will XP Boost 1',
    description: 'Draw an additional card for Will XP gains.',
    cost: 50,
    effect: 'xp_boost',
    stat: 'will',
    level: 1,
    unlocked: false,
  },
  willXpBoost2: {
    name: 'Will XP Boost 2',
    description: 'Draw an additional card for Will XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'will',
    level: 2,
    unlocked: false,
  },
  // Craft XP boosts
  craftXpBoost1: {
    name: 'Craft XP Boost 1',
    description: 'Draw an additional card for Craft XP gains.',
    cost: 50,
    effect: 'xp_boost',
    stat: 'craft',
    level: 1,
    unlocked: false,
  },
  craftXpBoost2: {
    name: 'Craft XP Boost 2',
    description: 'Draw an additional card for Craft XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'craft',
    level: 2,
    unlocked: false,
  },
  // Control XP boosts
  controlXpBoost1: {
    name: 'Control XP Boost 1',
    description: 'Draw an additional card for Control XP gains.',
    cost: 50,
    effect: 'xp_boost',
    stat: 'control',
    level: 1,
    unlocked: false,
  },
  controlXpBoost2: {
    name: 'Control XP Boost 2',
    description: 'Draw an additional card for Control XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'control',
    level: 2,
    unlocked: false,
  },
  // Currency boost
  currencyBoost: {
    name: 'Currency Boost',
    description: 'Draw an additional card for currency gains.',
    cost: 100,
    effect: 'currency_boost',
    level: 1,
    unlocked: false,
  },
  // Equipment unlocks
  dagger: {
    name: 'Unlock Dagger',
    description: 'Adds Dagger to starting weapon options.',
    cost: 50,
    effect: 'unlock_dagger',
    level: 1,
    unlocked: false,
  },
  bow: {
    name: 'Unlock Bow',
    description: 'Adds Bow to starting weapon options.',
    cost: 50,
    effect: 'unlock_bow',
    level: 1,
    unlocked: false,
  },
  staff: {
    name: 'Unlock Staff',
    description: 'Adds Staff to starting weapon options.',
    cost: 50,
    effect: 'unlock_staff',
    level: 1,
    unlocked: false,
  },
  hammer: {
    name: 'Unlock Hammer',
    description: 'Adds Hammer to starting weapon options.',
    cost: 50,
    effect: 'unlock_hammer',
    level: 1,
    unlocked: false,
  },
  medium: {
    name: 'Unlock Medium Armor',
    description: 'Adds Medium Armor to starting armor options.',
    cost: 50,
    effect: 'unlock_medium_armor',
    level: 1,
    unlocked: false,
  },
  heavy: {
    name: 'Unlock Heavy Armor',
    description: 'Adds Heavy Armor to starting armor options.',
    cost: 50,
    effect: 'unlock_heavy_armor',
    level: 1,
    unlocked: false,
  },
};

// Mapping between unlock effects and equipment
export const UNLOCK_EQUIPMENT_MAP = {
  unlock_dagger: 'dagger',
  unlock_bow: 'bow',
  unlock_staff: 'staff',
  unlock_hammer: 'hammer',
  unlock_medium_armor: 'medium',
  unlock_heavy_armor: 'heavy',
};

// ============================================================================
// GAME EVENTS & ENCOUNTERS
// ============================================================================

export const EVENTS = {
  2: {
    type: 'bane',
    icon: '🌧️',
    text: 'Misfortune',
    description: 'Negative effects await',
  },
  3: {
    type: 'fight',
    enemy: 'power',
    icon: '⚔️',
    text: 'Combat',
    description: 'Power-focused enemy',
  },
  4: {
    type: 'fight',
    enemy: 'will',
    icon: '⚔️',
    text: 'Combat',
    description: 'Will-focused enemy',
  },
  5: {
    type: 'fight',
    enemy: 'craft',
    icon: '⚔️',
    text: 'Combat',
    description: 'Craft-focused enemy',
  },
  6: {
    type: 'fight',
    enemy: 'control',
    icon: '⚔️',
    text: 'Combat',
    description: 'Control-focused enemy',
  },
  7: {
    type: 'challenge',
    stat: 'power',
    icon: '🎲',
    text: 'Challenge',
    description: 'Power stat challenge',
  },
  8: {
    type: 'challenge',
    stat: 'will',
    icon: '🎲',
    text: 'Challenge',
    description: 'Will stat challenge',
  },
  9: {
    type: 'challenge',
    stat: 'craft',
    icon: '🎲',
    text: 'Challenge',
    description: 'Craft stat challenge',
  },
  10: {
    type: 'challenge',
    stat: 'control',
    icon: '🎲',
    text: 'Challenge',
    description: 'Control stat challenge',
  },
  11: {
    type: 'nothing',
    icon: '🍂',
    text: 'Nothing',
    description: 'Nothing happens',
  },
  12: {
    type: 'rest',
    icon: '🏕️',
    text: 'Rest',
    description: 'Heal 50% of max HP',
  },
  13: {
    type: 'shop',
    icon: '⚖️',
    text: 'Shop',
    description: 'Purchase items and services',
  },
  14: {
    type: 'boon',
    icon: '🌟',
    text: 'Blessing',
    description: 'Positive effects await',
  },
  joker: {
    type: 'boss',
    icon: '🃏',
    text: 'Boss',
    description: 'Boss encounter',
  },
};

// ============================================================================
// CARD EFFECTS & REWARDS
// ============================================================================

export const BOONS = {
  A: {
    spade: {
      type: 'powerPlus',
      stat: 'power',
      value: 1,
    },
    heart: {
      type: 'willPlus',
      stat: 'will',
      value: 1,
    },
    diamond: {
      type: 'craftPlus',
      stat: 'craft',
      value: 1,
    },
    club: {
      type: 'controlPlus',
      stat: 'control',
      value: 1,
    },
  },
  K: {
    type: 'artifact',
  },
  Q: {
    type: 'artifact',
  },
  J: {
    type: 'artifact',
  },
  10: {
    type: 'removeCard',
  },
  9: {
    red: {
      type: 'removeCard',
    },
    black: {
      type: 'addCard',
    },
  },
  8: {
    type: 'addCard',
  },
  7: {
    type: 'statXpGain',
  },
  6: {
    type: 'statXpGain',
  },
  5: {
    type: 'statXpGain',
  },
  4: {
    type: 'currencyGain',
  },
  3: {
    type: 'currencyGain',
  },
  2: {
    type: 'currencyGain',
  },
  joker: {
    type: 'nothing',
  },
};

export const BANES = {
  joker: {
    type: 'addJoker',
    amount: 3,
  },
  2: {
    type: 'lostItem',
  },
  3: {
    type: 'lostStat',
  },
  4: {
    type: 'lostHighCard',
  },
  5: {
    type: 'lostFaceCard',
  },
  6: {
    type: 'addJoker',
    amount: 2,
  },
  7: {
    type: 'addJoker',
    amount: 2,
  },
  8: {
    type: 'addJoker',
    amount: 2,
  },
  9: {
    type: 'addJoker',
    amount: 1,
  },
  10: {
    type: 'addJoker',
    amount: 1,
  },
  11: {
    type: 'addJoker',
    amount: 1,
  },
  12: {
    type: 'loseCurrency',
  },
  13: {
    type: 'loseCurrency',
  },
  14: {
    type: 'loseCurrency',
  },
};

// Card adding effects for artifacts
export const CARD_ADDING_EFFECTS = {
  addAce: {
    type: 'addCard',
    card: 'A',
    amount: 1,
    description: 'Add an Ace to your deck',
  },
  twoRedKings: {
    type: 'addCards',
    cards: ['K♥', 'K♦'],
    amount: 2,
    description: 'Gain a king of diamonds and hearts',
  },
  twoBlackKings: {
    type: 'addCards',
    cards: ['K♠', 'K♣'],
    amount: 2,
    description: 'Gain a king of spades and clubs',
  },
  twoRedQueens: {
    type: 'addCards',
    cards: ['Q♥', 'Q♦'],
    amount: 2,
    description: 'Gain a queen of diamonds and hearts',
  },
  twoBlackQueens: {
    type: 'addCards',
    cards: ['Q♠', 'Q♣'],
    amount: 2,
    description: 'Gain a queen of spades and clubs',
  },
  twoRedJacks: {
    type: 'addCards',
    cards: ['J♥', 'J♦'],
    amount: 2,
    description: 'Gain a jack of diamonds and hearts',
  },
  twoBlackJacks: {
    type: 'addCards',
    cards: ['J♠', 'J♣'],
    amount: 2,
    description: 'Gain a jack of spades and clubs',
  },
  twoRedTens: {
    type: 'addCards',
    cards: ['10♥', '10♦'],
    amount: 2,
    description: 'Gain a 10 of diamonds and hearts',
  },
  twoBlackTens: {
    type: 'addCards',
    cards: ['10♠', '10♣'],
    amount: 2,
    description: 'Gain a 10 of spades and clubs',
  },
  twoRedNines: {
    type: 'addCards',
    cards: ['9♥', '9♦'],
    amount: 2,
    description: 'Gain a 9 of diamonds and hearts',
  },
  twoBlackNines: {
    type: 'addCards',
    cards: ['9♠', '9♣'],
    amount: 2,
    description: 'Gain a 9 of spades and clubs',
  },
};

export const ARTIFACTS = {
  A: {
    name: 'Lucky Charm',
    type: 'addAce',
  },
  K: {
    type: 'random',
    pool: [
      {
        name: 'Power Totem',
        type: 'willPlusTwo',
      },
      {
        name: 'Will Totem',
        type: 'powerPlusTwo',
      },
      {
        name: 'Craft Totem',
        type: 'craftPlusTwo',
      },
      {
        name: 'Control Totem',
        type: 'controlPlusTwo',
      },
    ],
  },
  Q: {
    type: 'random',
    pool: [
      {
        name: 'Power Totem',
        type: 'willPlusTwo',
      },
      {
        name: 'Will Totem',
        type: 'powerPlusTwo',
      },
      {
        name: 'Craft Totem',
        type: 'craftPlusTwo',
      },
      {
        name: 'Control Totem',
        type: 'controlPlusTwo',
      },
    ],
  },
  J: {
    black: {
      type: 'random',
      pool: [
        {
          name: 'Power Totem',
          type: 'willPlusTwo',
        },
        {
          name: 'Will Totem',
          type: 'powerPlusTwo',
        },
        {
          name: 'Craft Totem',
          type: 'craftPlusTwo',
        },
        {
          name: 'Control Totem',
          type: 'controlPlusTwo',
        },
      ],
    },
    red: {
      type: 'equipment',
      equipmentType: 'needle',
    },
  },
  10: {
    type: 'random',
    pool: [
      {
        name: 'Power Charm',
        type: 'willPlusOne',
      },
      {
        name: 'Will Charm',
        type: 'powerPlusOne',
      },
      {
        name: 'Craft Charm',
        type: 'craftPlusOne',
      },
      {
        name: 'Control Charm',
        type: 'controlPlusOne',
      },
    ],
  },
  9: {
    red: {
      type: 'equipment',
      equipmentType: 'shield',
    },
    black: {
      name: 'Charm of Wisdom',
      type: 'xpBoost',
    },
  },
  8: {
    black: {
      name: 'Scrapper Bot',
      type: 'currencyBoost',
    },
    diamond: {
      name: 'Bloody Magistone',
      type: 'twoRedKings',
      description: 'Gain a king of diamonds and hearts.',
    },
    heart: {
      name: 'Void Magistone',
      type: 'twoBlackKings',
      description: 'Gain a king of spades and clubs.',
    },
  },
  7: {
    diamond: {
      name: 'Bloody Sigil',
      type: 'twoRedQueens',
      description: 'Gain a queen of diamonds and hearts.',
    },
    heart: {
      name: 'Void Sigil',
      type: 'twoBlackQueens',
      description: 'Gain a queen of spades and clubs.',
    },
    spade: {
      name: 'Bloody Totem',
      type: 'twoRedJacks',
      description: 'Gain a jack of diamonds and hearts.',
    },
    club: {
      name: 'Void Totem',
      type: 'twoBlackJacks',
      description: 'Gain a jack of spades and clubs.',
    },
  },
  6: {
    diamond: {
      name: 'Bloody Charm',
      type: 'twoRedTens',
      description: 'Gain a 10 of diamonds and hearts.',
    },
    heart: {
      name: 'Void Charm',
      type: 'twoBlackTens',
      description: 'Gain a 10 of spades and clubs.',
    },
    spade: {
      name: 'Bloody Trinket',
      type: 'twoRedNines',
      description: 'Gain a 9 of diamonds and hearts.',
    },
    club: {
      name: 'Void Trinket',
      type: 'twoBlackNines',
      description: 'Gain a 9 of spades and clubs.',
    },
  },
  5: {
    red: {
      type: 'equipment',
      equipmentType: 'heavy',
    },
    black: {
      type: 'equipment',
      equipmentType: 'medium',
    },
  },
  4: {
    red: {
      type: 'equipment',
      equipmentType: 'light',
    },
    black: {
      type: 'equipment',
      equipmentType: 'hammer',
    },
  },
  3: {
    red: {
      type: 'equipment',
      equipmentType: 'staff',
    },
    black: {
      type: 'equipment',
      equipmentType: 'bow',
    },
  },
  2: {
    red: {
      type: 'equipment',
      equipmentType: 'dagger',
    },
    black: {
      type: 'equipment',
      equipmentType: 'sword',
    },
  },
};

// Card display symbols for random card generation
export const CARD_DISPLAY_SYMBOLS = [
  { value: '2', suit: '♠️', display: '2♠️' },
  { value: '3', suit: '♠️', display: '3♠️' },
  { value: '4', suit: '♠️', display: '4♠️' },
  { value: '5', suit: '♠️', display: '5♠️' },
  { value: '6', suit: '♠️', display: '6♠️' },
  { value: '7', suit: '♠️', display: '7♠️' },
  { value: '8', suit: '♠️', display: '8♠️' },
  { value: '9', suit: '♠️', display: '9♠️' },
  { value: '10', suit: '♠️', display: '10♠️' },
  { value: 'J', suit: '♠️', display: 'J♠️' },
  { value: 'Q', suit: '♠️', display: 'Q♠️' },
  { value: 'K', suit: '♠️', display: 'K♠️' },
  { value: 'A', suit: '♠️', display: 'A♠️' },
  { value: '2', suit: '♥️', display: '2♥️' },
  { value: '3', suit: '♥️', display: '3♥️' },
  { value: '4', suit: '♥️', display: '4♥️' },
  { value: '5', suit: '♥️', display: '5♥️' },
  { value: '6', suit: '♥️', display: '6♥️' },
  { value: '7', suit: '♥️', display: '7♥️' },
  { value: '8', suit: '♥️', display: '8♥️' },
  { value: '9', suit: '♥️', display: '9♥️' },
  { value: '10', suit: '♥️', display: '10♥️' },
  { value: 'J', suit: '♥️', display: 'J♥️' },
  { value: 'Q', suit: '♥️', display: 'Q♥️' },
  { value: 'K', suit: '♥️', display: 'K♥️' },
  { value: 'A', suit: '♥️', display: 'A♥️' },
  { value: '2', suit: '♦️', display: '2♦️' },
  { value: '3', suit: '♦️', display: '3♦️' },
  { value: '4', suit: '♦️', display: '4♦️' },
  { value: '5', suit: '♦️', display: '5♦️' },
  { value: '6', suit: '♦️', display: '6♦️' },
  { value: '7', suit: '♦️', display: '7♦️' },
  { value: '8', suit: '♦️', display: '8♦️' },
  { value: '9', suit: '♦️', display: '9♦️' },
  { value: '10', suit: '♦️', display: '10♦️' },
  { value: 'J', suit: '♦️', display: 'J♦️' },
  { value: 'Q', suit: '♦️', display: 'Q♦️' },
  { value: 'K', suit: '♦️', display: 'K♦️' },
  { value: 'A', suit: '♦️', display: 'A♦️' },
  { value: '2', suit: '♣️', display: '2♣️' },
  { value: '3', suit: '♣️', display: '3♣️' },
  { value: '4', suit: '♣️', display: '4♣️' },
  { value: '5', suit: '♣️', display: '5♣️' },
  { value: '6', suit: '♣️', display: '6♣️' },
  { value: '7', suit: '♣️', display: '7♣️' },
  { value: '8', suit: '♣️', display: '8♣️' },
  { value: '9', suit: '♣️', display: '9♣️' },
  { value: '10', suit: '♣️', display: '10♣️' },
  { value: 'J', suit: '♣️', display: 'J♣️' },
  { value: 'Q', suit: '♣️', display: 'Q♣️' },
  { value: 'K', suit: '♣️', display: 'K♣️' },
  { value: 'A', suit: '♣️', display: 'A♣️' },
];

// Helper function to get a random card display symbol
export function getRandomCardDisplay() {
  return CARD_DISPLAY_SYMBOLS[
    Math.floor(Math.random() * CARD_DISPLAY_SYMBOLS.length)
  ];
}

// Helper function to get card value from card object
export function getCardValue(cardObject) {
  const textToValue = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    10: 10,
    9: 9,
    8: 8,
    7: 7,
    6: 6,
    5: 5,
    4: 4,
    3: 3,
    2: 2,
  };

  return textToValue[cardObject.value] || 11;
}

// Suit symbol mapping for API conversion
export const SUIT_SYMBOL_MAP = {
  HEARTS: '♥️',
  DIAMONDS: '♦️',
  CLUBS: '♣️',
  SPADES: '♠️',
};

// ============================================================================
// ENEMIES & COMBAT
// ============================================================================

export const ENEMIES = {
  regular: {
    power: {
      name: 'Power-focused Enemy',
      type: 'power',
      weapon: ['sword'],
      baseStats: { power: 3, will: 2, craft: 2, control: 2 },
    },
    will: {
      name: 'Will-focused Enemy',
      type: 'will',
      weapon: ['staff'],
      baseStats: { power: 2, will: 3, craft: 2, control: 2 },
    },
    craft: {
      name: 'Craft-focused Enemy',
      type: 'craft',
      weapon: ['sword', 'staff', 'hammer'],
      baseStats: { power: 2, will: 2, craft: 3, control: 2 },
    },
    control: {
      name: 'Control-focused Enemy',
      type: 'control',
      weapon: ['hammer'],
      baseStats: { power: 2, will: 2, craft: 2, control: 3 },
    },
  },
  bosses: {
    1: {
      name: 'Jack of Steel',
      realm: 'steel',
      baseStats: { power: 8, will: 8, craft: 8, control: 8 },
      weapon: ['sword'],
    },
    2: {
      name: 'Queen of Blood',
      realm: 'blood',
      baseStats: { power: 10, will: 10, craft: 10, control: 10 },
      weapon: ['staff'],
    },
    3: {
      name: 'King of Ash',
      realm: 'ash',
      baseStats: { power: 12, will: 12, craft: 12, control: 12 },
      weapon: ['hammer'],
    },
    4: {
      name: 'Ace of Speed',
      realm: 'speed',
      baseStats: { power: 14, will: 14, craft: 14, control: 14 },
      weapon: ['bow', 'sword'],
      multiWield: true,
    },
  },
};

// ============================================================================
// ECONOMY & SHOPPING
// ============================================================================

export const SHOP_PRICES = {
  // Costs all +1 per challenge modifier
  basicHeal: 10, // heal 10
  cardRemoval: 25,
  equipmentOne: 25,
  equipmentTwo: 30,
  equipmentThree: 35,
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Card System
  CARD_VALUES,
  CARD_COLORS,
  CARD_RANGES,
  FACE_CARDS,
  ACE,
  CARD_SUITS,
  CARD_UNICODE_MAP,
  CARD_BACK_SYMBOL,
  getCardUnicode,
  getCardValueFromUnicode,
  isRedCard,
  getRandomCardDisplay,
  getCardValue,

  // Game Configuration
  GAME_CONSTANTS,
  STARTING_STATS,
  LEVELING_THRESHOLDS,
  STAT_CHALLENGE_BASE,
  LEVEL_CARD_COUNT_PER_MODIFIER,
  STAT_EFFECTS,

  // Realms & Progression
  REALMS,
  CHALLENGE_MODIFIERS,

  // Equipment System
  EQUIPMENT,
  EQUIPMENT_REFERENCE,
  STARTING_EQUIPMENT,

  // Upgrades & Progression
  HOME_REALM_UPGRADES,
  UNLOCK_EQUIPMENT_MAP,

  // Game Events & Encounters
  EVENTS,

  // Card Effects & Rewards
  BOONS,
  BANES,
  CARD_ADDING_EFFECTS,
  ARTIFACTS,

  // Enemies & Combat
  ENEMIES,

  // Economy & Shopping
  SHOP_PRICES,

  // Suit Symbol Mapping
  SUIT_SYMBOL_MAP,
};
