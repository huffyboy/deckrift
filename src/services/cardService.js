import { CARD_VALUES, EQUIPMENT } from '../public/js/modules/gameConstants.js';

/**
 * Play a card from hand
 */
export function playCard(hand, cardIndex) {
  if (cardIndex < 0 || cardIndex >= hand.length) {
    throw new Error('Invalid card index');
  }
  return hand.splice(cardIndex, 1)[0];
}

/**
 * Draw cards up to hand limit
 */
export function drawToHandLimit(deck, discard, hand, handLimit) {
  const cardsToDraw = Math.max(0, handLimit - hand.length);
  if (cardsToDraw === 0) return [];

  const drawn = [];
  for (let i = 0; i < cardsToDraw; i++) {
    if (deck.length === 0) {
      // Shuffle discard into deck
      if (discard.length === 0) break; // No cards left

      deck.push(...discard);
      discard.length = 0; // Clear discard
      shuffleArray(deck);
    }

    drawn.push(deck.pop());
  }

  return drawn;
}

/**
 * Discard a card from hand
 */
export function discardCard(hand, cardIndex) {
  if (cardIndex < 0 || cardIndex >= hand.length) {
    throw new Error('Invalid card index');
  }
  return hand.splice(cardIndex, 1)[0];
}

/**
 * Find the index of the lowest value card in hand
 */
export function findLowestCardIndex(hand) {
  if (hand.length === 0) return -1;

  let lowestIndex = 0;
  let lowestValue = CARD_VALUES[hand[0].value];

  for (let i = 1; i < hand.length; i++) {
    const value = CARD_VALUES[hand[i].value];
    if (value < lowestValue) {
      lowestValue = value;
      lowestIndex = i;
    }
  }

  return lowestIndex;
}

/**
 * Find the index of the best card for enemy weapon
 */
export function findBestEnemyCardIndex(hand, weaponId) {
  if (hand.length === 0) return -1;

  let bestIndex = 0;
  let bestDamage = 0;

  for (let i = 0; i < hand.length; i++) {
    const damageMultiplier = getWeaponDamageMultiplier(weaponId, hand[i]);
    const damage = damageMultiplier;

    if (damage > bestDamage) {
      bestDamage = damage;
      bestIndex = i;
    }
  }

  return bestDamage > 0 ? bestIndex : -1;
}

/**
 * Check if enemy should discard based on weapon and hand
 * Returns { shouldDiscard: boolean, cardIndex: number }
 */
export function shouldEnemyDiscard(hand, weaponId, craft, discardsUsed) {
  if (discardsUsed >= craft) {
    return { shouldDiscard: false, cardIndex: -1 };
  }

  // Find lowest card value
  const lowestIndex = findLowestCardIndex(hand);
  if (lowestIndex === -1) {
    return { shouldDiscard: false, cardIndex: -1 };
  }

  const lowestValue = CARD_VALUES[hand[lowestIndex].value];
  const lowestCard = hand[lowestIndex];

  // Weapon-specific discard conditions
  switch (weaponId) {
    case 'sword': {
      // Discard lowest card if lowest < 5 OR highest < J/11
      if (lowestValue < 5) {
        return { shouldDiscard: true, cardIndex: lowestIndex };
      }
      // Check if highest card is less than J/11
      const highestIndex = findHighestCardIndex(hand);
      const highestValue = CARD_VALUES[hand[highestIndex].value];
      if (highestValue < 11) {
        return { shouldDiscard: true, cardIndex: lowestIndex };
      }
      break;
    }

    case 'bow':
      // Discard lowest card > 6 if available
      if (lowestValue > 6) {
        return { shouldDiscard: true, cardIndex: lowestIndex };
      }
      break;

    case 'dagger':
    case 'staff':
      // Discard lowest black card (not ace) if available
      if (lowestCard.suit === 'clubs' || lowestCard.suit === 'spades') {
        if (lowestValue !== 1) {
          // Not ace
          return { shouldDiscard: true, cardIndex: lowestIndex };
        }
      }
      break;

    case 'hammer':
      // Discard any card < J/11 if available
      if (lowestValue < 11) {
        return { shouldDiscard: true, cardIndex: lowestIndex };
      }
      break;

    case 'none':
      // Discard any card < J/11 if available
      if (lowestValue < 11) {
        return { shouldDiscard: true, cardIndex: lowestIndex };
      }
      break;

    case 'ace-of-speed':
      // Discard cards 7,8,9,10 if available
      if (lowestValue >= 7 && lowestValue <= 10) {
        return { shouldDiscard: true, cardIndex: lowestIndex };
      }
      break;

    default:
      // Default: discard any card < J/11 if available
      if (lowestValue < 11) {
        return { shouldDiscard: true, cardIndex: lowestIndex };
      }
  }

  return { shouldDiscard: false, cardIndex: -1 };
}

/**
 * Find the index of the highest value card in hand
 */
export function findHighestCardIndex(hand) {
  if (hand.length === 0) return -1;

  let highestIndex = 0;
  let highestValue = CARD_VALUES[hand[0].value];

  for (let i = 1; i < hand.length; i++) {
    const value = CARD_VALUES[hand[i].value];
    if (value > highestValue) {
      highestValue = value;
      highestIndex = i;
    }
  }

  return highestIndex;
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Get weapon damage multiplier (moved from battle route)
 */
export function getWeaponDamageMultiplier(weaponId, card) {
  const weapon = EQUIPMENT.weapons[weaponId];
  if (!weapon) {
    return 0;
  }

  // Convert card value to numeric for comparison
  const cardValue =
    typeof card.value === 'string' ? CARD_VALUES[card.value] : card.value;

  for (const hitEffect of weapon.hitEffects) {
    const condition = hitEffect.condition;

    if (
      condition.type === 'range' &&
      cardValue >= condition.from &&
      cardValue <= condition.to
    ) {
      return EQUIPMENT.effectToMultiplier[hitEffect.effect];
    }

    if (
      condition.type === 'color' &&
      condition.value === 'red' &&
      ['hearts', 'diamonds'].includes(card.suit)
    ) {
      return EQUIPMENT.effectToMultiplier[hitEffect.effect];
    }

    if (condition.type === 'suit' && card.suit === condition.value) {
      return EQUIPMENT.effectToMultiplier[hitEffect.effect];
    }

    if (condition.type === 'card' && card.value === condition.value) {
      return EQUIPMENT.effectToMultiplier[hitEffect.effect];
    }
  }

  return 0; // No hit
}
