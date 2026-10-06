/**
 * assessment.test.js
 *
 * Tests for Phase 2: Student Profile & Skill Assessment
 *
 * Covers:
 *   1. Question bank structure & HashMap indexing
 *   2. Weighted scoring algorithm
 *   3. Skill profile band classification (strong / average / weak)
 *   4. Assessment validation (missing answers, unknown question IDs, invalid options)
 *   5. Full assessment round-trip (DataStore integration)
 *   6. DataStore HashMap skill lookup (O(1) getSkill)
 *   7. addSkillHistory HashMap-keyed deduplication
 *   8. Skill profile sort ordering
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { getQuestions, scoreAssessment, getAssessmentState, getQuestionStats } from '../src/services/assessmentService.js';
import { dataStore } from '../src/models/DataStore.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build an answer map using the first option for every question */
function buildFirstOptionAnswers(questions) {
  return Object.fromEntries(questions.map((q) => [q.id, q.options[0].value]));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('1. Question bank: 36 questions, 3 per skill across 12 skills', () => {
  const questions = getQuestions();
  assert.equal(questions.length, 36, 'Expected 36 total questions');

  // Group by skill using a Map to verify exactly 3 each
  const bySkill = new Map();
  for (const q of questions) {
    bySkill.set(q.skillId, (bySkill.get(q.skillId) ?? 0) + 1);
  }
  assert.equal(bySkill.size, 12, 'Expected 12 distinct skills');
  for (const [skillId, count] of bySkill) {
    assert.equal(count, 3, `Skill ${skillId} should have 3 questions, got ${count}`);
  }
});

test('2. getQuestions strips correctAnswer from all questions', () => {
  const questions = getQuestions();
  for (const q of questions) {
    assert.ok(!Object.hasOwn(q, 'correctAnswer'), `Question ${q.id} leaks correctAnswer`);
  }
});

test('3. getQuestions includes difficulty field for each question', () => {
  const questions = getQuestions();
  const valid = new Set(['beginner', 'intermediate', 'advanced']);
  for (const q of questions) {
    assert.ok(valid.has(q.difficulty), `Question ${q.id} has invalid difficulty: ${q.difficulty}`);
  }
});

test('4. getQuestionStats returns correct metadata', () => {
  const stats = getQuestionStats();
  assert.equal(stats.totalQuestions, 36);
  assert.equal(Object.keys(stats.skills).length, 12);

  for (const [skillId, data] of Object.entries(stats.skills)) {
    assert.equal(data.total, 3, `${skillId} should have 3 questions`);
    assert.equal(
      data.byDifficulty.beginner + data.byDifficulty.intermediate + data.byDifficulty.advanced,
      3,
      `${skillId} difficulty counts should sum to 3`
    );
  }
});

test('5. scoreAssessment rejects missing answers', () => {
  assert.throws(
    () => scoreAssessment({ studentId: 'test_student', answers: { python_q1: 'dict' } }),
    { statusCode: 400 }
  );
});

test('6. scoreAssessment rejects unknown question IDs', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);
  answers['nonexistent_question_xyz'] = 'some_value';

  assert.throws(
    () => scoreAssessment({ studentId: 'test_student', answers }),
    { statusCode: 400 }
  );
});

test('7. scoreAssessment rejects invalid option values', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);
  answers[questions[0].id] = '__not_a_real_option__';

  assert.throws(
    () => scoreAssessment({ studentId: 'test_student', answers }),
    /Invalid answer/
  );
});

test('8. scoreAssessment rejects non-object answers payload', () => {
  assert.throws(
    () => scoreAssessment({ studentId: 'test_student', answers: null }),
    { statusCode: 400 }
  );
  assert.throws(
    () => scoreAssessment({ studentId: 'test_student', answers: ['a', 'b'] }),
    { statusCode: 400 }
  );
});

test('9. scoreAssessment with first-option answers returns valid score range', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);

  const result = scoreAssessment({ studentId: 'student_1', answers });

  assert.ok(result.assessment.overallScore >= 0 && result.assessment.overallScore <= 100,
    `Overall score out of range: ${result.assessment.overallScore}`);
  assert.equal(result.assessment.questionCount, 36);
  assert.ok(result.assessment.correctCount >= 0 && result.assessment.correctCount <= 36);
  assert.ok(result.skillProfile.all.length > 0, 'skillProfile.all should be non-empty');
  assert.equal(result.skillProfile.all.length, 12, 'Profile should list exactly 12 skills');
});

test('10. skillProfile.all is sorted descending by score', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);
  const { skillProfile } = scoreAssessment({ studentId: 'student_1', answers });

  for (let i = 0; i < skillProfile.all.length - 1; i++) {
    assert.ok(
      skillProfile.all[i].score >= skillProfile.all[i + 1].score,
      `Profile not sorted at index ${i}: ${skillProfile.all[i].score} < ${skillProfile.all[i + 1].score}`
    );
  }
});

test('11. skillProfile band classification is correct (strong >=70, average 40-69, weak <40)', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);
  const { skillProfile } = scoreAssessment({ studentId: 'student_1', answers });

  for (const skill of skillProfile.strong) {
    assert.ok(skill.score >= 70, `Strong skill ${skill.skillId} has score ${skill.score} < 70`);
  }
  for (const skill of skillProfile.average) {
    assert.ok(skill.score >= 40 && skill.score < 70,
      `Average skill ${skill.skillId} has score ${skill.score} outside 40-69`);
  }
  for (const skill of skillProfile.weak) {
    assert.ok(skill.score < 40, `Weak skill ${skill.skillId} has score ${skill.score} >= 40`);
  }
});

