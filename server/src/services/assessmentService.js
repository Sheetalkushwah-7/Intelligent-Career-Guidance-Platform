/**
 * assessmentService.js
 *
 * Implements skill assessment scoring with proper data structures:
 *
 * DATA STRUCTURES USED:
 * ─────────────────────────────────────────────────────────────────
 * 1. HashMap (Map) for question lookup        → O(1) per question
 *    `questionById`: Map<questionId, Question>
 *    `questionsBySkill`: Map<skillId, Question[]>
 *    These replace O(n) linear scans on every score operation.
 *
 * 2. HashMap (Map) for skill statistics       → O(1) per skill
 *    `skillStats`: Map<skillId, { total, weightedCorrect, correctCount }>
 *    Accumulates weighted per-question scores in a single pass.
 *
 * 3. HashMap (Map) for skill metadata lookup  → O(1) enrichment
 *    `skillById`: Map<skillId, Skill>
 *    Built once from the DataStore and reused for name/category resolution.
 *
 * 4. Array sort for band classification       → O(k log k)
 *    Final skill profile is sorted descending by score so the
 *    strong → average → weak bands are naturally ordered.
 *
 * SCORING ALGORITHM:
 * ─────────────────────────────────────────────────────────────────
 * Each question has a difficulty weight:
 *   beginner    → 1.0×
 *   intermediate → 1.5×
 *   advanced    → 2.0×
 *
 * Per-skill score = Σ(correctWeight) / Σ(totalWeight) × 100
 * This gives partial credit — a student who only gets beginner questions
 * right earns ~29 points (1/3.5 × 100), not a binary 0 or 100.
 *
 * BAND THRESHOLDS:
 *   Strong  ≥ 70   (confident, demonstrates advanced understanding)
 *   Average 40–69  (functional but gaps exist)
 *   Weak    < 40   (needs significant reinforcement)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataStore } from '../models/DataStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questionsPath = path.resolve(__dirname, '../data/assessmentQuestions.json');

// ─── Load and index questions once at module initialisation ─────────────────
const allQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

/**
 * HashMap: questionId → Question
 * Purpose: O(1) lookup when validating student answers.
 * Alternative would be O(n) Array.find() on every answer key.
 */
const questionById = new Map(allQuestions.map((q) => [q.id, q]));

/**
 * HashMap: skillId → Question[]
 * Purpose: Iterate questions grouped by skill in O(1) per group access.
 * This avoids repeated O(n) filter calls during scoring.
 */
const questionsBySkill = new Map();
for (const q of allQuestions) {
  const group = questionsBySkill.get(q.skillId) ?? [];
  group.push(q);
  questionsBySkill.set(q.skillId, group);
}

/** Difficulty → numerical weight used in weighted scoring */
const DIFFICULTY_WEIGHT = Object.freeze({
  beginner: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
});

/** Skill band thresholds (score 0–100) */
const BAND = Object.freeze({ STRONG: 70, AVERAGE: 40 });

// ─── Utility helpers ────────────────────────────────────────────────────────

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * buildSkillProfile
 *
 * Takes a Map<skillId, score> and the full skills collection, then:
 *   1. Enriches each entry with name and category via HashMap lookup (O(1) each).
 *   2. Sorts all skills descending by score (O(k log k)).
 *   3. Partitions into strong / average / weak bands.
 *
 * Returns: { all, strong, average, weak }
 *
 * @param {Map<string, number>} skillScores   skillId → 0-100 score
 * @param {object[]}            skills        Array from DataStore.getAllSkills()
 * @returns {{ all: object[], strong: object[], average: object[], weak: object[] }}
 */
