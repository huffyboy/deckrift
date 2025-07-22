/**
 * Save Routes
 * Handles all save-related operations and cloud sync
 */

import express from 'express';
import SaveService from '../services/saveService.js';

const router = express.Router();

/**
 * Sync local save with database
 * POST /save/sync
 */
router.post('/sync', async (req, res) => {
  try {
    const { saveData } = req.body;
    const userId = req.user?.id;
    const profileId = req.user?.profileId;

    if (!userId || !profileId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.syncWithDatabase(
      userId,
      profileId,
      saveData
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Load save from database
 * GET /save/load
 */
router.get('/load', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.loadSave(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Export save data
 * POST /save/export
 */
router.post('/export', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.exportSave(userId);

    if (result.success) {
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="deckrift-save-${new Date().toISOString().split('T')[0]}.json"`
      );
      res.json(result.data);
    } else {
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Update save name
 * PUT /save/update-name
 */
router.put('/update-name', async (req, res) => {
  try {
    const userId = req.session.userId || req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const { saveName } = req.body;

    if (!saveName || saveName.trim() === '') {
      return res
        .status(400)
        .json({ success: false, error: 'Save name is required' });
    }

    const saveService = new SaveService();
    const loadResult = await saveService.loadSave(userId);

    if (!loadResult.success) {
      return res.status(404).json({ success: false, error: 'Save not found' });
    }

    // Update the save name
    const updatedSaveData = {
      ...loadResult.saveData,
      saveName: saveName.trim(),
    };

    const updateResult = await saveService.updateSave(userId, updatedSaveData);

    if (updateResult.success) {
      res.json({ success: true, message: 'Save name updated successfully' });
    } else {
      res
        .status(500)
        .json({ success: false, error: 'Failed to update save name' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Import save data
 * POST /save/import
 */
router.post('/import', async (req, res) => {
  try {
    const { saveData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.importSave(userId, saveData);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Check if save exists
 * GET /save/exists
 */
router.get('/exists', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.hasSave(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get save slots
 * GET /save/slots
 */
router.get('/slots', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.getSaveSlots(userId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Load save from slot
 * GET /save/slots/:slotId
 */
router.get('/slots/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.loadSaveFromSlot(userId, slotId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Delete save slot
 * DELETE /save/slots/:slotId
 */
router.delete('/slots/:slotId', async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.deleteSaveSlot(userId, slotId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Delete current save
 * DELETE /save
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const profileId = req.user?.profileId;

    if (!userId || !profileId) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    const saveService = new SaveService();
    const result = await saveService.deleteSave(userId, profileId);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
