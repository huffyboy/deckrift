import SaveService from './saveService.js';
import { createFightStatus } from './saveSchemas.js';
import {
  generateEnemyStats,
  generateBossStats,
  generateStandardDeck,
  shuffleDeck,
} from '../public/js/modules/gameUtils.js';
import { playCard, drawToHandLimit } from './cardService.js';
import { calculateDamageMitigation } from './damageService.js';

class BattleService {
  constructor() {
    this.saveService = new SaveService();
  }

  /**
   * Start a new battle
   */
  async startBattle(userId, enemyType, enemyId = null) {
    const saveResult = await this.saveService.loadSave(userId);
    if (!saveResult.success) {
      throw new Error('No save found');
    }

    const activeSave = saveResult.saveData;

    // Check if already in battle
    if (activeSave.runData.fightStatus.inBattle) {
      throw new Error('Already in battle');
    }

    // Generate enemy stats
    const enemyLevel = activeSave.runData.location?.level || 1;
    const baseStats = enemyId
      ? generateBossStats(enemyLevel)
      : generateEnemyStats(enemyType, enemyLevel);

    // Create complete enemy stats object
    const enemyStats = {
      baseStats: baseStats,
      maxHealth: baseStats.health || 30,
      weapon: ['sword'], // Default weapon
      realm: enemyId || undefined, // Only bosses have realm
      name: baseStats.name || 'Enemy',
    };

    // Initialize battle state
    const battle = createFightStatus({
      inBattle: true,
      phase: 'player-attack',
      turn: 'player',
      enemyStats: enemyStats,
      enemyHealth: enemyStats.maxHealth,
      enemyMaxHealth: enemyStats.maxHealth,
      enemyDiscardsUsed: 0,
      pendingEnemyDamage: 0,
      lastEnemyAction: null,
    });

    // Initialize player and enemy decks
    battle.playerDeck = shuffleDeck([...activeSave.runData.playerDeck]);
    battle.enemyDeck = shuffleDeck(generateStandardDeck());

    // Draw initial cards
    const playerFocus = activeSave.gameData.stats.focus;
    const enemyFocus = enemyStats.baseStats.focus;

    const playerDrawn = drawToHandLimit(
      battle.playerDeck,
      battle.playerDiscard,
      battle.playerHand,
      playerFocus
    );
    const enemyDrawn = drawToHandLimit(
      battle.enemyDeck,
      battle.enemyDiscard,
      battle.enemyHand,
      enemyFocus
    );

    battle.playerHand.push(...playerDrawn);
    battle.enemyHand.push(...enemyDrawn);

    // Update save with battle state
    activeSave.runData.fightStatus = battle;
    await this.saveService.updateSave(userId, activeSave);

    return {
      phase: battle.phase,
      turn: battle.turn,
      playerHand: battle.playerHand,
      enemyHealth: battle.enemyHealth,
      enemyMaxHealth: battle.enemyMaxHealth,
      enemyStats: battle.enemyStats,
    };
  }

