/**
 * routes/careers.js
 * Phase 3: Career Recommendation Engine API Endpoints.
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { dataStore } from '../models/DataStore.js';
import { CareerService } from '../services/careerService.js';

const router = express.Router();

/**
 * GET /api/careers/recommend
 * Query params: topK (number), profileId (string)
 */
router.get('/careers/recommend', asyncHandler(async (req, res) => {
  const topK = parseInt(req.query.topK, 10) || 6;
  const profileId = req.query.profileId || null;
  const result = CareerService.getRecommendations(topK, profileId);
  res.json({ success: true, ...result });
}));

/**
 * POST /api/careers/recommend-custom
 * Evaluate custom skill levels
 */
router.post('/careers/recommend-custom', asyncHandler(async (req, res) => {
  const { skills, topK = 6 } = req.body;
  if (!skills || typeof skills !== 'object') {
    throw new AppError('skills payload must be an object of skillId => proficiency', 400);
  }
  const result = CareerService.getRecommendations(topK, null, skills);
  res.json({ success: true, ...result });
}));

/**
 * GET /api/careers/test-profiles
 * Get available sample test student profiles
 */
router.get('/careers/test-profiles', asyncHandler(async (req, res) => {
  const profiles = CareerService.getTestProfiles();
  res.json({ success: true, profiles });
}));

/**
 * GET /api/careers/gap/:careerId
 */
router.get('/careers/gap/:careerId', asyncHandler(async (req, res) => {
  try {
    const profileId = req.query.profileId || null;
    let customSkills = null;
    if (profileId) {
      const prof = CareerService.getTestProfiles().find(p => p.id === profileId);
      if (prof) customSkills = prof.skills;
    }
    const result = CareerService.getSkillGapAnalysis(req.params.careerId, customSkills);
    res.json({ success: true, ...result });
  } catch (err) {
    throw new AppError(err.message, 404);
  }
}));

/**
 * POST /api/careers/compare
 */
router.post('/careers/compare', asyncHandler(async (req, res) => {
  const { careerIds, profileId, customSkills } = req.body;
  if (!careerIds || !Array.isArray(careerIds)) {
    throw new AppError('careerIds must be an array', 400);
  }
  let skillsToUse = customSkills;
  if (!skillsToUse && profileId) {
    const prof = CareerService.getTestProfiles().find(p => p.id === profileId);
    if (prof) skillsToUse = prof.skills;
  }

  const result = CareerService.compareCareers(careerIds, skillsToUse);
  res.json({ success: true, comparisons: result });
}));

/**
 * GET /api/careers/all
 */
router.get('/careers/all', asyncHandler(async (req, res) => {
  const careers = dataStore.getAllCareers();
  res.json({ success: true, careers });
}));

export default router;
