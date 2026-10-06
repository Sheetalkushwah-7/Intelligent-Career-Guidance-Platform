import test from 'node:test';
import assert from 'node:assert/strict';

import { CareerRecommendationEngine } from '../src/algorithms/CareerRecommendationEngine.js';
import { CareerService } from '../src/services/careerService.js';
import { dataStore } from '../src/models/DataStore.js';

test('Phase 3 DSA Test 1: HashMap skill lookup & deterministic score calculation', () => {
  const studentSkills = {
    python: 80,
    sql: 80,
    statistics_prob: 80,
    machine_learning: 80
  };

  const testCareer = {
    id: 'test_role',
    title: 'Test Data Scientist',
    requiredSkills: [
      { skillId: 'python', skillName: 'Python', minProficiency: 80, weight: 1.0 },
      { skillId: 'sql', skillName: 'SQL', minProficiency: 80, weight: 1.0 }
    ],
    preferredSkills: [
      { skillId: 'statistics_prob', skillName: 'Stats', minProficiency: 80, weight: 1.0 }
    ]
  };

  const skillHashMap = new Map(Object.entries(studentSkills));
  const evalResult = CareerRecommendationEngine.evaluateSingleCareer(skillHashMap, testCareer);

  assert.equal(evalResult.compatibilityScore, 100);
  assert.equal(evalResult.scoringBreakdown.requiredScore, 100);
  assert.equal(evalResult.scoringBreakdown.preferredScore, 100);
  assert.equal(evalResult.matchingSkills.length, 3);
  assert.equal(evalResult.missingSkills.length, 0);
});

test('Phase 3 DSA Test 2: Max Heap extracts top K career recommendations in exact descending order', () => {
  const allCareers = dataStore.getAllCareers();
  assert.equal(allCareers.length, 10, 'Career database must contain all 10 structured careers');

  const frontendSkills = {
    javascript_typescript: 90,
    react_frontend: 90,
    arrays_strings: 70
  };

  const evalResult = CareerRecommendationEngine.evaluateCareers(frontendSkills, allCareers, 5);

  assert.equal(evalResult.recommendations.length, 5);
  for (let i = 0; i < evalResult.recommendations.length - 1; i++) {
    const currentScore = evalResult.recommendations[i].compatibilityScore;
    const nextScore = evalResult.recommendations[i + 1].compatibilityScore;
    assert.ok(currentScore >= nextScore, `Heap order broken: ${currentScore} < ${nextScore}`);
  }

  // Top recommendation for frontend profile should be Frontend Developer
  assert.equal(evalResult.recommendations[0].career.id, 'frontend_developer');
});

test('Phase 3 DSA Test 3: Multi-profile recommendation test across all 10 structured roles', () => {
  const testProfiles = CareerService.getTestProfiles();
  assert.ok(testProfiles.length >= 5, 'Should provide multiple test profiles');

  // 1. Data Science Profile
  const dsRes = CareerService.getRecommendations(3, 'active_student');
  assert.equal(dsRes.recommendations[0].career.id, 'data_scientist');

  // 2. Frontend Specialist Profile
  const feRes = CareerService.getRecommendations(3, 'frontend_specialist');
  assert.equal(feRes.recommendations[0].career.id, 'frontend_developer');

  // 3. Backend & DevOps Profile
  const devopsRes = CareerService.getRecommendations(3, 'backend_devops');
  assert.ok(
    devopsRes.recommendations[0].career.id === 'devops_engineer' || 
    devopsRes.recommendations[0].career.id === 'backend_developer'
  );

  // 4. Cybersecurity & Database Admin Profile
  const secRes = CareerService.getRecommendations(3, 'security_db');
  assert.ok(
    secRes.recommendations[0].career.id === 'cybersecurity_analyst' ||
    secRes.recommendations[0].career.id === 'database_administrator'
  );
});

test('Phase 3 DSA Test 4: Strongest matching skills & largest gaps Max Heap ranking', () => {
  const studentSkills = {
    javascript_typescript: 85,
    react_frontend: 90,
    backend_systems: 30, // gap for backend/fullstack
    sql: 0
  };

  const career = dataStore.getCareer('fullstack_developer');
  const skillHashMap = new Map(Object.entries(studentSkills));
  const result = CareerRecommendationEngine.evaluateSingleCareer(skillHashMap, career);

  assert.ok(result.strongestMatchingSkills.length > 0);
  assert.ok(result.largestSkillGaps.length > 0);

  // Top gap should be SQL or backend_systems
  assert.ok(result.largestSkillGaps[0].skillId === 'sql' || result.largestSkillGaps[0].skillId === 'backend_systems');
  assert.ok(result.explanation.length > 20);
});
