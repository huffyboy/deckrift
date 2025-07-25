// ============================================================================
// GAME CONSTANTS
// ============================================================================
// Static game data and configuration values
// ============================================================================

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
  𝕁: 0,
};

// Negative card value mappings for negative effects (inverted scale)
export const NEGATIVE_CARD_VALUES = {
  𝕁: 14, // Joker becomes 14 (bad - maximum loss)
  K: 13, // King stays 13
  Q: 12, // Queen stays 12
  J: 11, // Jack stays 11
  10: 10, // 10 stays 10
  9: 9, // 9 stays 9
  8: 8, // 8 stays 8
  7: 7, // 7 stays 7
  6: 6, // 6 stays 6
  5: 5, // 5 stays 5
  4: 4, // 4 stays 4
  3: 3, // 3 stays 3
  2: 2, // 2 stays 2
  A: 1, // Ace becomes 1 (good - minimal loss)
};

// Card color mappings
export const CARD_COLORS = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

// Suit color mappings (for both symbols and names)
export const SUIT_COLORS = {
  '♠': 'black',
  '♥': 'red',
  '♦': 'red',
  '♣': 'black',
  spades: 'black',
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
};

// Suit symbol to name mappings
export const SUIT_SYMBOL_TO_NAME = {
  '♠': 'spade',
  '♥': 'heart',
  '♦': 'diamond',
  '♣': 'club',
};

// Suit name to symbol mappings
export const SUIT_NAME_TO_SYMBOL = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
};

// Standard deck suits
export const STANDARD_SUITS = ['♠', '♥', '♦', '♣'];

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

// Unicode to card value mapping
export const UNICODE_TO_VALUE_MAP = {
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
  '🃟': '𝕁',
};

// Red card Unicode symbols (hearts and diamonds)
export const RED_CARD_UNICODES = [
  '🂱',
  '🂲',
  '🂳',
  '🂴',
  '🂵',
  '🂶',
  '🂷',
  '🂸',
  '🂹',
  '🂺',
  '🂻',
  '🂽',
  '🂾',
  '🃁',
  '🃂',
  '🃃',
  '🃄',
  '🃅',
  '🃆',
  '🃇',
  '🃈',
  '🃉',
  '🃊',
  '🃋',
  '🃍',
  '🃎',
];

// Text to numeric value mapping
export const TEXT_TO_VALUE_MAP = {
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
  '𝕁': 0, // Joker value
};

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
// Joker are represented as 𝕁
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

// XP and Leveling Constants
export const XP_CONSTANTS = {
  BASE_XP_THRESHOLD: 40, // Base XP needed per level
  LEVEL_OFFSET: 4, // Level offset for XP calculation (targetLevel - 4)
  XP_FORMULA: (targetLevel) => 40 * (targetLevel - 4), // XP threshold formula
};

// Challenge System Constants
export const CHALLENGE_CONSTANTS = {
  BASE_DIFFICULTY: 12, // Base challenge difficulty
  DIFFICULTY_FORMULA: (challengeModifier) => 12 + challengeModifier, // Challenge difficulty formula
};

// Animation and UI Timing Constants
export const ANIMATION_TIMING = {
  CARD_FLIP_DELAY: 500, // Delay for card flip animations (ms)
  DRAWING_ANIMATION_DELAY: 1000, // Delay for card drawing animations (ms)
  MESSAGE_TIMEOUT: 4000, // Default message timeout (ms)
  ARTIFACT_DRAW_DELAY: 500, // Delay for artifact drawing (ms)
};