  /**
   * Process player's card play (attack or defend)
   *
   * LOGIC REQUIREMENTS:
   * 1. Verify it's player attack phase - if not respond with error
   * 2. Verify player has the weapon - if not just consider it a miss (damage 0)
   * 3. Check if weapon is a hit - if not mark as miss (damage 0)
   * 4. If it's a hit, calculate damage (damage depends on weapon + card + player power)
   * 5. Apply damage to enemy
   * 6. Check if enemy died
   * 7. Player discards played card from hand
   * 8. Player draws until hand limit
   */
  async playCard(userId, action, cardPlayed, weaponSelected, armorSelected) {
    const saveResult = await this.saveService.loadSave(userId);
    if (!saveResult.success) {
      throw new Error('No save found');
    }

    const activeSave = saveResult.saveData;
    const battle = activeSave.runData.fightStatus;

    // Validate battle state
    if (!battle.inBattle) {
      throw new Error('Not in battle');
    }

    if (battle.turn !== 'player') {
      const error = new Error('Not player turn');
      error.currentState = {
        phase: battle.phase,
        turn: battle.turn,
        playerHp: activeSave.runData.health,
        enemyHp: battle.enemyHealth,
      };
      throw error;
    }

    // Check if player has cards in hand
    if (battle.playerHand.length === 0) {
      throw new Error('No cards in hand');
    }

    // Find card in hand by value and suit
    const cardIndex = battle.playerHand.findIndex(
      (card) => card.value === cardPlayed.value && card.suit === cardPlayed.suit
    );

    if (cardIndex === -1) {
      throw new Error('Card not found in hand');
    }

    // Play the card
    const card = battle.playerHand.splice(cardIndex, 1)[0];
    battle.playerDiscard.push(card);

    let response = {
      success: true,
      action: action,
      cardPlayed: card,
      weaponSelected: weaponSelected,
      nextPhase: 'enemy-turn',
      armorUsed: 'none',
      rawDamage: 0,
      damage: 0,
      playerHp: activeSave.runData.health,
      playerMaxHp: activeSave.runData.maxHealth,
      enemyHp: battle.enemyHealth,
      enemyMaxHp: battle.enemyMaxHealth,
      playerHand: battle.playerHand,
      playerWon: false,
    };

    // Handle different actions
    if (action === 'player-attack') {
      response = await this.handlePlayerAttack(
        battle,
        card,
        weaponSelected,
        activeSave,
        response
      );
    } else if (action === 'player-defend') {
      response = await this.handlePlayerDefend(
        battle,
        card,
        armorSelected,
        activeSave,
        response
      );
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    // Update save
    await this.saveService.updateSave(userId, activeSave);

    return response;
  }

  /**
   * Process enemy turn
   *
   * LOGIC REQUIREMENTS:
   * 1. Verify it's enemy phase - if not respond with error
   * 2. Check if enemy has enough discards left - if they do determine if they need to discard
   * 3. Determine best weapon and card to play for enemy
   * 4. Determine if attack is successful
   * 5. Enemy discards played card
   * 6. Enemy draws until hand limit
   */
  async processEnemyTurn(userId, action, _cardPlayed, _weaponSelected) {
    const saveResult = await this.saveService.loadSave(userId);
    if (!saveResult.success) {
      throw new Error('No save found');
    }

    const activeSave = saveResult.saveData;
    const battle = activeSave.runData.fightStatus;

    // Validate battle state
    if (!battle.inBattle) {
      throw new Error('Not in battle');
    }

    if (battle.turn !== 'enemy') {
      const error = new Error('Not enemy turn');
      error.currentState = {
        phase: battle.phase,
        turn: battle.turn,
        playerHp: activeSave.runData.health,
        enemyHp: battle.enemyHealth,
      };
      throw error;
    }

    if (action !== 'enemy-turn') {
      throw new Error(`Invalid action: ${action}`);
    }

    const response = await this.handleEnemyTurn(battle, activeSave);

    // Update save
    await this.saveService.updateSave(userId, activeSave);

    return response;
  }

  /**
   * Handle player attack phase
   */
  async handlePlayerAttack(battle, card, weaponSelected, activeSave, response) {
    const { getWeaponDamageMultiplier } = await import('./damageService.js');

    // Verify player has the weapon - if not just consider it a miss (damage 0)
    const playerEquipment = activeSave.runData.equipment || [];

    const hasWeapon = playerEquipment.some(
      (item) => item.id === weaponSelected || item.value === weaponSelected
    );

    if (!hasWeapon) {
      response.rawDamage = 0;
      response.damage = 0;
      response.nextPhase = 'enemy-turn';
      battle.phase = 'enemy-turn';
      battle.turn = 'enemy';

      // Player draws until hand limit even on miss
      const playerFocus = activeSave.gameData.stats.focus;
      const drawnCards = drawToHandLimit(
        battle.playerDeck,
        battle.playerDiscard,
        battle.playerHand,
        playerFocus
      );
      battle.playerHand.push(...drawnCards);
      response.playerHand = battle.playerHand;

      return response;
    }

    // Check if weapon is a hit - if not mark as miss (damage 0)
    const damageMultiplier = getWeaponDamageMultiplier(weaponSelected, card);

    if (damageMultiplier === 0) {
      response.rawDamage = 0;
      response.damage = 0;
      response.nextPhase = 'enemy-turn';
      battle.phase = 'enemy-turn';
      battle.turn = 'enemy';

      // Player draws until hand limit even on miss
      const playerFocus = activeSave.gameData.stats.focus;
      const drawnCards = drawToHandLimit(
        battle.playerDeck,
        battle.playerDiscard,
        battle.playerHand,
        playerFocus
      );
      battle.playerHand.push(...drawnCards);
      response.playerHand = battle.playerHand;

      return response;
    }

    // Handle instant kill effect (needle weapon)
    if (damageMultiplier === 999) {
      // Instant kill - set enemy health to 0
      battle.enemyHealth = 0;
      response.rawDamage = battle.enemyMaxHealth;
      response.damage = battle.enemyMaxHealth;
      response.enemyHp = 0;
      response.nextPhase = 'battle over';
      response.playerWon = true;
      battle.inBattle = false;
    } else {
      // Calculate normal damage (damage depends on weapon + card + player power)
      const baseDamage = activeSave.gameData.stats.power;
      const damage = Math.floor(baseDamage * damageMultiplier);

      // Apply damage to enemy
      battle.enemyHealth = Math.max(0, battle.enemyHealth - damage);

      response.rawDamage = damage;
      response.damage = damage;
      response.enemyHp = battle.enemyHealth;

      // Check if enemy died
      if (battle.enemyHealth <= 0) {
        response.nextPhase = 'battle over';
        response.playerWon = true;
        battle.inBattle = false;
      } else {
        // Switch to enemy turn
        response.nextPhase = 'enemy attack phase';
        battle.phase = 'enemy-turn';
        battle.turn = 'enemy';
      }
    }

    // Player draws until hand limit
    const playerFocus = activeSave.gameData.stats.focus;
    const drawnCards = drawToHandLimit(
      battle.playerDeck,
      battle.playerDiscard,
      battle.playerHand,
      playerFocus
    );
    battle.playerHand.push(...drawnCards);
    response.playerHand = battle.playerHand;

    return response;
  }

  /**
   * Handle player defend phase
   */
  async handlePlayerDefend(battle, card, armorSelected, activeSave, response) {
    // Verify player has the selected armor - if not, treat as 'none'
    const playerEquipment = activeSave.runData.equipment || [];
    const hasArmor = playerEquipment.some(
      (item) =>
        (item.id === armorSelected || item.value === armorSelected) &&
        item.type === 'armor'
    );

    if (!hasArmor) {
      armorSelected = 'none';
    }

    // Always use the backend's value for pending enemy damage
    let rawDamage = battle.pendingEnemyDamage;
    if (typeof rawDamage !== 'number' || isNaN(rawDamage)) {
      rawDamage = 0;
    }

    // Get the selected armor object for damage calculation
    const selectedArmor = playerEquipment.find(
      (item) =>
        (item.id === armorSelected || item.value === armorSelected) &&
        item.type === 'armor'
    );
    const armorsForCalculation = selectedArmor ? [selectedArmor] : [];

    // Determine damage mitigation - multiply by mitigation value based on card played for equipment
    const mitigation = calculateDamageMitigation(
      armorsForCalculation,
      card,
      rawDamage
    );

    // Apply final damage to player
    activeSave.runData.health = Math.max(
      0,
      activeSave.runData.health - mitigation.finalDamage
    );

    response.action = 'player-defend';
    response.rawDamage = rawDamage;
    response.damage = mitigation.finalDamage;
    response.armorUsed = armorSelected;
    response.playerHp = activeSave.runData.health;

    // Check if player died
    if (activeSave.runData.health <= 0) {
      response.nextPhase = 'battle over';
      response.playerWon = false;
      battle.inBattle = false;
    } else {
      // Switch back to player attack
      response.nextPhase = 'player attack phase';
      battle.phase = 'player-attack';
      battle.turn = 'player';
      battle.pendingEnemyDamage = 0;

      // Draw cards for player turn
      const playerFocus = activeSave.gameData.stats.focus;
      const drawnCards = drawToHandLimit(
        battle.playerDeck,
        battle.playerDiscard,
        battle.playerHand,
        playerFocus
      );
      battle.playerHand.push(...drawnCards);
      response.playerHand = battle.playerHand;
    }

    return response;
  }

  /**
   * Handle enemy turn
   */
  async handleEnemyTurn(battle, activeSave) {
    const { findBestEnemyCardIndex, shouldEnemyDiscard, discardCard } =
      await import('./cardService.js');
    const { getWeaponDamageMultiplier } = await import('./damageService.js');

    // Enemy discard logic (if they have craft ability)
    const enemyWeapon = battle.enemyStats.weapon?.[0] || 'sword';
    const enemyCraft = battle.enemyStats.baseStats.craft || 0;

    const discardResult = shouldEnemyDiscard(
      battle.enemyHand,
      enemyWeapon,
      enemyCraft,
      battle.enemyDiscardsUsed
    );

    if (discardResult.shouldDiscard) {
      const discardedCard = discardCard(
        battle.enemyHand,
        discardResult.cardIndex
      );
      battle.enemyDiscard.push(discardedCard);
      battle.enemyDiscardsUsed++;

      // Draw replacement card for enemy after discard
      const enemyFocus = battle.enemyStats.baseStats.focus;
      const enemyDrawn = drawToHandLimit(
        battle.enemyDeck,
        battle.enemyDiscard,
        battle.enemyHand,
        enemyFocus
      );
      battle.enemyHand.push(...enemyDrawn);
    }

    // Find best card for enemy weapon
    const bestCardIndex = findBestEnemyCardIndex(battle.enemyHand, enemyWeapon);

    if (bestCardIndex === -1) {
      // No valid card to play
      return await this.handleEnemyMiss(battle, activeSave);
    }

    // Play enemy card
    const enemyCard = playCard(battle.enemyHand, bestCardIndex);
    battle.enemyDiscard.push(enemyCard);

    // Draw replacement card for enemy
    const enemyFocus = battle.enemyStats.baseStats.focus;
    const enemyDrawn = drawToHandLimit(
      battle.enemyDeck,
      battle.enemyDiscard,
      battle.enemyHand,
      enemyFocus
    );
    battle.enemyHand.push(...enemyDrawn);

    // Calculate enemy damage
    const damageMultiplier = getWeaponDamageMultiplier(enemyWeapon, enemyCard);
    const baseDamage = battle.enemyStats.baseStats.power;
    const damage = Math.floor(baseDamage * damageMultiplier);

    // Store enemy action
    battle.lastEnemyAction = {
      card: enemyCard,
      weapon: enemyWeapon,
      damage: damage,
    };

    const response = {
      success: true,
      nextPhase: 'player defend',
      cardPlayed: enemyCard,
      weaponUsed: enemyWeapon,
      rawDamage: damage,
    };

    // Check if player needs to defend
    if (damage > 0) {
      battle.phase = 'player-defend';
      battle.turn = 'player';
      battle.pendingEnemyDamage = damage;
    } else {
      // Enemy missed, switch to player turn
      return await this.handleEnemyMiss(battle, activeSave);
    }

    // Update save
    await this.saveService.updateSave(activeSave.userId, activeSave);
    return response;
  }

  /**
   * Handle enemy miss
   */
  async handleEnemyMiss(battle, activeSave) {
    battle.phase = 'player-attack';
    battle.turn = 'player';
    battle.pendingEnemyDamage = 0;

    // Draw cards for player turn
    const playerFocus = activeSave.gameData.stats.focus;
    const drawnCards = drawToHandLimit(
      battle.playerDeck,
      battle.playerDiscard,
      battle.playerHand,
      playerFocus
    );
    battle.playerHand.push(...drawnCards);

    await this.saveService.updateSave(activeSave.userId, activeSave);

    return {
      success: true,
      nextPhase: 'player attack if miss',
      cardPlayed: null,
      weaponUsed: null,
      rawDamage: 0,
    };
  }
}

export default BattleService;
