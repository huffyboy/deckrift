import BattleService from '../services/battleService.js';
import SaveService from '../services/saveService.js';
import {
  generateStandardDeck,
  shuffleDeck,
} from '../shared/sharedGameUtils.js';
import {
  EQUIPMENT,
  ARTIFACT_DETAILS,
  CARD_VALUES,
} from '../public/js/modules/gameConstants.js';
import { handleRouteError } from '../middlewares/errorHandler.js';

class BattleController {
  constructor() {
    this.battleService = new BattleService();
    this.saveService = new SaveService();
  }

  /**
   * Start a new battle
   *
   * LOGIC REQUIREMENTS:
   * 1. Generate enemy stats based on enemy type and level
   * 2. Initialize battle state with proper phase and turn
   * 3. Set up player and enemy decks
   * 4. Draw initial cards for both player and enemy
   * 5. Save battle state to database
   * 6. Return initial battle state to frontend
   */
  async startBattle(req, res) {
    try {
      const { userId } = req.session;
      const { enemyType, enemyId } = req.body;

      const battleData = await this.battleService.startBattle(
        userId,
        enemyType,
        enemyId
      );

      return res.json({
        success: true,
        redirect: '/battle',
        battle: battleData,
      });
    } catch (error) {
      return handleRouteError(error, req, res, 'Battle Start');
    }
  }