// UI Messages and Notifications
export const UI_MESSAGES = {
  // Event Messages
  EVENTS: {
    NOTHING: {
      title: 'Nothing Happens',
      message: 'You find nothing of interest in this place.',
      type: 'nothing',
      icon: '🍂',
    },
    REST: {
      title: 'Rest Complete',
      message: 'You rest and recover {amount} health.',
      type: 'success',
      icon: '🏕️',
    },
    BOON: {
      title: 'Boon Received',
      message: 'You receive a beneficial effect!',
      type: 'success',
      icon: '🌟',
    },
    BANE: {
      title: 'Bane Received',
      message: 'You suffer a negative effect!',
      type: 'error',
      icon: '🌧️',
    },
    BLESSING: {
      title: 'Blessing',
      message:
        'The fates smile upon you! Draw a card from your deck to receive a boon.',
      type: 'success',
      icon: '✨',
    },
    MISFORTUNE: {
      title: 'Misfortune',
      message:
        'The fates frown upon you! Draw a card from your deck to receive a bane.',
      type: 'error',
      icon: '🌩️',
    },
  },

  // Encounter Messages
  ENCOUNTERS: {
    BATTLE: {
      title: 'Battle Encounter',
      message: 'A {enemyType}-focused enemy appears!',
      type: 'warning',
    },
    CHALLENGE: {
      title: 'Stat Challenge',
      message: 'You must prove your {statType}!',
      type: 'info',
    },
    SHOP: {
      title: 'Shop Encounter',
      message: 'A merchant offers their wares.',
      type: 'info',
    },
    BOSS: {
      title: 'Boss Battle',
      message: 'A powerful boss appears!',
      type: 'warning',
    },
  },

  // Challenge Messages
  CHALLENGE: {
    INITIAL: {
      title: '{statType} Challenge',
      message:
        'Circumstances require you to exert your {statType}. See if you can meet the challenge.',
      type: 'warning',
      icon: '🎲',
    },
    SUCCESS: {
      title: 'Challenge Succeeded!',
      message: 'You gain {xp} {stat} XP. Draw a card to determine your boon.',
      type: 'success',
      icon: '🎯',
    },
    FAILURE: {
      title: 'Challenge Failed!',
      message: 'You failed. Draw a card to determine your bane.',
      type: 'error',
      icon: '💥',
    },
    NO_BOON: {
      title: 'No Boon Available',
      message: 'You succeeded in the challenge but no boon was available.',
      type: 'info',
      icon: '🎯',
    },
    NO_BANE: {
      title: 'No Bane Available',
      message: 'You failed the challenge but no bane was available.',
      type: 'info',
      icon: '💥',
    },
  },

  // Level Up Messages
  LEVEL_UP: {
    TITLE: '{statName} Level Up!',
    MESSAGE: 'Your {statName} increased from {oldLevel} to {newLevel}!',
    TYPE: 'success',
  },

  // Inventory Messages
  INVENTORY: {
    OVERFLOW: {
      title: 'Inventory Overflow',
      message:
        'You have {count} more item{plural} than your inventory can hold. Choose which item{plural} to remove:',
    },
    REMOVED: {
      title: 'Removed: {items}',
      type: 'info',
    },
  },

  // Card Effect Messages
  CARD_EFFECTS: {
    NO_XP_JOKER: 'You draw a joker and gain no experience.',
    NO_CURRENCY_JOKER: 'You draw a joker and gain no currency.',
    NO_CARD_JOKER: 'You draw a joker and gain no new card.',
    XP_GAIN: 'You gained {amount} {stat} XP.',
    CURRENCY_GAIN: 'You gained {amount} currency.',
    CURRENCY_LOSS: 'Lost {amount} currency ({card})',
    STAT_LOSS: 'Lost 1 {stat} ({card})',
    CARD_ADDED: 'Added {card} to your deck.',
    CARD_REMOVED: 'Removed {card} from your deck.',
    CARD_LOST: 'You lose your {card}.',
    HIGH_CARD_LOST: 'Lost {card} (high card)',
    FACE_CARD_LOST: 'Lost {card} (face card)',
    NO_HIGH_CARDS: 'You have no high cards to lose',
    NO_FACE_CARDS: 'You have no face cards to lose',
    NO_CURRENCY: 'You have no currency to lose',
    NO_ITEMS: 'You have no items to lose',
    EMPTY_POCKETS: {
      title: 'Empty pockets',
      message: 'You realize you had nothing to lose.',
    },
    MISSING_TREASURE: {
      title: 'Missing treasure',
      message: 'You lost what little you had.',
    },
    MISSING_TREASURE_FULL: {
      title: 'Missing treasure',
      message: 'You draw {card} and lose {amount} currency.',
    },
    DRAW_AND_LOSE_CURRENCY: 'You draw {card} and lose {amount} currency.',
    DRAW_AND_LOSE_STAT: 'You drew {card} and lose 1 {stat}.',
    DRAW_NO_ARTIFACT: 'You draw {card} but find no artifact.',
    NOTHING_HAPPENS: 'Nothing happens',
    OR_SO_YOU_THOUGHT:
      'Or so you thought, you have nothing worthwhile to lose.',
    LOST_ITEM: 'Lost {itemName} ({itemType})',
    STAT_LOSS_TRIGGERED: 'Stat loss effect triggered',
    CURRENCY_GAIN_TRIGGERED: 'Currency gain effect triggered',
    STAT_XP_GAIN_TRIGGERED: 'Stat XP gain effect triggered',
    ADD_JOKER: 'Add {amount} joker{plural} to your deck.',
  },

  // Artifact Messages
  ARTIFACTS: {
    GAINED: 'Gained {emoji} {name}!',
    NO_ARTIFACT: 'You draw {card} but find no artifact.',
    NO_ARTIFACT_FOUND: 'No artifact found for {card}.',
    NO_ARTIFACT_DETAILS: 'No artifact details found for {key}.',
    RANDOM_ARTIFACT: 'Gained a random artifact',
    EQUIPMENT_GAINED: 'Gained equipment: {type}',
  },

  // Boon Effect Headers
  BOON_HEADERS: {
    DISCOVER_POTENTIAL: 'You discover new potential',
    FIND_ARTIFACT: 'You find an artifact',
    PURGE_WEAKNESS: 'You attempt to purge your weakness',
    FIND_TREASURE: 'You find a bit of treasure',
    LEARN_SOMETHING: 'You learn something new',
  },

  // Bane Effect Headers
  BANE_HEADERS: {
    FEEL_WEAKER: 'You feel a bit weaker',
  },

  // Error Messages
  ERRORS: {
    DECK_SAVE_FAILED: 'Failed to save player deck',
    DECK_SAVE_SUCCESS: 'Successfully saved deck',
    GAME_SAVE_FAILED: 'Failed to save game state',
    ARTIFACT_EFFECT_FAILED: 'Failed to apply artifact effects',
    ARTIFACT_REMOVE_FAILED: 'Failed to remove artifact effects',
    CARD_REMOVE_FAILED: 'Failed to remove {card} from your deck.',
    UNKNOWN_BOON_EFFECT: 'Unknown boon effect',
    UNKNOWN_BANE_EFFECT: 'Unknown bane effect',
  },
};

export const STARTING_STATS = {
  power: 4,
  will: 4,
  craft: 4,
  focus: 4,
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
    description: 'Increases damage dealt in combat.',
    icon: '💪',
    name: 'Power',
  },
  will: {
    hpPerPoint: 10,
    description: 'Determines your maximum health (10 HP per point).',
    icon: '💙',
    name: 'Will',
  },
  craft: {
    equipmentSlots: 1,
    description: 'Determines your inventory capacity.',
    icon: '⚒️',
    name: 'Craft',
  },
  focus: {
    handSizePerPoint: 1,
    minHandSize: 2,
    description: 'Determines your hand size.',
    icon: '🧠',
    name: 'Focus',
  },
};

