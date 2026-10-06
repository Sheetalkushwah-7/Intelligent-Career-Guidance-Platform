/**
 * Personalized learning path and resources.
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { dataStore } from '../models/DataStore.js';
import { LearningService } from '../services/learningService.js';

const router = express.Router();

router.get('/learning/path/:careerId', asyncHandler(async (req, res) => {
  try {
    const result = LearningService.getLearningPathForCareer(req.params.careerId);
    res.json({ success: true, ...result });
  } catch (err) {
    throw new AppError(err.message, 404);
  }
}));

router.get('/learning/resources', asyncHandler(async (req, res) => {
  const { skillId, freeOnly } = req.query;
  let resources = dataStore.getAllResources();
  if (skillId) {
    resources = resources.filter(r => r.skillId === skillId);
  }
  if (freeOnly === 'true') {
    resources = resources.filter(r => r.isFree);
  }
  res.json({ success: true, resources });
}));

export default router;
