/**
 * routes/student.js
 * Student profile, assessment, and dashboard endpoints.
 * Live data from MemoryStore / services — no mocked payloads.
 */

import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { dataStore } from '../models/DataStore.js';
import { CareerService } from '../services/careerService.js';
import { RevisionService } from '../services/revisionService.js';
import {
  getAssessmentState,
  getQuestions,
  getQuestionStats,
  scoreAssessment,
} from '../services/assessmentService.js';

const router = express.Router();

// ─── Profile ──────────────────────────────────────────────────────────────────

router.get('/student/profile', asyncHandler(async (req, res) => {
  const student = dataStore.getStudent();
  const skills  = dataStore.getAllSkills();
  const careers = dataStore.getAllCareers();
  res.json({ success: true, student, skills, careers });
}));

router.put('/student/profile', asyncHandler(async (req, res) => {
  const { name, degree, semester, targetCareerId } = req.body ?? {};

  if (!name?.trim()) {
    const err = new Error('name is required'); err.statusCode = 400; throw err;
  }
  if (!degree?.trim()) {
    const err = new Error('degree is required'); err.statusCode = 400; throw err;
  }
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    const err = new Error('semester must be an integer between 1 and 8'); err.statusCode = 400; throw err;
  }
  if (!targetCareerId?.trim()) {
    const err = new Error('targetCareerId is required'); err.statusCode = 400; throw err;
  }

  const student = dataStore.updateStudentProfile({
    name: name.trim(),
    degree: degree.trim(),
    semester,
    targetCareerId: targetCareerId.trim(),
  });
  res.json({ success: true, student });
}));

// ─── Assessment ───────────────────────────────────────────────────────────────

/**
 * GET /api/student/assessment/questions
 * Returns all questions stripped of correctAnswer, grouped by skill.
 */
router.get('/student/assessment/questions', asyncHandler(async (req, res) => {
  const questions = getQuestions();
  const stats     = getQuestionStats();
  res.json({ success: true, questions, stats });
}));

/**
 * GET /api/student/assessment/state
 * Returns current skill profile from stored skill scores + latest assessment.
 */
router.get('/student/assessment/state', asyncHandler(async (req, res) => {
  const state = getAssessmentState(dataStore.getStudent().id);
  res.json({ success: true, ...state });
}));

/**
 * POST /api/student/assessment
 * Body: { answers: { [questionId]: optionValue } }
 * Scores responses, updates student skills, persists assessment record.
 */
router.post('/student/assessment', asyncHandler(async (req, res) => {
  const result = scoreAssessment({
    studentId: dataStore.getStudent().id,
    answers:   req.body?.answers,
  });
  res.status(201).json({
    success: true,
    message: `Assessment scored. Overall: ${result.assessment.overallScore}%`,
    ...result,
  });
}));

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/student/dashboard', asyncHandler(async (req, res) => {
  const student         = dataStore.getStudent();
  const recommendations = CareerService.getRecommendations(3);
  const revision        = RevisionService.getRevisionStatus();
  const submissions     = dataStore.getSubmissions().slice(0, 5);

  res.json({
    success: true,
    student,
    topCareers: recommendations.topCareers,
    revision,
    recentSubmissions: submissions,
  });
}));

export default router;
