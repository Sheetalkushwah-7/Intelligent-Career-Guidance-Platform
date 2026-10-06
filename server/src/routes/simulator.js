/**
 * What-if career simulator (undo/redo/pivot).
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { SimulationService } from '../services/simulationService.js';

const router = express.Router();

router.post('/simulator/what-if', asyncHandler(async (req, res) => {
  const { careerId, skillDeltas } = req.body;
  if (!skillDeltas || !Array.isArray(skillDeltas)) {
    throw new AppError('skillDeltas must be an array', 400);
  }
  const result = SimulationService.runWhatIf({ careerId, skillDeltas });
  res.json({ success: true, ...result });
}));

router.post('/simulator/undo', asyncHandler(async (req, res) => {
  const result = SimulationService.undoSimulation();
  res.json({ success: true, ...result });
}));

router.post('/simulator/redo', asyncHandler(async (req, res) => {
  const result = SimulationService.redoSimulation();
  res.json({ success: true, ...result });
}));

router.post('/simulator/pivot', asyncHandler(async (req, res) => {
  const { fromCareerId, toCareerId } = req.body;
  const result = SimulationService.runCareerPivot(fromCareerId, toCareerId);
  res.json({ success: true, ...result });
}));

export default router;
