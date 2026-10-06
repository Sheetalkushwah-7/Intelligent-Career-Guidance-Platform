/**
 * Time-budget optimizer (0/1 Knapsack).
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { OptimizerService } from '../services/optimizerService.js';

const router = express.Router();

router.post('/optimizer/plan', asyncHandler(async (req, res) => {
  const { budgetHours, targetCareerId } = req.body;
  const result = OptimizerService.buildOptimalPlan(budgetHours, targetCareerId);
  res.json({ success: true, ...result });
}));

export default router;
