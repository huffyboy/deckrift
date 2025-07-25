import { EQUIPMENT, CARD_VALUES } from '../public/js/modules/gameConstants.js';

/**
 * Calculate damage mitigation from armor
 */
export function calculateDamageMitigation(armors, card, incomingDamage) {
  if (!armors || armors.length === 0) {
    return {
      finalDamage: incomingDamage,
      damageReduced: 0,
      armorUsed: null,
      reductionMultiplier: 1.0,
    };
  }

  let bestReduction = 1.0;
  let bestArmor = null;

  for (const armor of armors) {
    const reduction = getArmorDamageReduction(armor.value, card);
    if (reduction < bestReduction) {
      bestReduction = reduction;
      bestArmor = armor;
    }
  }

  const mitigatedDamage = Math.round(incomingDamage * bestReduction);
  const damageReduced = incomingDamage - mitigatedDamage;

  return {
    finalDamage: mitigatedDamage,
    damageReduced: damageReduced,
    armorUsed: bestArmor,
    reductionMultiplier: bestReduction,
  };
}

/**
 * Get armor damage reduction multiplier
 */
export function getArmorDamageReduction(armorId, card) {
  const armor = EQUIPMENT.armor[armorId];
  if (!armor) return 1.0;

  // Convert card value to numeric for comparison
  const cardValue =
    typeof card.value === 'string' ? CARD_VALUES[card.value] : card.value;

  for (const hitEffect of armor.hitEffects) {
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

  return 1.0; // No reduction
}

/**
 * Get weapon damage multiplier
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
