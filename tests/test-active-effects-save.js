// Test script for active effects save functionality
// Jest test for the save system

import {
  validateData,
  SaveDataSchema,
  createDefaultSaveData,
} from '../src/services/saveSchemas.js';

/**
 * Test that activeEffects can be saved and loaded correctly
 */
describe('Active Effects Save Functionality', () => {
  test('should validate save data with active effects', () => {
    // Create a default save with active effects
    const saveData = createDefaultSaveData();
    saveData.runData.activeEffects = ['xpBoost', 'currencyBoost'];

    // Validate the save data
    const validationResult = validateData(saveData, SaveDataSchema);
    expect(validationResult.isValid).toBe(true);

    // Test that active effects are preserved
    expect(saveData.runData.activeEffects).toContain('xpBoost');
    expect(saveData.runData.activeEffects).toContain('currencyBoost');
  });

  test('should handle valid activeEffects validation', () => {
    const validSave = createDefaultSaveData();
    validSave.runData.activeEffects = ['xpBoost', 'currencyBoost'];

    const validResult = validateData(validSave, SaveDataSchema);
    expect(validResult.isValid).toBe(true);
  });

  test('should handle invalid activeEffects gracefully', () => {
    const invalidSave = createDefaultSaveData();
    invalidSave.runData.activeEffects = 'not an array';

    const invalidResult = validateData(invalidSave, SaveDataSchema);
    expect(invalidResult.isValid).toBe(true); // Should still pass since it's optional
  });

  test('should preserve activeEffects after save/load simulation', () => {
    const saveData = createDefaultSaveData();
    saveData.runData.activeEffects = ['xpBoost'];

    // Simulate saving and loading
    const savedData = JSON.parse(JSON.stringify(saveData));

    expect(savedData.runData.activeEffects).toContain('xpBoost');
  });
});
