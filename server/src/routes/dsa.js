/**
 * DSA practice problems, submissions, and viva evaluation.
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { dataStore } from '../models/DataStore.js';
import { DSAService } from '../services/dsaService.js';

const router = express.Router();

router.get('/dsa/problems', asyncHandler(async (req, res) => {
  const { difficulty, concept, search } = req.query;
  const problems = DSAService.getProblems({ difficulty, concept, search });
  res.json({ success: true, problems, count: problems.length });
}));

router.get('/dsa/problems/:id', asyncHandler(async (req, res) => {
  const problem = dataStore.getProblem(req.params.id);
  if (!problem) throw new AppError('Problem not found', 404);
  res.json({ success: true, problem });
}));

router.post('/dsa/submit', asyncHandler(async (req, res) => {
  const { problemId, code } = req.body;
  if (!problemId || !code) {
    throw new AppError('problemId and code are required', 400);
  }
  const result = DSAService.executeCode(problemId, code);
  res.json({ success: true, ...result });
}));

router.post('/dsa/viva', asyncHandler(async (req, res) => {
  const { problemId, explanation, timeComplexity, spaceComplexity } = req.body;
  const result = DSAService.evaluateViva(problemId, { explanation, timeComplexity, spaceComplexity });
  res.json({ success: true, ...result });
}));

export default router;