function buildSkillProfile(skillScores, skills) {
  // HashMap for O(1) name/category enrichment
  const skillById = new Map(skills.map((s) => [s.id, s]));

  // Map scores to enriched objects, then sort descending
  const sorted = Array.from(skillScores.entries())
    .map(([skillId, score]) => {
      const meta = skillById.get(skillId) ?? {};
      return {
        skillId,
        name: meta.name ?? skillId,
        category: meta.category ?? 'Other',
        difficulty: meta.difficulty ?? 'Intermediate',
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return {
    all: sorted,
    strong:  sorted.filter((s) => s.score >= BAND.STRONG),
    average: sorted.filter((s) => s.score >= BAND.AVERAGE && s.score < BAND.STRONG),
    weak:    sorted.filter((s) => s.score < BAND.AVERAGE),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the question list with `correctAnswer` stripped, grouped by skill.
 * The correct answers never leave the server.
 */
export function getQuestions() {
  // Preserve skill-grouped ordering for the UI
  const ordered = [];
  for (const [, group] of questionsBySkill) {
    for (const q of group) {
      // eslint-disable-next-line no-unused-vars
      const { correctAnswer, ...safe } = q;
      ordered.push(safe);
    }
  }
  return ordered;
}

/**
 * scoreAssessment
 *
 * Main scoring function. Algorithm summary:
 *
 * 1. Validate that every expected question has an answer (O(n) scan with Set).
 * 2. For each question, do O(1) HashMap lookup to retrieve the correct answer
 *    and difficulty weight.
 * 3. Accumulate weighted statistics into a per-skill HashMap (O(1) per update).
 * 4. Convert stats to 0-100 scores, build the profile, persist, and return.
 *
 * Time complexity:  O(n) where n = number of questions
 * Space complexity: O(k) where k = number of distinct skills
 *
 * @param {{ studentId: string, answers: Record<string,string> }} params
 * @returns {{ assessment: object, student: object, skillProfile: object }}
 */
export function scoreAssessment({ studentId, answers }) {
  // ── Input validation ───────────────────────────────────────────
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    const err = new Error('answers must be an object keyed by question ID');
    err.statusCode = 400;
    throw err;
  }

  const expectedIds = new Set(allQuestions.map((q) => q.id));
  const missingIds = [];
  for (const qid of expectedIds) {
    if (!Object.hasOwn(answers, qid)) missingIds.push(qid);
  }
  const unknownIds = Object.keys(answers).filter((qid) => !expectedIds.has(qid));

  if (missingIds.length || unknownIds.length) {
    const parts = [];
    if (missingIds.length) parts.push(`Missing: ${missingIds.join(', ')}`);
    if (unknownIds.length) parts.push(`Unknown: ${unknownIds.join(', ')}`);
    const err = new Error(`Submit exactly one answer per question. ${parts.join(' | ')}`);
    err.statusCode = 400;
    throw err;
  }

  // ── Weighted scoring via skill-stats HashMap ───────────────────
  /**
   * skillStats: Map<skillId, { totalWeight, correctWeight, total, correct }>
   * Using a Map here gives O(1) insert/update per question, vs O(k) scan.
   */
  const skillStats = new Map();
  let overallCorrectWeight = 0;
  let overallTotalWeight = 0;
  let correctCount = 0;

  for (const question of allQuestions) {
    const answer = answers[question.id];
    const weight = DIFFICULTY_WEIGHT[question.difficulty] ?? 1.0;

    // Validate the submitted option value (O(1) Array.some on max 4 options)
    const isValidOption = question.options.some((opt) => opt.value === answer);
    if (!isValidOption) {
      const err = new Error(`Invalid answer value "${answer}" for question ${question.id}`);
      err.statusCode = 400;
      throw err;
    }

    const isCorrect = answer === question.correctAnswer;

    // O(1) HashMap update for this skill's running stats
    const prev = skillStats.get(question.skillId) ?? { totalWeight: 0, correctWeight: 0, total: 0, correct: 0 };
    skillStats.set(question.skillId, {
      totalWeight:   prev.totalWeight + weight,
      correctWeight: prev.correctWeight + (isCorrect ? weight : 0),
      total:         prev.total + 1,
      correct:       prev.correct + (isCorrect ? 1 : 0),
    });

    overallTotalWeight   += weight;
    overallCorrectWeight += isCorrect ? weight : 0;
    if (isCorrect) correctCount += 1;
  }

  // ── Convert stats to 0-100 scores ─────────────────────────────
  const skillScores = new Map(
    Array.from(skillStats.entries()).map(([skillId, stats]) => [
      skillId,
      clampScore((stats.correctWeight / stats.totalWeight) * 100),
    ])
  );

  const overallScore = clampScore((overallCorrectWeight / overallTotalWeight) * 100);

  // ── Build skill profile (sort + partition) ─────────────────────
  const allSkills = dataStore.getAllSkills();
  const skillProfile = buildSkillProfile(skillScores, allSkills);

  // ── Persist assessment ─────────────────────────────────────────
  const assessment = {
    id: `assessment_${Date.now()}`,
    studentId,
    answers: { ...answers },
    skills: Object.fromEntries(skillScores),
    overallScore,
    questionCount: allQuestions.length,
    correctCount,
    type: 'diagnostic',
    answeredAt: new Date().toISOString(),
    // Skill-level detail preserved for history/audit
    skillDetail: Object.fromEntries(
      Array.from(skillStats.entries()).map(([sid, s]) => [sid, {
        total: s.total,
        correct: s.correct,
        score: skillScores.get(sid),
      }])
    ),
  };

  dataStore.saveAssessment(assessment);
  dataStore.updateStudentSkills(assessment.skills);
  dataStore.addSkillHistory(assessment.skills);

  return {
    assessment,
    student: dataStore.getStudent(),
    skillProfile,
  };
}

/**
 * getAssessmentState
 *
 * Returns the current skill profile derived from the student's stored skills,
 * plus the latest assessment record (if any).
 */
export function getAssessmentState(studentId) {
  const latest = dataStore.getLatestAssessment(studentId);
  const student = dataStore.getStudent();

  // Build a Map from the student's plain-object skills for profile generation
  const skillScores = new Map(Object.entries(student.skills));
  const allSkills = dataStore.getAllSkills();

  return {
    latestAssessment: latest,
    skillProfile: buildSkillProfile(skillScores, allSkills),
    questionCount: allQuestions.length,
    skillCount: questionsBySkill.size,
  };
}

/**
 * getQuestionStats
 *
 * Returns metadata about the question bank for the UI header.
 */
export function getQuestionStats() {
  const stats = {};
  for (const [skillId, group] of questionsBySkill) {
    stats[skillId] = {
      total: group.length,
      byDifficulty: {
        beginner:     group.filter((q) => q.difficulty === 'beginner').length,
        intermediate: group.filter((q) => q.difficulty === 'intermediate').length,
        advanced:     group.filter((q) => q.difficulty === 'advanced').length,
      },
    };
  }
  return { totalQuestions: allQuestions.length, skills: stats };
}

export { questionById, questionsBySkill };
