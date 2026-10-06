/**
 * api/index.js
 * Frontend API client targeting Express backend on http://localhost:5000/api
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Student
  getProfile: () => request('/student/profile'),
  updateProfile: (profile) => request('/student/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  getDashboard: () => request('/student/dashboard'),
  getAssessmentQuestions: () => request('/student/assessment/questions'),
  getAssessmentState: () => request('/student/assessment/state'),
  submitAssessment: (answers) => request('/student/assessment', { method: 'POST', body: JSON.stringify({ answers }) }),
  getQuestionStats: () => request('/student/assessment/questions').then((r) => r.stats),

  // Careers (Phase 3: Recommendation Engine, DSA Max Heap, Comparison, Test Profiles)
  getRecommendedCareers: (topK = 6, profileId = '') => 
    request(`/careers/recommend?topK=${topK}${profileId ? `&profileId=${encodeURIComponent(profileId)}` : ''}`),
  getCareerGap: (careerId, profileId = '') => 
    request(`/careers/gap/${encodeURIComponent(careerId)}${profileId ? `&profileId=${encodeURIComponent(profileId)}` : ''}`),
  compareCareers: (careerIds, profileId = '', customSkills = null) => 
    request('/careers/compare', { method: 'POST', body: JSON.stringify({ careerIds, profileId, customSkills }) }),
  getTestProfiles: () => request('/careers/test-profiles'),
  getCustomRecommendations: (skills, topK = 6) => 
    request('/careers/recommend-custom', { method: 'POST', body: JSON.stringify({ skills, topK }) }),
  getAllCareers: () => request('/careers/all'),

  // Learning Path (Topological Sort)
  getLearningPath: (careerId) => request(`/learning/path/${careerId}`),
  getResources: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/learning/resources?${query}`);
  },

  // DSA Practice & Adaptive Diagnosis
  getProblems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dsa/problems?${query}`);
  },
  getProblem: (id) => request(`/dsa/problems/${id}`),
  submitCode: (problemId, code) => request('/dsa/submit', { method: 'POST', body: JSON.stringify({ problemId, code }) }),
  submitViva: (problemId, vivaData) => request('/dsa/viva', { method: 'POST', body: JSON.stringify({ problemId, ...vivaData }) }),

  // What-If Simulator (Stack Undo/Redo)
  runWhatIf: (careerId, skillDeltas) => request('/simulator/what-if', { method: 'POST', body: JSON.stringify({ careerId, skillDeltas }) }),
  undoSimulation: () => request('/simulator/undo', { method: 'POST' }),
  redoSimulation: () => request('/simulator/redo', { method: 'POST' }),
  pivotCareer: (fromCareerId, toCareerId) => request('/simulator/pivot', { method: 'POST', body: JSON.stringify({ fromCareerId, toCareerId }) }),

  // Time-Budget Optimizer (0/1 Knapsack DP)
  optimizePlan: (budgetHours, targetCareerId) => request('/optimizer/plan', { method: 'POST', body: JSON.stringify({ budgetHours, targetCareerId }) }),

  // Revision (Decay & Spaced Practice)
  getRevisionStatus: () => request('/revision/status'),

  // Knowledge Graph
  getKnowledgeGraph: () => request('/graph/knowledge-graph')
};