// Message utility functions moved to utils.js

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
      'The underbelly rages for a chance to race. A chance at freedom. ' +
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

// ============================================================================
// EQUIPMENT SYSTEM
// ============================================================================

export const EQUIPMENT = {
  // Effect to damage multiplier mapping
  effectToMultiplier: {
    noDamage: 0,
    quarterDamage: 0.25,
    halfDamage: 0.5,
    threeQuarterDamage: 0.75,
    fullDamage: 1.0,
    doubleDamage: 2.0,
    instantKill: 999, // Special case for instant kill
    healSelf: 1.0, // Heal amount equals damage that would have been dealt
  },
  weapons: {
    sword: {
      name: 'Sword',
      description: 'More accurate, but slightly weaker than other weapons.',
      baseHitRate: '76.92%',
      baseDamageOutput: '0.5 * Power',
      cardCondition:
        'Deals half damage on 5-10, full damage on Jack through Ace',
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
      cardCondition: 'Deals damage only on red cards (hearts, diamonds) or Ace',
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
      cardCondition: 'Hits on 2-6, Ace deals double damage',
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
      cardCondition: 'Hearts heal you, diamonds and Ace deal damage',
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
      name: 'Warhammer',
      description: 'What it lacks in accuracy it makes up in power.',
      baseHitRate: '30.77%',
      baseDamageOutput: '0.62 * Power',
      cardCondition:
        'Only hits on face cards (Jack, Queen, King) and Ace, but deals double damage',
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
      cardCondition: 'Only Ace hits - instantly kills non-boss enemies',
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
    // Special case: No weapon equipped
    none: {
      name: 'No Weapon',
      description: 'Fighting without a weapon reduces your effectiveness.',
      baseHitRate: '30.77%', // 16/52 cards hit (J, Q, K, A)
      baseDamageOutput: '0.192 * Power', // Average damage: (12×0.5 + 4×1.0) / 52 = 10/52
      cardCondition:
        'Face cards (Jack, Queen, King) deal half damage, Ace deals full damage',
      hitEffects: [
        {
          condition: {
            type: 'range',
            from: 11,
            to: 13, // J, Q, K (face cards)
          },
          effect: 'halfDamage',
        },
        {
          condition: {
            type: 'card',
            value: 'A',
          },
          effect: 'fullDamage',
        },
      ],
      isNoWeapon: true, // Flag to identify this special case
    },
  },
  armor: {
    light: {
      name: 'Light Armor',
      description: 'Greater mobility, but no real defense.',
      triggerRate: '30.77%',
      damageMitigation: '~31%',
      cardCondition:
        'Dodges all damage on face cards (Jack, Queen, King) and Ace',
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
      cardCondition:
        'Dodges all damage on Ace, reduces damage by half on 7 through King',
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
        'Dodges all damage on Ace, reduces damage by 75% on Queen-King, 50% on 9-Jack, 25% on 5-8',
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
      cardCondition: 'Reduces damage by 75% on cards 5-8',
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
  none: { type: 'weapon', category: 'special', isNoWeapon: true },

  // Armor
  light: { type: 'armor', category: 'basic' },
  medium: { type: 'armor', category: 'basic' },
  heavy: { type: 'armor', category: 'basic' },
  shield: { type: 'armor', category: 'special', runExclusive: true },
};

// Starting equipment (always available)
export const STARTING_EQUIPMENT = [
  {
    type: 'weapon',
    value: 'sword',
  },
  {
    type: 'armor',
    value: 'light',
  },
];

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
    icon: '💪',
  },
  powerXpBoost2: {
    name: 'Power XP Boost 2',
    description: 'Draw an additional card for Power XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'power',
    level: 2,
    unlocked: false,
    icon: '💪',
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
    icon: '👊',
  },
  willXpBoost2: {
    name: 'Will XP Boost 2',
    description: 'Draw an additional card for Will XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'will',
    level: 2,
    unlocked: false,
    icon: '👊',
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
    icon: '🦾',
  },
  craftXpBoost2: {
    name: 'Craft XP Boost 2',
    description: 'Draw an additional card for Craft XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'craft',
    level: 2,
    unlocked: false,
    icon: '🦾',
  },
  // Focus XP boosts
  focusXpBoost1: {
    name: 'Focus XP Boost 1',
    description: 'Draw an additional card for Focus XP gains.',
    cost: 50,
    effect: 'xp_boost',
    stat: 'focus',
    level: 1,
    unlocked: false,
    icon: '🧠',
  },
  focusXpBoost2: {
    name: 'Focus XP Boost 2',
    description: 'Draw an additional card for Focus XP gains.',
    cost: 100,
    effect: 'xp_boost',
    stat: 'focus',
    level: 2,
    unlocked: false,
    icon: '🧠',
  },
  // Currency boost
  currencyBoost: {
    name: 'Currency Boost',
    description: 'Draw an additional card for currency gains.',
    cost: 100,
    effect: 'currency_boost',
    level: 1,
    unlocked: false,
    icon: '💎',
  },
  // Equipment unlocks
  dagger: {
    name: 'Unlock Dagger',
    description: 'Adds Dagger to starting weapon options.',
    cost: 50,
    effect: 'unlock_dagger',
    level: 1,
    unlocked: false,
    icon: '🗡️',
  },
  bow: {
    name: 'Unlock Bow',
    description: 'Adds Bow to starting weapon options.',
    cost: 50,
    effect: 'unlock_bow',
    level: 1,
    unlocked: false,
    icon: '🏹',
  },
  staff: {
    name: 'Unlock Staff',
    description: 'Adds Staff to starting weapon options.',
    cost: 50,
    effect: 'unlock_staff',
    level: 1,
    unlocked: false,
    icon: '🦯',
  },
  hammer: {
    name: 'Unlock Warhammer',
    description: 'Adds Warhammer to starting weapon options.',
    cost: 50,
    effect: 'unlock_hammer',
    level: 1,
    unlocked: false,
    icon: '🔨',
  },
  medium: {
    name: 'Unlock Medium Armor',
    description: 'Adds Medium Armor to starting armor options.',
    cost: 50,
    effect: 'unlock_medium_armor',
    level: 1,
    unlocked: false,
    icon: '🛡️',
  },
  heavy: {
    name: 'Unlock Heavy Armor',
    description: 'Adds Heavy Armor to starting armor options.',
    cost: 50,
    effect: 'unlock_heavy_armor',
    level: 1,
    unlocked: false,
    icon: '🛡️',
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
    icon: '🌩️',
    text: 'Misfortune',
    description: 'Negative effects await',
  },
  3: {
    type: 'fight',
    enemy: 'power',
    icon: '⚔️',
    text: 'Combat',
    description: 'Power-based enemy',
  },
  4: {
    type: 'fight',
    enemy: 'will',
    icon: '⚔️',
    text: 'Combat',
    description: 'Will-based enemy',
  },
  5: {
    type: 'fight',
    enemy: 'craft',
    icon: '⚔️',
    text: 'Combat',
    description: 'Craft-based enemy',
  },
  6: {
    type: 'fight',
    enemy: 'focus',
    icon: '⚔️',
    text: 'Combat',
    description: 'Focus-based enemy',
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
    stat: 'focus',
    icon: '🎲',
    text: 'Challenge',
    description: 'Focus stat challenge',
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
    text: 'Fortune',
    description: 'Positive effects await',
  },
  '𝕁': {
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
      type: 'focusPlus',
      stat: 'focus',
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
  '𝕁': {
    type: 'nothing',
  },
};

export const BANES = {
  '𝕁': {
    type: 'addJoker',
    amount: 3,
  },
  2: {
    type: 'loseItem',
  },
  3: {
    type: 'loseStat',
  },
  4: {
    type: 'loseHighCard',
  },
  5: {
    type: 'loseFaceCard',
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
  J: {
    type: 'addJoker',
    amount: 1,
  },
  Q: {
    type: 'loseCurrency',
  },
  K: {
    type: 'loseCurrency',
  },
  A: {
    type: 'loseCurrency',
  },
};

// Suit to stat mapping for bane effects
export const SUIT_TO_STAT_MAP = {
  // Unicode symbols
  '♠': 'power', // Spades -> Power
  '♥': 'will', // Hearts -> Will
  '♦': 'craft', // Diamonds -> Craft
  '♣': 'focus', // Clubs -> Focus

  // Emoji versions
  '♠️': 'power', // Spades -> Power
  '♥️': 'will', // Hearts -> Will
  '♦️': 'craft', // Diamonds -> Craft
  '♣️': 'focus', // Clubs -> Focus

  // String suit names (for database compatibility)
  spades: 'power', // Spades -> Power
  hearts: 'will', // Hearts -> Will
  diamonds: 'craft', // Diamonds -> Craft
  clubs: 'focus', // Clubs -> Focus
};

export const BANE_AND_BOON_EFFECTS = {
  // ============================================================================
  // BANE EFFECTS WITH SECOND DRAWS
  // ============================================================================
  // Some bane effects require a second card draw to determine the specific outcome.
  // The secondDrawDeck property specifies which deck to draw from:
  // - 'player': Draw from the player's full personal deck (for loseCurrency)
  // - 'playerHighCards': Draw from filtered high cards (10, J, Q, K, A) in player's personal deck (for loseHighCard)
  // - 'playerFaceCards': Draw from filtered face cards (J, Q, K) in player's personal deck (for loseFaceCard)
  // - 'standard': Draw from a standard 52-card deck (for initial event draws)
  // ============================================================================

  powerPlus: {
    header: 'You gain a surge of power',
    description: 'Add 1 to your power for the rest of the run.',
    stat: 'power',
    icon: '💪',
  },
  willPlus: {
    header: 'You feel a wave of determination',
    description: 'Add 1 to your will for the rest of the run.',
    stat: 'will',
    icon: '👊',
  },
  craftPlus: {
    header: 'You feel a spark of creativity',
    description: 'Add 1 to your craft for the rest of the run.',
    stat: 'craft',
    icon: '🦾',
  },
  focusPlus: {
    header: 'You gain a burst of clarity',
    description: 'Add 1 to your focus for the rest of the run.',
    stat: 'focus',
    icon: '🧠',
  },
  artifact: {
    header: 'You find an artifact',
    description: 'Draw a card to determine which artifact you gain.',
    secondDrawMessage: 'You draw {card} and gain {artifact}.',
    secondDrawDeck: 'standard', // Draw from standard deck
    icon: '🏺',
  },
  removeCard: {
    header: 'You attempt to purge your weakness',
    description:
      'Draw a hand of cards from your deck to potentially remove one.',
    secondDrawMessage: 'Would you like to remove {card} from your deck?',
    secondDrawDeck: 'player', // Draw from player's deck
    icon: '🔥',
  },
  addCard: {
    header: 'You discover new potential',
    description: 'Draw a hand of cards to potentially add one to your deck.',
    secondDrawMessage: 'Would you like to add {card} to your deck?',
    secondDrawDeck: 'standard', // Draw from standard deck
    icon: '🎴',
  },
  currencyGain: {
    header: 'You find a bit of treasure',
    description: 'Draw another card to determine how much currency to gain.',
    secondDrawMessage: 'You draw {card} and gain {amount} currency.',
    secondDrawDeck: 'player', // Draw from player's deck
    icon: '💎',
  },
  nothing: {
    header: 'Nothing happens',
    description: 'You were sure something was going to happen.',
    icon: '🌀',
  },
  statXpGain: {
    header: 'You learn something new',
    description: 'Draw a card worth of expereince.',
    secondDrawMessage: 'You draw {card} and gain {amount} {stat} XP.',
    secondDrawDeck: 'player', // Draw from player's deck
    icon: '📚',
  },
  loseItem: {
    header: 'One of your equipment has gone missing',
    description: 'Lose a random item from your inventory.',
    icon: '🕳️',
  },
  loseStat: {
    header: 'You feel a bit weaker',
    description: 'Draw a card to determine which stat to lose.',
    secondDrawMessage: 'You draw {card} and lose {stat}.',
    secondDrawDeck: 'player', // Draw from player's deck
    icon: '💔',
  },
  loseHighCard: {
    header: 'You lose some clarity',
    description: 'Lose a random high card from your deck.',
    secondDrawDeck: 'playerHighCards', // Draw from filtered high cards in player's personal deck
    secondDrawMessage: 'You lost your {card} from your deck.',
    icon: '🌩️',
  },
  loseFaceCard: {
    header: 'Your luck is fading',
    description: 'Lose a random face card in your deck.',
    secondDrawDeck: 'playerFaceCards', // Draw from filtered face cards in player's personal deck
    secondDrawMessage: 'You lost your {card} from your deck.',
    icon: '⛈️',
  },
  loseCurrency: {
    header: 'Some treasure has gone missing',
    description: 'Draw another card to determine how much currency to lose.',
    secondDrawMessage: 'You draw {card} and lose {amount} currency.',
    secondDrawDeck: 'player', // Draw from player's deck
    icon: '💸',
    // New messaging for different currency loss scenarios
    messages: {
      noCurrency: {
        title: 'Empty pockets',
        message: 'You realize you had nothing to lose.',
      },
      partialLoss: {
        title: 'Missing treasure',
        message: 'You lost what little you had.',
      },
      fullLoss: {
        title: 'Missing treasure',
        message: 'You draw {card} and lose {amount} currency.',
      },
    },
  },
  addJoker: {
    header: 'You have been cursed',
    description: 'Add 1 joker to your deck.',
    icon: '🃏',
  },
};

// Card adding effects for artifacts
export const CARD_ADDING_EFFECTS = {
  addSpadeAce: {
    type: 'addCard',
    card: 'A♠',
    amount: 1,
    description: 'Add an Ace of Spades to your deck',
  },
  addHeartAce: {
    type: 'addCard',
    card: 'A♥',
    amount: 1,
    description: 'Add an Ace of Hearts to your deck',
  },
  addDiamondAce: {
    type: 'addCard',
    card: 'A♦',
    amount: 1,
    description: 'Add an Ace of Diamonds to your deck',
  },
  addClubAce: {
    type: 'addCard',
    card: 'A♣',
    amount: 1,
    description: 'Add an Ace of Clubs to your deck',
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

// ============================================================================
// ARTIFACT SYSTEM
// ============================================================================

// Card definitions for artifact effects
export const CARD_EFFECTS = {
  addSpadeAce: [{ value: 'A', suit: '♠' }],
  addHeartAce: [{ value: 'A', suit: '♥' }],
  addDiamondAce: [{ value: 'A', suit: '♦' }],
  addClubAce: [{ value: 'A', suit: '♣' }],
  twoRedKings: [
    { value: 'K', suit: '♥' },
    { value: 'K', suit: '♦' },
  ],
  twoBlackKings: [
    { value: 'K', suit: '♠' },
    { value: 'K', suit: '♣' },
  ],
  twoRedQueens: [
    { value: 'Q', suit: '♥' },
    { value: 'Q', suit: '♦' },
  ],
  twoBlackQueens: [
    { value: 'Q', suit: '♠' },
    { value: 'Q', suit: '♣' },
  ],
  twoRedJacks: [
    { value: 'J', suit: '♥' },
    { value: 'J', suit: '♦' },
  ],
  twoBlackJacks: [
    { value: 'J', suit: '♠' },
    { value: 'J', suit: '♣' },
  ],
  twoRedTens: [
    { value: '10', suit: '♥' },
    { value: '10', suit: '♦' },
  ],
  twoBlackTens: [
    { value: '10', suit: '♠' },
    { value: '10', suit: '♣' },
  ],
  twoRedNines: [
    { value: '9', suit: '♥' },
    { value: '9', suit: '♦' },
  ],
  twoBlackNines: [
    { value: '9', suit: '♠' },
    { value: '9', suit: '♣' },
  ],
};

// Stat modifier effects for artifacts
export const ARTIFACT_STAT_EFFECTS = {
  powerPlusOne: { power: 1 },
  powerPlusTwo: { power: 2 },
  willPlusOne: { will: 1 },
  willPlusTwo: { will: 2 },
  craftPlusOne: { craft: 1 },
  craftPlusTwo: { craft: 2 },
  focusPlusOne: { focus: 1 },
  focusPlusTwo: { focus: 2 },
};

// Active effects (boosts)
export const ACTIVE_EFFECTS = ['xpBoost', 'currencyBoost'];

// Artifact mappings - maps card values/suits to artifact keys
export const ARTIFACT_MAPPINGS = {
  A: {
    spades: 'lucky_spade_charm',
    hearts: 'lucky_heart_charm',
    diamonds: 'lucky_diamond_charm',
    clubs: 'lucky_club_charm',
  },
  K: 'totem_pool',
  Q: 'totem_pool',
  J: {
    black: 'totem_pool',
    red: 'needle',
  },
  10: 'charm_pool',
  9: {
    red: 'shield',
    black: 'charm_of_wisdom',
  },
  8: {
    black: 'scrapper_bot',
    diamonds: 'bloody_magistone',
    hearts: 'void_magistone',
  },
  7: {
    diamonds: 'bloody_sigil',
    hearts: 'void_sigil',
    spades: 'bloody_totem',
    clubs: 'void_totem',
  },
  6: {
    diamonds: 'bloody_charm',
    hearts: 'void_charm',
    spades: 'bloody_trinket',
    clubs: 'void_trinket',
  },
  5: {
    red: 'heavy',
    black: 'medium',
  },
  4: {
    red: 'light',
    black: 'hammer',
  },
  3: {
    red: 'staff',
    black: 'bow',
  },
  2: {
    red: 'dagger',
    black: 'sword',
  },
};

// Pool items that can be randomly selected from artifact pools
export const ARTIFACT_POOL_ITEMS = {
  totem_pool: ['power_totem', 'will_totem', 'craft_totem', 'focus_totem'],
  charm_pool: ['power_charm', 'will_charm', 'craft_charm', 'focus_charm'],
};

// Detailed artifact definitions
export const ARTIFACT_DETAILS = {
  // Lucky charms - one for each suit
  lucky_spade_charm: {
    name: 'Lucky Spade Charm',
    type: 'artifact',
    effect: 'addSpadeAce',
    emoji: '♠️',
    flavorText: 'A mystical charm bearing the mark of spades.',
    effectText: 'Adds an Ace of Spades to your deck.',
  },
  lucky_heart_charm: {
    name: 'Lucky Heart Charm',
    type: 'artifact',
    effect: 'addHeartAce',
    emoji: '♥️',
    flavorText: 'A mystical charm bearing the mark of hearts.',
    effectText: 'Adds an Ace of Hearts to your deck.',
  },
  lucky_diamond_charm: {
    name: 'Lucky Diamond Charm',
    type: 'artifact',
    effect: 'addDiamondAce',
    emoji: '♦️',
    flavorText: 'A mystical charm bearing the mark of diamonds.',
    effectText: 'Adds an Ace of Diamonds to your deck.',
  },
  lucky_club_charm: {
    name: 'Lucky Club Charm',
    type: 'artifact',
    effect: 'addClubAce',
    emoji: '♣️',
    flavorText: 'A mystical charm bearing the mark of clubs.',
    effectText: 'Adds an Ace of Clubs to your deck.',
  },

  // Pool item artifacts
  power_totem: {
    name: "Titan's Heart",
    type: 'artifact',
    effect: 'willPlusTwo',
    emoji: '💙',
    flavorText:
      'The crystallized essence of a fallen giant. Grants unbreakable resolve.',
    effectText: '+2 to Will.',
  },
  will_totem: {
    name: "Storm's Fury",
    type: 'artifact',
    effect: 'powerPlusTwo',
    emoji: '🌩️',
    flavorText:
      'A fragment of lightning captured in crystal. Channels raw elemental power.',
    effectText: '+2 to Power.',
  },
  craft_totem: {
    name: "Artisan's Soul",
    type: 'artifact',
    effect: 'craftPlusTwo',
    emoji: '⚒️',
    flavorText:
      'The preserved spirit of a master craftsman. Imparts ancient knowledge.',
    effectText: '+2 to Craft.',
  },
  focus_totem: {
    name: "Mind's Eye",
    type: 'artifact',
    effect: 'focusPlusTwo',
    emoji: '🪬',
    flavorText:
      'A third eye carved from obsidian. Grants supernatural clarity.',
    effectText: '+2 to Focus.',
  },
  power_charm: {
    name: "Giant's Tear",
    type: 'artifact',
    effect: 'willPlusOne',
    emoji: '💧',
    flavorText:
      'A single tear from a mountain giant. Imparts unyielding determination.',
    effectText: '+1 to Will.',
  },
  will_charm: {
    name: 'Thunder Shard',
    type: 'artifact',
    effect: 'powerPlusOne',
    emoji: '⚡️',
    flavorText:
      'A splinter of lightning frozen in time. Crackles with raw energy.',
    effectText: '+1 to Power.',
  },
  craft_charm: {
    name: "Forge's Spark",
    type: 'artifact',
    effect: 'craftPlusOne',
    emoji: '⚒️',
    flavorText:
      'A glowing ember from an ancient forge. Imparts the skill of master blacksmiths.',
    effectText: '+1 to Craft.',
  },
  focus_charm: {
    name: "Seer's Lens",
    type: 'artifact',
    effect: 'focusPlusOne',
    emoji: '🧿',
    flavorText:
      'A crystal lens that reveals hidden truths. Sharpens your perception.',
    effectText: '+1 to Focus.',
  },
  charm_of_wisdom: {
    name: "Scholar's Quill",
    type: 'artifact',
    effect: 'xpBoost',
    emoji: '🪶',
    flavorText: 'A quill that writes knowledge directly into your mind.',
    effectText: 'Draw an additional card for XP gains.',
  },
  scrapper_bot: {
    name: 'Scrapper Bot',
    type: 'artifact',
    effect: 'currencyBoost',
    emoji: '🤖',
    flavorText: 'A mechanical companion that helps you find treasure.',
    effectText: 'Draw an additional card for currency gains.',
  },

  // Card-adding artifacts
  bloody_magistone: {
    name: 'Bloody Magistone',
    type: 'artifact',
    effect: 'twoRedKings',
    emoji: '🩸',
    flavorText: 'A crimson stone that amplifies your leadership.',
    effectText: 'Adds King of Hearts and Diamonds to your deck.',
  },
  void_magistone: {
    name: 'Void Magistone',
    type: 'artifact',
    effect: 'twoBlackKings',
    emoji: '🌑',
    flavorText: 'A shadowy stone that enhances your authority.',
    effectText: 'Adds King of Spades and Clubs to your deck.',
  },
  bloody_sigil: {
    name: 'Bloody Sigil',
    type: 'artifact',
    effect: 'twoRedQueens',
    emoji: '🌹',
    flavorText: 'A crimson sigil that strengthens your intuition.',
    effectText: 'Adds Queen of Hearts and Diamonds to your deck.',
  },
  void_sigil: {
    name: 'Void Sigil',
    type: 'artifact',
    effect: 'twoBlackQueens',
    emoji: '🕷️',
    flavorText: 'A shadowy sigil that sharpens your perception.',
    effectText: 'Adds Queen of Spades and Clubs to your deck.',
  },
  bloody_totem: {
    name: "Red Knight's Banner",
    type: 'artifact',
    effect: 'twoRedJacks',
    emoji: '🔴',
    flavorText: 'A crimson banner that enhances your tactical prowess.',
    effectText: 'Adds Jack of Hearts and Diamonds to your deck.',
  },
  void_totem: {
    name: "Black Knight's Banner",
    type: 'artifact',
    effect: 'twoBlackJacks',
    emoji: '⚫',
    flavorText: 'A dark banner that sharpens your strategic mind.',
    effectText: 'Adds Jack of Spades and Clubs to your deck.',
  },
  bloody_charm: {
    name: 'Crimson Gem',
    type: 'artifact',
    effect: 'twoRedTens',
    emoji: '🟥',
    flavorText: 'A radiant ruby that pulses with crimson energy.',
    effectText: 'Adds 10 of Hearts and Diamonds to your deck.',
  },
  void_charm: {
    name: 'Shadow Stone',
    type: 'artifact',
    effect: 'twoBlackTens',
    emoji: '⬛',
    flavorText: 'A dark stone that absorbs all light.',
    effectText: 'Adds 10 of Spades and Clubs to your deck.',
  },
  bloody_trinket: {
    name: 'Blood Crystal',
    type: 'artifact',
    effect: 'twoRedNines',
    emoji: '🔺',
    flavorText: 'A crimson crystal that resonates with passion.',
    effectText: 'Adds 9 of Hearts and Diamonds to your deck.',
  },
  void_trinket: {
    name: 'Void Crystal',
    type: 'artifact',
    effect: 'twoBlackNines',
    emoji: '▪️',
    flavorText: 'A dark crystal that resonates with mystery.',
    effectText: 'Adds 9 of Spades and Clubs to your deck.',
  },

  // Equipment artifacts (weapons and armor)
  needle: {
    name: 'Needle',
    type: 'weapon',
    effect: 'needle',
    emoji: '☠️',
    description:
      'A deadly needle that strikes with precision. Only Aces can hit, but they kill instantly.',
  },
  shield: {
    name: 'Shield',
    type: 'armor',
    effect: 'shield',
    emoji: '🛡️',
    flavorText:
      'A sturdy shield that blocks incoming damage. Reduces damage from low cards.',
  },
  heavy: {
    name: 'Heavy Armor',
    type: 'armor',
    effect: 'heavy',
    emoji: '🛡️',
    flavorText:
      'Heavy armor that provides excellent protection but reduces mobility.',
  },
  medium: {
    name: 'Medium Armor',
    type: 'armor',
    effect: 'medium',
    emoji: '🛡️',
    flavorText:
      'Balanced armor that provides good protection without sacrificing mobility.',
  },
  light: {
    name: 'Light Armor',
    type: 'armor',
    effect: 'light',
    emoji: '🛡️',
    flavorText:
      'Light armor that provides basic protection while maintaining full mobility.',
  },
  hammer: {
    name: 'Warhammer',
    type: 'weapon',
    effect: 'hammer',
    emoji: '🔨',
    flavorText: 'A powerful hammer that deals massive damage to armored foes.',
  },
  staff: {
    name: 'Staff',
    type: 'weapon',
    effect: 'staff',
    emoji: '🪄',
    flavorText:
      'A magical staff that channels mystical energy for powerful attacks.',
  },
  bow: {
    name: 'Bow',
    type: 'weapon',
    effect: 'bow',
    emoji: '🏹',
    flavorText:
      'A precise bow that allows for ranged attacks with high accuracy.',
  },
  dagger: {
    name: 'Dagger',
    type: 'weapon',
    effect: 'dagger',
    emoji: '🗡️',
    flavorText: 'A swift dagger that strikes quickly and can be thrown.',
  },
  sword: {
    name: 'Sword',
    type: 'weapon',
    effect: 'sword',
    emoji: '⚔️',
    flavorText: 'A reliable sword that provides balanced offense and defense.',
  },
  none: {
    name: 'Bare Hands',
    type: 'weapon',
    effect: 'none',
    emoji: '👊',
    flavorText: 'Sometimes the best weapon is no weapon at all.',
    effectText:
      'Fighting with your bare hands. Face cards deal half damage, Ace deals full damage.',
  },
};

// Legacy ARTIFACTS constant for backward compatibility
export const ARTIFACTS = ARTIFACT_MAPPINGS;

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
  { value: '𝕁', suit: '🃏', display: '𝕁🃏' },
];

// Suit symbol mapping for API conversion
export const SUIT_SYMBOL_MAP = {
  HEARTS: '♥️',
  DIAMONDS: '♦️',
  CLUBS: '♣️',
  SPADES: '♠️',
};

// Suit symbol to emoji mapping for display
export const SUIT_TO_EMOJI_MAP = {
  // Unicode symbols
  '♠': '♠️',
  '♥': '♥️',
  '♦': '♦️',
  '♣': '♣️',
  '🃏': '🃏', // Joker suit

  // String suit names (for database compatibility)
  spades: '♠️',
  hearts: '♥️',
  diamonds: '♦️',
  clubs: '♣️',
  joker: '🃏',
};

// Suit order for sorting (black suits first, then red suits, then joker)
export const SUIT_ORDER = {
  // Unicode symbols
  '♠': 0, // spades (black)
  '♣': 1, // clubs (black)
  '♥': 2, // hearts (red)
  '♦': 3, // diamonds (red)
  '🃏': 4, // joker

  // String suit names (for database compatibility)
  spades: 0, // black
  clubs: 1, // black
  hearts: 2, // red
  diamonds: 3, // red
  joker: 4, // joker
};

// Internal suit to API suit mapping
export const INTERNAL_SUIT_TO_API_MAP = {
  '♠': 'SPADES',
  '♥': 'HEARTS',
  '♦': 'DIAMONDS',
  '♣': 'CLUBS',
};

// API value to internal value conversion mapping
export const API_VALUE_CONVERSION_MAP = {
  ACE: 'A',
  KING: 'K',
  QUEEN: 'Q',
  JACK: 'J',
  10: '10',
  9: '9',
  8: '8',
  7: '7',
  6: '6',
  5: '5',
  4: '4',
  3: '3',
  2: '2',
};

// ============================================================================
// MAP GENERATION CONSTANTS
// ============================================================================

// Card values for map generation (excluding jokers)
export const MAP_CARD_VALUES = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

// Card suits for map generation
export const MAP_CARD_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];

// Map generation constants
export const MAP_CONSTANTS = {
  CARDS_PER_LEVEL: 5,
  MAP_COLUMNS: 7,
  PLAYER_START_COL: 0,
  JOKER_COL: 6,
  CARD_START_COL: 1,
  CARD_END_COL: 5,
};

// ============================================================================
// ENEMIES & COMBAT
// ============================================================================

export const ENEMIES = {
  regular: {
    power: {
      name: 'Power-based Enemy',
      type: 'power',
      weapon: ['sword'],
      baseStats: { power: 3, will: 2, craft: 2, focus: 2 },
    },
    will: {
      name: 'Will-based Enemy',
      type: 'will',
      weapon: ['staff'],
      baseStats: { power: 2, will: 3, craft: 2, focus: 2 },
    },
    craft: {
      name: 'Craft-based Enemy',
      type: 'craft',
      weapon: ['sword', 'staff', 'hammer'],
      baseStats: { power: 2, will: 2, craft: 3, focus: 2 },
    },
    focus: {
      name: 'Focus-based Enemy',
      type: 'focus',
      weapon: ['hammer'],
      baseStats: { power: 2, will: 2, craft: 2, focus: 3 },
    },
  },
  bosses: {
    1: {
      name: 'Jack of Steel',
      realm: 'steel',
      baseStats: { power: 8, will: 8, craft: 8, focus: 8 },
      weapon: ['sword'],
    },
    2: {
      name: 'Queen of Blood',
      realm: 'blood',
      baseStats: { power: 10, will: 10, craft: 10, focus: 10 },
      weapon: ['staff'],
    },
    3: {
      name: 'King of Ash',
      realm: 'ash',
      baseStats: { power: 12, will: 12, craft: 12, focus: 12 },
      weapon: ['hammer'],
    },
    4: {
      name: 'Ace of Speed',
      realm: 'speed',
      baseStats: { power: 14, will: 14, craft: 14, focus: 14 },
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
  NEGATIVE_CARD_VALUES,
  CARD_COLORS,
  SUIT_COLORS,
  SUIT_SYMBOL_TO_NAME,
  SUIT_NAME_TO_SYMBOL,
  STANDARD_SUITS,
  CARD_RANGES,
  FACE_CARDS,
  ACE,
  CARD_SUITS,
  CARD_UNICODE_MAP,
  CARD_BACK_SYMBOL,
  UNICODE_TO_VALUE_MAP,
  RED_CARD_UNICODES,
  TEXT_TO_VALUE_MAP,

  // Game Configuration
  GAME_CONSTANTS,
  XP_CONSTANTS,
  CHALLENGE_CONSTANTS,
  ANIMATION_TIMING,
  UI_MESSAGES,
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
  ARTIFACT_MAPPINGS,
  ARTIFACT_DETAILS,

  // Enemies & Combat
  ENEMIES,

  // Economy & Shopping
  SHOP_PRICES,

  // Suit Symbol Mapping
  SUIT_SYMBOL_MAP,
  SUIT_TO_EMOJI_MAP,
  SUIT_ORDER,

  // Map Generation
  MAP_CARD_VALUES,
  MAP_CARD_SUITS,
  MAP_CONSTANTS,
};
