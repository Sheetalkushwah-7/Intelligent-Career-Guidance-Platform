/**
 * DataStore.js
 * In-Memory & Seeded Repository Layer.
 * Provides high-speed O(1) Map lookups, persistence, and default mock student profile.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

function loadJSON(filename) {
  const filePath = path.join(dataDir, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return [];
  }
}

/** Normalize slugs so both 'ml-engineer' and 'ml_engineer' resolve identically */
function normalizeId(id) {
  return (id || '').trim().replace(/-/g, '_').toLowerCase();
}

class MemoryStore {
  constructor() {
    this.skills = new Map();
    this.careers = new Map();
    this.concepts = new Map();
    this.problems = new Map();
    this.learningTasks = new Map();
    this.resources = new Map();
    this.assessments = [];
    this.submissions = [];
    this.simulations = [];
    this.learningPlans = [];

    // Default student profile for demo & evaluation
    this.currentStudent = {
      id: 'student_1',
      name: 'Aditya Sharma',
      email: 'aditya.sharma@ds.btech.edu',
      degree: 'B.Tech CSE (Data Science)',
      semester: 6,
      targetCareerId: 'data_scientist',
      skills: {
        python: 80,
        sql: 40,
        statistics_prob: 45,
        arrays_strings: 60,
        hash_tables: 65,
        trees_graphs: 40,
        dynamic_programming: 35,
        machine_learning: 50,
        deep_learning: 30,
        data_pipelines: 35
      },
      conceptMastery: {
        'Array Traversal': 70,
        'Two Pointers': 60,
        'Sliding Window': 45,
        'HashMap Lookups & Frequency': 65,
        'Binary Search': 55,
        'Breadth-First Search (Queue)': 40,
        'Depth-First Search (Recursion/Stack)': 45,
        'Topological Sort (Kahn\'s / DAG)': 35,
        'Dynamic Programming (1D & 2D Memo)': 30,
        'Monotonic Stack': 40
      },
      skillHistory: [
        { skillId: 'python', skillName: 'Python', lastPracticedDays: 2, repetitions: 8, proficiency: 80 },
        { skillId: 'sql', skillName: 'SQL & Relational DBs', lastPracticedDays: 14, repetitions: 2, proficiency: 40 },
        { skillId: 'statistics_prob', skillName: 'Statistics & Probability', lastPracticedDays: 21, repetitions: 2, proficiency: 45 },
        { skillId: 'arrays_strings', skillName: 'Arrays & Strings', lastPracticedDays: 5, repetitions: 6, proficiency: 60 },
        { skillId: 'dynamic_programming', skillName: 'Dynamic Programming', lastPracticedDays: 28, repetitions: 1, proficiency: 35 }
      ]
    };

    this.init();
  }

  init() {
    loadJSON('skills.json').forEach(item => this.skills.set(item.id, item));
    loadJSON('careers.json').forEach(item => this.careers.set(item.id, item));
    loadJSON('concepts.json').forEach(item => this.concepts.set(item.id, item));
    loadJSON('problems.json').forEach(item => this.problems.set(item.id, item));
    loadJSON('learningTasks.json').forEach(item => this.learningTasks.set(item.id, item));
    loadJSON('resources.json').forEach(item => this.resources.set(item.id, item));
    console.log(`[DataStore] Initialized: ${this.skills.size} skills, ${this.careers.size} careers, ${this.problems.size} problems.`);
  }

  // Student methods
  getStudent() {
    return this.currentStudent;
  }

  updateStudentProfile(profileUpdates) {
    this.currentStudent = {
      ...this.currentStudent,
      ...profileUpdates,
    };
    return this.currentStudent;
  }

  updateStudentSkills(skillUpdates) {
    this.currentStudent.skills = {
      ...this.currentStudent.skills,
      ...skillUpdates
    };
    return this.currentStudent;
  }

  addSkillHistory(skillUpdates) {
    const skillById = this.skills;
    const historyBySkill = new Map(
      this.currentStudent.skillHistory.map((entry) => [entry.skillId, entry])
    );

    for (const [skillId, proficiency] of Object.entries(skillUpdates)) {
      const previous = historyBySkill.get(skillId);
      historyBySkill.set(skillId, {
        skillId,
        skillName: skillById.get(skillId)?.name || skillId,
        lastPracticedDays: 0,
        repetitions: (previous?.repetitions || 0) + 1,
        proficiency,
      });
    }

    this.currentStudent.skillHistory = Array.from(historyBySkill.values());
    return this.currentStudent;
  }

  updateStudentMastery(masteryUpdates) {
    this.currentStudent.conceptMastery = {
      ...this.currentStudent.conceptMastery,
      ...masteryUpdates
    };
    return this.currentStudent;
  }

  // Collections
  getAllSkills() {
    return Array.from(this.skills.values());
  }

  getSkill(id) {
    return this.skills.get(id) || this.skills.get(normalizeId(id));
  }

  getAllCareers() {
    return Array.from(this.careers.values());
  }

  getCareer(id) {
    return this.careers.get(id) || this.careers.get(normalizeId(id));
  }

  getAllProblems() {
    return Array.from(this.problems.values());
  }

  getProblem(id) {
    return this.problems.get(id) || this.problems.get(normalizeId(id));
  }

  getAllLearningTasks() {
    return Array.from(this.learningTasks.values());
  }

  getAllResources() {
    return Array.from(this.resources.values());
  }

  // Assessments
  saveAssessment(assessment) {
    this.assessments.unshift(assessment);
    return assessment;
  }

  getLatestAssessment(studentId) {
    return this.assessments.find((assessment) => assessment.studentId === studentId) || null;
  }

  // Submissions
  addSubmission(submission) {
    this.submissions.unshift(submission);
    return submission;
  }

  getSubmissions() {
    return this.submissions;
  }

  // What-If Simulations
  addSimulation(sim) {
    this.simulations.unshift(sim);
    return sim;
  }

  getSimulations() {
    return this.simulations;
  }

  // Learning Plans
  saveLearningPlan(plan) {
    this.learningPlans.unshift(plan);
    return plan;
  }

  getLearningPlans() {
    return this.learningPlans;
  }
}

export const dataStore = new MemoryStore();
