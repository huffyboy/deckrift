/**
 * Game utility functions shared across routes
 */

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
    control: calculateXPThreshold(profile.control || 4),
  };
}
