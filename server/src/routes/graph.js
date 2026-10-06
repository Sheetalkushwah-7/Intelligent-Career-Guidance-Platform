/**
 * Knowledge graph visualization data.
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { LearningService } from '../services/learningService.js';

const router = express.Router();

router.get('/graph/knowledge-graph', asyncHandler(async (req, res) => {
  const result = LearningService.getGraphVisualizationData();
  res.json({ success: true, ...result });
}));

export default router;