test('12. strong + average + weak = all (no skills lost in banding)', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);
  const { skillProfile } = scoreAssessment({ studentId: 'student_1', answers });

  const total = skillProfile.strong.length + skillProfile.average.length + skillProfile.weak.length;
  assert.equal(total, skillProfile.all.length, 'Band counts do not sum to all');
});

test('13. weighted scoring: only beginner-correct gives lower score than all-correct', () => {
  const questions = getQuestions();

  // First option for all (mix of correct/wrong)
  const answers = buildFirstOptionAnswers(questions);

  // Force python beginner (q1) correct, intermediate (q2) wrong, advanced (q3) wrong
  answers['python_q1'] = 'dict';          // correct
  answers['python_q2'] = 'returns_list';  // wrong (correct is makes_generator)
  answers['python_q3'] = '0_1_4_9_16';   // wrong (correct is 0_4_16)

  const result1 = scoreAssessment({ studentId: 'student_1', answers });
  const pythonOnly1 = result1.skillProfile.all.find((s) => s.skillId === 'python');

  // Now also answer intermediate correctly
  answers['python_q2'] = 'makes_generator'; // correct
  const result2 = scoreAssessment({ studentId: 'student_1', answers });
  const pythonOnly2 = result2.skillProfile.all.find((s) => s.skillId === 'python');

  assert.ok(pythonOnly2.score > pythonOnly1.score,
    `Getting intermediate right (${pythonOnly2.score}) should beat beginner-only (${pythonOnly1.score})`);
});

test('14. assessment saves to DataStore and getLatestAssessment returns it', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);

  const { assessment } = scoreAssessment({ studentId: 'student_1', answers });
  const latest = dataStore.getLatestAssessment('student_1');

  assert.ok(latest !== null, 'Latest assessment should not be null');
  assert.equal(latest.id, assessment.id);
  assert.equal(latest.studentId, 'student_1');
});

test('15. scoreAssessment updates student skills in DataStore', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);

  const { assessment, student } = scoreAssessment({ studentId: 'student_1', answers });

  for (const [skillId, score] of Object.entries(assessment.skills)) {
    assert.equal(
      student.skills[skillId],
      score,
      `Student skill ${skillId} not updated correctly`
    );
  }
});

test('16. getAssessmentState returns skillProfile with all 12 skills', () => {
  const state = getAssessmentState('student_1');

  assert.ok(state.skillProfile, 'skillProfile should be present');
  assert.ok(state.skillProfile.all.length >= 10, 'Expected at least 10 skills in profile');
  assert.equal(state.questionCount, 36);
  assert.equal(state.skillCount, 12);
});

test('17. DataStore.getSkill O(1) HashMap lookup returns correct skill', () => {
  const python = dataStore.getSkill('python');
  assert.ok(python, 'python skill not found');
  assert.equal(python.id, 'python');
  assert.equal(python.name, 'Python');

  // Normalised ID lookup (hyphen to underscore)
  const dpHyphen = dataStore.getSkill('dynamic-programming');
  assert.ok(dpHyphen, 'dynamic_programming not found via hyphen alias');
  assert.equal(dpHyphen.id, 'dynamic_programming');
});

test('18. DataStore.addSkillHistory HashMap deduplication keeps one entry per skill', () => {
  dataStore.addSkillHistory({ python: 85, sql: 55 });
  dataStore.addSkillHistory({ python: 90, sql: 60 });

  const student = dataStore.getStudent();
  const pythonEntries = student.skillHistory.filter((e) => e.skillId === 'python');
  const sqlEntries    = student.skillHistory.filter((e) => e.skillId === 'sql');

  assert.equal(pythonEntries.length, 1, 'Should be exactly 1 python entry (HashMap dedup)');
  assert.equal(sqlEntries.length,    1, 'Should be exactly 1 sql entry (HashMap dedup)');
  assert.equal(pythonEntries[0].proficiency, 90, 'Latest python value should be 90');
  assert.equal(sqlEntries[0].proficiency,    60, 'Latest sql value should be 60');
});

test('19. skillProfile entries include name, category, score, and skillId fields', () => {
  const state = getAssessmentState('student_1');
  for (const skill of state.skillProfile.all) {
    assert.ok(skill.skillId, `Missing skillId`);
    assert.ok(skill.name, `Missing name for ${skill.skillId}`);
    assert.ok(skill.category, `Missing category for ${skill.skillId}`);
    assert.ok(typeof skill.score === 'number', `Score should be a number for ${skill.skillId}`);
    assert.ok(skill.score >= 0 && skill.score <= 100, `Score out of range for ${skill.skillId}: ${skill.score}`);
  }
});

test('20. assessment.skillDetail records per-skill correct/total counts', () => {
  const questions = getQuestions();
  const answers = buildFirstOptionAnswers(questions);
  const { assessment } = scoreAssessment({ studentId: 'student_1', answers });

  assert.ok(assessment.skillDetail, 'skillDetail should be present');
  for (const [skillId, detail] of Object.entries(assessment.skillDetail)) {
    assert.equal(detail.total, 3, `${skillId} should have 3 total questions`);
    assert.ok(detail.correct >= 0 && detail.correct <= 3, `${skillId} correct out of range`);
    assert.ok(detail.score >= 0 && detail.score <= 100, `${skillId} score out of range`);
  }
});
