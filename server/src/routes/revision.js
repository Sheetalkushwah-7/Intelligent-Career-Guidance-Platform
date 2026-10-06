/**
 * Skill decay / revision status.
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { RevisionService } from '../services/revisionService.js';

const router = express.Router();

router.get('/revision/status', asyncHandler(async (req, res) => {
  const result = RevisionService.getRevisionStatus();
  res.json({ success: true, ...result });
}));

export default router;
