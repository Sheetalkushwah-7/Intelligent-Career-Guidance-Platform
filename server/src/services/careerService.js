/**
 * careerService.js
 * Phase 3: Career Recommendation, Gap Analysis, and Profile Testing Service.
 * Powered by CareerRecommendationEngine (HashMap, PriorityQueue, QuickSort).
 */

import { CareerRecommendationEngine } from '../algorithms/CareerRecommendationEngine.js';
import { PriorityQueue } from '../algorithms/PriorityQueue.js';
import { SearchSort } from '../algorithms/SearchSort.js';
import { dataStore } from '../models/DataStore.js';

export class CareerService {
  /**
   * Pre-configured sample student skill profiles for testing the algorithm across different skill sets.
   */
  static TEST_PROFILES = [
    {
      id: 'active_student',
      name: 'Active Student (Aditya Sharma - Data Science Focus)',
      skills: {
        python: 80,
        sql: 75,
        statistics_prob: 80,
        machine_learning: 75,
        arrays_strings: 70,
        hash_tables: 65,
        trees_graphs: 40,
        dynamic_programming: 35,
        deep_learning: 30,
        data_pipelines: 35
      }
    },
    {
      id: 'frontend_specialist',
      name: 'Sarah Jenkins (Frontend UI Specialist)',
      skills: {
        react_frontend: 90,
        javascript_typescript: 88,
        arrays_strings: 75,
        hash_tables: 70,
        git_system_design: 65,
        backend_systems: 40,
        python: 20
      }
    },
    {
      id: 'backend_devops',
      name: 'Alex Rivera (Backend Systems & DevOps Specialist)',
      skills: {
        backend_systems: 88,
        devops_cloud: 85,
        sql: 82,
        git_system_design: 80,
        javascript_typescript: 78,
        python: 70,
        hash_tables: 75
      }
    },
    {
      id: 'fullstack_dev',
      name: 'Priya Patel (Full Stack Web Engineer)',
      skills: {
        javascript_typescript: 85,
        react_frontend: 82,
        backend_systems: 80,
        sql: 78,
        git_system_design: 70,
        arrays_strings: 68,
        hash_tables: 65
      }
    },
    {
      id: 'security_db',
      name: 'David Vance (Cybersecurity & Database Admin)',
      skills: {
        cybersecurity: 88,
        database_admin: 85,
        sql: 90,
        backend_systems: 75,
        python: 72,
        hash_tables: 70
      }
    },
    {
      id: 'novice_freshman',
      name: 'Rohan Gupta (CS Freshman / Novice)',
      skills: {
        python: 40,
        javascript_typescript: 30,
        arrays_strings: 35,
        hash_tables: 20,
        sql: 25
      }
    }
  ];

  /**
   * Returns top ranked career recommendations for a student or test profile.
   * 
   * @param {number} topK Number of top recommendations to return
   * @param {string|null} profileId Optional test profile ID
   * @param {Object|null} customSkills Optional custom skills map
   */
  static getRecommendations(topK = 6, profileId = null, customSkills = null) {
    let studentSkills = {};
    let studentInfo = null;

    if (customSkills && typeof customSkills === 'object') {
      studentSkills = customSkills;
      studentInfo = { name: 'Custom Evaluated Profile' };
    } else if (profileId) {
      const profile = this.TEST_PROFILES.find(p => p.id === profileId);
      if (profile) {
        studentSkills = profile.skills;
        studentInfo = { id: profile.id, name: profile.name };
      } else {
        const student = dataStore.getStudent();
        studentSkills = student.skills || {};
        studentInfo = { id: student.id, name: student.name };
      }
    } else {
      const student = dataStore.getStudent();
      studentSkills = student.skills || {};
      studentInfo = { id: student.id, name: student.name, targetCareerId: student.targetCareerId };
    }

    const allCareers = dataStore.getAllCareers();
    const evaluationResult = CareerRecommendationEngine.evaluateCareers(studentSkills, allCareers, topK);

    return {
      student: studentInfo,
      studentSkills,
      ...evaluationResult
    };
  }

  /**
   * Get detailed skill gap analysis for a single specific career
   * @param {string} careerId 
   * @param {Object|null} customSkills
   */
  static getSkillGapAnalysis(careerId, customSkills = null) {
    const student = dataStore.getStudent();
    const studentSkills = customSkills || student.skills || {};
    const career = dataStore.getCareer(careerId);

    if (!career) {
      throw new Error(`Career '${careerId}' not found`);
    }

    // Convert studentSkills to Map for O(1) HashMap lookup
    const skillHashMap = new Map(Object.entries(studentSkills));
    const evalResult = CareerRecommendationEngine.evaluateSingleCareer(skillHashMap, career);

    return {
      careerId: career.id,
      careerTitle: career.title,
      currentReadinessScore: evalResult.compatibilityScore,
      scoringBreakdown: evalResult.scoringBreakdown,
      status: evalResult.compatibilityScore >= 80 
        ? 'Ready for Interviews' 
        : (evalResult.compatibilityScore >= 55 ? 'Moderate Gap' : 'Significant Training Required'),
      prioritizedGaps: evalResult.largestSkillGaps,
      fulfilledSkills: evalResult.strongestMatchingSkills,
      matchingSkills: evalResult.matchingSkills,
      missingSkills: evalResult.missingSkills,
      explanation: evalResult.explanation,
      prerequisiteSkills: career.prerequisiteSkills || [],
      relevantConcepts: career.relevantConcepts || [],
      recommendedLearningAreas: career.recommendedLearningAreas || []
    };
  }

  /**
   * Side-by-side comparison of multiple careers
   * @param {string[]} careerIds 
   * @param {Object|null} customSkills
   */
  static compareCareers(careerIds, customSkills = null) {
    const student = dataStore.getStudent();
    const studentSkills = customSkills || student.skills || {};
    const skillHashMap = new Map(Object.entries(studentSkills));
    const allCareers = dataStore.getAllCareers();

    const selected = allCareers.filter(c => careerIds.includes(c.id));

    const comparisons = selected.map(career => {
      const evalResult = CareerRecommendationEngine.evaluateSingleCareer(skillHashMap, career);
      return {
        id: career.id,
        title: career.title,
        category: career.category,
        marketDemand: career.marketDemand,
        medianSalary: career.medianSalary,
        compatibilityScore: evalResult.compatibilityScore,
        matchingCount: evalResult.matchingSkills.length,
        missingCount: evalResult.missingSkills.length,
        topMatchingSkills: evalResult.strongestMatchingSkills.slice(0, 3).map(s => s.skillName),
        criticalGaps: evalResult.largestSkillGaps.slice(0, 3).map(g => g.skillName),
        explanation: evalResult.explanation,
        skillsSummary: (career.requiredSkills || []).map(req => ({
          name: req.skillName,
          required: req.minProficiency,
          current: skillHashMap.get(req.skillId) || 0
        }))
      };
    });

    return SearchSort.quickSort(comparisons, (a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  /**
   * Return available sample test profiles
   */
  static getTestProfiles() {
    return this.TEST_PROFILES;
  }
}