  /**
   * Play a card (attack or defend)
   *
   * LOGIC REQUIREMENTS:
   *
   * For Player Attack:
   * 1. Verify it's player attack phase - if not respond with error
   * 2. Verify player has the weapon - if not just consider it a miss (damage 0)
   * 3. Check if weapon is a hit - if not mark as miss (damage 0)
   * 4. If it's a hit, calculate damage (damage depends on weapon + card + player power)
   * 5. Apply damage to enemy
   * 6. Check if enemy died
   * 7. Player discards played card from hand
   * 8. Player draws until hand limit
   *
   * For Player Defend:
   * 1. Verify it's player defend phase - if not return error
   * 2. Verify player has armor selected - if not set armor to 'none'
   * 3. Get pending enemy damage from database
   * 4. Determine damage mitigation - multiply by mitigation value based on card played for equipment
   * 5. Apply final damage to player
   * 6. Check if player died
   * 7. Discard played card
   * 8. Draw until hand limit
   */
  async playCard(req, res) {
    try {
      const { userId } = req.session;
      const { action, cardPlayed, weaponSelected, armorSelected } = req.body;

      const response = await this.battleService.playCard(
        userId,
        action,
        cardPlayed,
        weaponSelected,
        armorSelected
      );

      return res.json(response);
    } catch (error) {
      // If error has currentState, preserve it for the response
      if (error.currentState) {
        return res.status(500).json({
          success: false,
          error: 'Failed to play card',
          currentState: error.currentState,
        });
      }
      return handleRouteError(error, req, res, 'Play Card');
    }
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
  async processEnemyTurn(req, res) {
    try {
      const { userId } = req.session;
      const { action, cardPlayed, weaponSelected } = req.body;

      const response = await this.battleService.processEnemyTurn(
        userId,
        action,
        cardPlayed,
        weaponSelected
      );

      return res.json(response);
    } catch (error) {
      // If error has currentState, preserve it for the response
      if (error.currentState) {
        return res.status(500).json({
          success: false,
          error: 'Failed to process enemy turn',
          currentState: error.currentState,
        });
      }
      return handleRouteError(error, req, res, 'Enemy Turn');
    }
  }

  /**
   * Get combined battle end page (victory or defeat)
   *
   * LOGIC REQUIREMENTS:
   * 1. Check battle state to determine if victory or defeat
   * 2. Calculate all rewards (XP, currency, cards) based on battle result
   * 3. Apply rewards to save (update stats, currency, deck)
   * 4. Clean up battle state (set inBattle: false)
   * 5. Render appropriate page with victory or defeat content
   */
  async getBattleEndPage(req, res) {
    try {
      const { userId } = req.session;
      const saveResult = await this.saveService.loadSave(userId);

      if (!saveResult.success) {
        return res.redirect('/home-realm');
      }

      const activeSave = saveResult.saveData;

      // Check if we just finished a battle
      if (activeSave.runData.fightStatus.inBattle) {
        return res.redirect('/battle');
      }

      // Check if there's no battle data at all (fresh page load)
      if (
        !activeSave.runData.fightStatus ||
        !activeSave.runData.fightStatus.enemyStats
      ) {
        return res.redirect('/game');
      }

      const battle = activeSave.runData.fightStatus;
      const isVictory = activeSave.runData.health > 0;
      const isBoss = battle.enemyStats.realm !== undefined;
      const isFinalBoss = battle.enemyStats.realm === 'speed';

      if (isVictory) {
        // Victory logic
        const rewards = {
          currency: 0,
          xp: {},
          cards: [],
        };

        if (isBoss) {
          // Boss rewards: Draw 5 cards from standard deck (one for each stat)
          // Gain XP for each stat based on card values
          // Gain currency from last 2 cards
          const standardDeck = shuffleDeck(generateStandardDeck());
          const drawnCards = [];
          for (let i = 0; i < 5; i++) {
            if (standardDeck.length > 0) {
              drawnCards.push(standardDeck.pop());
            }
          }

          // Calculate XP from first 3 cards
          for (let i = 0; i < Math.min(3, drawnCards.length); i++) {
            const card = drawnCards[i];
            const cardValue = CARD_VALUES[card.value] || 0;

            const stats = ['power', 'will', 'craft', 'focus'];
            const stat = stats[i % stats.length];
            rewards.xp[stat] = (rewards.xp[stat] || 0) + cardValue;
          }

          // Calculate currency from last 2 cards
          for (let i = 3; i < Math.min(5, drawnCards.length); i++) {
            const card = drawnCards[i];
            const cardValue = CARD_VALUES[card.value] || 0;
            rewards.currency += cardValue;
          }

          rewards.cards = drawnCards;

          // Update realm completion
          if (activeSave.runData.realmCompletion) {
            activeSave.runData.realmCompletion[battle.enemyStats.realm] = true;
          } else {
            activeSave.runData.realmCompletion = {
              [battle.enemyStats.realm]: true,
            };
          }
        } else {
          // Regular enemy rewards: Draw 1 card from standard deck
          const standardDeck = shuffleDeck(generateStandardDeck());
          const drawnCard = standardDeck.length > 0 ? standardDeck.pop() : null;

          if (drawnCard) {
            const cardValue = CARD_VALUES[drawnCard.value] || 0;
            rewards.currency = cardValue;
            rewards.cards = [drawnCard];
          }
        }

        // Apply rewards
        if (rewards.xp) {
          Object.keys(rewards.xp).forEach((stat) => {
            activeSave.gameData.statXP[stat] =
              (activeSave.gameData.statXP[stat] || 0) + rewards.xp[stat];
          });
        }

        activeSave.runData.runCurrency =
          (activeSave.runData.runCurrency || 0) + rewards.currency;

        await this.saveService.updateSave(userId, activeSave);

        return res.render('battle-victory', {
          title: 'Victory! - Deckrift',
          user: { username: req.session.username },
          enemy: battle.enemyStats,
          rewards,
          isBoss,
          isFinalBoss,
        });
      } else {
        // Defeat logic - Clean up run data
        // TODO: Use existing function to clean up run data
        activeSave.runData = null;
        await this.saveService.updateSave(userId, activeSave);

        return res.render('battle-defeat', {
          title: 'Defeat - Deckrift',
          user: { username: req.session.username },
          enemy: battle.enemyStats,
        });
      }
    } catch (error) {
      return handleRouteError(error, req, res, 'Battle End Page', false);
    }
  }

  /**
   * Get battle page
   */
  async getBattlePage(req, res) {
    try {
      const { userId } = req.session;
      const saveResult = await this.saveService.loadSave(userId);

      if (!saveResult.success) {
        return res.redirect('/home-realm?message=No save found');
      }

      const activeSave = saveResult.saveData;

      // Check if there's an active run
      if (!activeSave.runData.location) {
        return res.redirect('/home-realm?message=No active run');
      }

      // Check if we're in a battle
      if (!activeSave.runData.fightStatus.inBattle) {
        return res.redirect('/game?message=No active battle');
      }

      const battle = activeSave.runData.fightStatus;

      // Get player equipment
      const playerEquipment = activeSave.runData.equipment || [];
      const weapons = playerEquipment.filter((item) => item.type === 'weapon');
      const armors = playerEquipment.filter((item) => item.type === 'armor');

      // Enrich weapons with their data from EQUIPMENT and ARTIFACT_DETAILS
      const enrichedWeapons = weapons.map((weapon) => {
        const weaponData = EQUIPMENT.weapons[weapon.value];
        const artifactData = ARTIFACT_DETAILS[weapon.value];
        return {
          ...weapon,
          id: weapon.value,
          name: weaponData?.name || weapon.value,
          emoji: artifactData?.emoji || '⚔️',
          cardCondition: weaponData?.cardCondition || 'No condition specified',
        };
      });

      // Enrich armors with their data from EQUIPMENT and ARTIFACT_DETAILS
      const enrichedArmors = armors.map((armor) => {
        const armorData = EQUIPMENT.armor[armor.value];
        const artifactData = ARTIFACT_DETAILS[armor.value];
        return {
          ...armor,
          id: armor.value,
          name: armorData?.name || armor.value,
          emoji: artifactData?.emoji || '🛡️',
          cardCondition: armorData?.cardCondition || 'No condition specified',
        };
      });

      // Get current weapon and armor - ensure a weapon is selected by default
      let currentWeapon = enrichedWeapons.find((w) => w.equipped);
      if (!currentWeapon && enrichedWeapons.length > 0) {
        // If no weapon is equipped, equip the first one
        currentWeapon = enrichedWeapons[0];
        currentWeapon.equipped = true;
      } else if (!currentWeapon) {
        // If no weapons available, use the 'none' weapon
        const noneWeaponData = ARTIFACT_DETAILS.none;
        currentWeapon = {
          id: 'none',
          name: noneWeaponData?.name || 'Bare Hands',
          emoji: noneWeaponData?.emoji || '👊',
          cardCondition:
            EQUIPMENT.weapons.none?.cardCondition ||
            'Face cards deal half damage, Ace deals full damage',
        };
      }

      return res.render('battle', {
        title: 'Battle - Deckrift',
        user: { username: req.session.username },
        gameSave: activeSave,
        battle,
        pageCSS: '/css/battle.css',
        player: {
          health: activeSave.runData.health,
          maxHealth: activeSave.runData.maxHealth,
          stats: activeSave.gameData.stats,
          hand: battle.playerHand,
          equipment: {
            weapons: enrichedWeapons,
            armors: enrichedArmors,
          },
          currentWeapon: currentWeapon.id,
        },
        enemy: {
          health: battle.enemyHealth,
          maxHealth: battle.enemyMaxHealth,
          stats: battle.enemyStats.baseStats,
        },
        battleState: {
          phase: battle.phase,
          turn: battle.turn,
          pendingEnemyDamage: battle.pendingEnemyDamage,
        },
        getWeaponCondition: (weaponId) => {
          const weapon = EQUIPMENT.weapons[weaponId];
          return weapon?.cardCondition || 'Unknown weapon';
        },
        getArmorCondition: (armorId) => {
          const armor = EQUIPMENT.armor[armorId];
          return armor?.cardCondition || 'Unknown armor';
        },
      });
    } catch (error) {
      return handleRouteError(error, req, res, 'Battle Page', false);
    }
  }
}

export default BattleController;
