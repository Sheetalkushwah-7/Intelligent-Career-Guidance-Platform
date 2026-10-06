/**
 * Aggregates domain routers. Public URL prefixes are unchanged.
 */

import express from 'express';
import studentRoutes from './student.js';
import careerRoutes from './careers.js';
import learningRoutes from './learning.js';
import dsaRoutes from './dsa.js';
import simulatorRoutes from './simulator.js';
import optimizerRoutes from './optimizer.js';
import revisionRoutes from './revision.js';
import graphRoutes from './graph.js';

const router = express.Router();

router.use(studentRoutes);
router.use(careerRoutes);
router.use(learningRoutes);
router.use(dsaRoutes);
router.use(simulatorRoutes);
router.use(optimizerRoutes);
router.use(revisionRoutes);
router.use(graphRoutes);

export default router;
