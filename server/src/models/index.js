/**
 * Register Mongoose models after a successful database connection.
 * In MemoryStore mode these factories return null and are skipped.
 */

import { getStudentModel } from './schemas/Student.js';
import { getSkillModel } from './schemas/Skill.js';
import { getCareerModel } from './schemas/Career.js';
import { getAssessmentModel } from './schemas/Assessment.js';
import { getProblemModel } from './schemas/Problem.js';
import { getConceptModel } from './schemas/Concept.js';
import { getResourceModel } from './schemas/Resource.js';
import { getLearningTaskModel } from './schemas/LearningTask.js';
import { getSubmissionModel } from './schemas/Submission.js';
import { getSkillProgressModel } from './schemas/SkillProgress.js';
import { getCareerScoreModel } from './schemas/CareerScore.js';
import { getSimulationModel } from './schemas/Simulation.js';
import { getLearningPlanModel } from './schemas/LearningPlan.js';

const factories = [
  getStudentModel,
  getSkillModel,
  getCareerModel,
  getAssessmentModel,
  getProblemModel,
  getConceptModel,
  getResourceModel,
  getLearningTaskModel,
  getSubmissionModel,
  getSkillProgressModel,
  getCareerScoreModel,
  getSimulationModel,
  getLearningPlanModel,
];

export async function registerModels() {
  const registered = [];
  for (const factory of factories) {
    const model = await factory();
    if (model) registered.push(model.modelName);
  }
  if (registered.length) {
    console.log(`[Models] Registered: ${registered.join(', ')}`);
  }
  return registered;
}
