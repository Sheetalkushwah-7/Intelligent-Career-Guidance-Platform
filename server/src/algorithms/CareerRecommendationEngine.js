/**
 * CareerRecommendationEngine.js
 * Phase 3: Career Recommendation Engine.
 * 
 * DSA Implementation Requirements:
 * 1. HashMap for O(1) skill level lookup (Map data structure).
 * 2. ArrayList / list for career required & preferred skill collections.
 * 3. Sorting (QuickSort) for ranking candidates and skill sets.
 * 4. Max Heap / Priority Queue for extracting top K career recommendations
 *    and ranking strongest matching skills & largest skill gaps.
 * 
 * Transparent Scoring Formula:
 *  - Required Score (80%): sum(W_req * min(1.0, S[i] / T_req[i])) / sum(W_req) * 100
 *  - Preferred Score (20%): sum(W_pref * min(1.0, S[j] / T_pref[j])) / sum(W_pref) * 100
 *  - Compatibility Score = Round(0.80 * RequiredScore + 0.20 * PreferredScore)
 *  - Explainable & Deterministic (No AI Chatbot randomness).
 */

import { PriorityQueue } from './PriorityQueue.js';
import { SearchSort } from './SearchSort.js';

export class CareerRecommendationEngine {
  /**
   * Transparent scoring formula definition for documentation and client visualization
   */
  static FORMULA_DOCUMENTATION = {
    name: "Weighted Skill Fulfillment Compatibility Model",
    formula: "CompatibilityScore = Round(0.80 * RequiredScore + 0.20 * PreferredScore)",
    requiredFormula: "RequiredScore = [ sum(W_req * min(1.0, StudentSkill / RequiredTarget)) / sum(W_req) ] * 100",
    preferredFormula: "PreferredScore = [ sum(W_pref * min(1.0, StudentSkill / PreferredTarget)) / sum(W_pref) ] * 100",
    description: "Calculates deterministic compatibility using O(1) HashMap skill lookups over required and preferred career skill lists. Scores are normalized to [0, 100]."
  };

  /**
   * Evaluates a student's actual skill profile against a list of careers.
   * 
   * @param {Object} studentSkills HashMap / Object containing skillId => proficiency level (0-100)
   * @param {Array<Object>} careers List (ArrayList) of career definitions
   * @param {number} topK Number of top recommendations to return (default 6)
   * @returns {Object} Ranked recommendations, formula docs, and summary metrics
   */
  static evaluateCareers(studentSkills = {}, careers = [], topK = 6) {
    // 1. DSA REQUIREMENT: HashMap for O(1) Skill Lookup
    const skillHashMap = new Map();
    if (studentSkills && typeof studentSkills === 'object') {
      for (const [key, value] of Object.entries(studentSkills)) {
        skillHashMap.set(key, Number(value) || 0);
      }
    }

    // 2. DSA REQUIREMENT: Max Heap / Priority Queue for Top Career Recommendations
    const careerMaxHeap = new PriorityQueue('MAX');

    for (const career of careers) {
      const evaluation = this.evaluateSingleCareer(skillHashMap, career);
      careerMaxHeap.push(evaluation, evaluation.compatibilityScore);
    }

    // Extract Top-K recommendations using Max Heap
    const topRecommendations = careerMaxHeap.extractTopK(topK);

    return {
      formula: this.FORMULA_DOCUMENTATION,
      totalEvaluated: careers.length,
      recommendations: topRecommendations
    };
  }

  /**
   * Evaluates a single career against the student's skill HashMap.
   * 
   * @param {Map<string, number>} skillHashMap HashMap of student skills
   * @param {Object} career Career specification object
   * @returns {Object} Comprehensive career evaluation report
   */
  static evaluateSingleCareer(skillHashMap, career) {
    // 3. DSA REQUIREMENT: ArrayList/list for required and preferred career skills
    const requiredSkillsList = career.requiredSkills || [];
    const preferredSkillsList = career.preferredSkills || [];

    // Evaluate Required Skills Component (80% weight)
    let totalReqWeight = 0;
    let weightedReqFulfillment = 0;
    const matchingSkills = [];
    const missingSkills = [];

    // Max Heap for ranking strongest matching skills & largest gaps
    const strongestMatchHeap = new PriorityQueue('MAX');
    const largestGapHeap = new PriorityQueue('MAX');

    for (const req of requiredSkillsList) {
      const weight = req.weight || (career.skillWeights && career.skillWeights[req.skillId]) || 1.0;
      totalReqWeight += weight;

      // O(1) HashMap lookup
      const currentProficiency = skillHashMap.get(req.skillId) || 0;
      const targetProficiency = req.minProficiency || 50;
      const ratio = Math.min(1.0, currentProficiency / targetProficiency);
      const contribution = weight * ratio;

      weightedReqFulfillment += contribution;

      const skillItem = {
        skillId: req.skillId,
        skillName: req.skillName || req.skillId,
        currentProficiency,
        targetProficiency,
        weight,
        isRequirement: true,
        fulfillmentRatio: Math.round(ratio * 100)
      };

      if (currentProficiency >= targetProficiency) {
        skillItem.status = 'FULFILLED';
        skillItem.surplus = currentProficiency - targetProficiency;
        matchingSkills.push(skillItem);

        // Strongest match score = fulfillment contribution
        strongestMatchHeap.push(skillItem, currentProficiency * weight);
      } else {
        const gap = targetProficiency - currentProficiency;
        skillItem.status = currentProficiency > 0 ? 'PARTIAL_GAP' : 'MISSING';
        skillItem.gap = gap;

        if (currentProficiency > 0) {
          matchingSkills.push(skillItem);
          strongestMatchHeap.push(skillItem, currentProficiency * weight);
        }
        missingSkills.push(skillItem);

        // Gap severity score = deficiency * weight
        largestGapHeap.push(skillItem, gap * weight);
      }
    }

    const requiredScore = totalReqWeight > 0 
      ? (weightedReqFulfillment / totalReqWeight) * 100 
      : 0;

    // Evaluate Preferred Skills Component (20% weight)
    let totalPrefWeight = 0;
    let weightedPrefFulfillment = 0;

    for (const pref of preferredSkillsList) {
      const weight = pref.weight || (career.skillWeights && career.skillWeights[pref.skillId]) || 1.0;
      totalPrefWeight += weight;

      // O(1) HashMap lookup
      const currentProficiency = skillHashMap.get(pref.skillId) || 0;
      const targetProficiency = pref.minProficiency || 50;
      const ratio = Math.min(1.0, currentProficiency / targetProficiency);
      const contribution = weight * ratio;

      weightedPrefFulfillment += contribution;

      const skillItem = {
        skillId: pref.skillId,
        skillName: pref.skillName || pref.skillId,
        currentProficiency,
        targetProficiency,
        weight,
        isRequirement: false,
        fulfillmentRatio: Math.round(ratio * 100)
      };

      if (currentProficiency >= targetProficiency) {
        skillItem.status = 'PREFERRED_FULFILLED';
        matchingSkills.push(skillItem);
        strongestMatchHeap.push(skillItem, currentProficiency * weight * 0.8);
      } else if (currentProficiency > 0) {
        skillItem.status = 'PREFERRED_PARTIAL';
        skillItem.gap = targetProficiency - currentProficiency;
        matchingSkills.push(skillItem);
        strongestMatchHeap.push(skillItem, currentProficiency * weight * 0.8);
      } else {
        skillItem.status = 'PREFERRED_MISSING';
        skillItem.gap = targetProficiency;
        missingSkills.push(skillItem);
      }
    }

    const preferredScore = totalPrefWeight > 0 
      ? (weightedPrefFulfillment / totalPrefWeight) * 100 
      : 100; // If no preferred skills defined, don't penalize

    // Compute Overall Compatibility Score (Normalized 0 - 100)
    let compatibilityScore = 0;
    if (preferredSkillsList.length > 0) {
      compatibilityScore = Math.round(0.80 * requiredScore + 0.20 * preferredScore);
    } else {
      compatibilityScore = Math.round(requiredScore);
    }

    // Extract Top-K Strongest Matching Skills and Largest Skill Gaps via Max Heap
    const strongestMatchingSkills = strongestMatchHeap.extractTopK(4);
    const largestSkillGaps = largestGapHeap.extractTopK(4);

    // Sort matching and missing skills lists via QuickSort for deterministic output
    const sortedMatchingSkills = SearchSort.quickSort(
      matchingSkills, 
      (a, b) => b.currentProficiency - a.currentProficiency
    );

    const sortedMissingSkills = SearchSort.quickSort(
      missingSkills, 
      (a, b) => (b.gap || 0) - (a.gap || 0)
    );

    // Generate Explainable Deterministic Explanation Text
    const explanation = this.generateDeterministicExplanation({
      career,
      compatibilityScore,
      requiredScore: Math.round(requiredScore),
      preferredScore: Math.round(preferredScore),
      strongestMatchingSkills,
      largestSkillGaps,
      matchingCount: sortedMatchingSkills.length,
      missingCount: sortedMissingSkills.length,
      skillHashMap
    });

    return {
      career: {
        id: career.id,
        title: career.title,
        category: career.category,
        description: career.description,
        marketDemand: career.marketDemand,
        medianSalary: career.medianSalary,
        prerequisiteSkills: career.prerequisiteSkills || [],
        relevantConcepts: career.relevantConcepts || [],
        recommendedLearningAreas: career.recommendedLearningAreas || []
      },
      compatibilityScore,
      scoringBreakdown: {
        requiredScore: Math.round(requiredScore),
        preferredScore: Math.round(preferredScore),
        weightedRequiredContribution: Math.round(0.80 * requiredScore),
        weightedPreferredContribution: Math.round(0.20 * preferredScore)
      },
      matchingSkills: sortedMatchingSkills,
      missingSkills: sortedMissingSkills,
      strongestMatchingSkills,
      largestSkillGaps,
      explanation
    };
  }

  /**
   * Generates a clear, explainable, and deterministic explanation for why a career was recommended.
   * Strictly rule-based (No AI Chatbot).
   */
  static generateDeterministicExplanation({
    career,
    compatibilityScore,
    requiredScore,
    strongestMatchingSkills,
    largestSkillGaps,
    skillHashMap
  }) {
    let fitLevel = '';
    if (compatibilityScore >= 85) fitLevel = 'an Exceptional Match';
    else if (compatibilityScore >= 70) fitLevel = 'a Strong Match';
    else if (compatibilityScore >= 50) fitLevel = 'a Moderate Match';
    else fitLevel = 'a Developing Match';

    const topStrengthsText = strongestMatchingSkills.length > 0
      ? `Key strengths include ${strongestMatchingSkills.slice(0, 2).map(s => `${s.skillName} (${s.currentProficiency}%)`).join(' and ')}.`
      : 'No core skill prerequisites are currently mastered for this role.';

    const topGapsText = largestSkillGaps.length > 0
      ? `Primary skill gap to address is ${largestSkillGaps[0].skillName} (current ${largestSkillGaps[0].currentProficiency}% vs required ${largestSkillGaps[0].targetProficiency}%).`
      : 'All core required skill thresholds have been successfully fulfilled.';

    // Check prerequisite skills
    const prereqs = career.prerequisiteSkills || [];
    const metPrereqs = prereqs.filter(pId => (skillHashMap.get(pId) || 0) >= 60);
    const prereqStatus = prereqs.length > 0
      ? `Prerequisite readiness is ${metPrereqs.length}/${prereqs.length} met.`
      : '';

    return `${career.title} is ranked as ${fitLevel} (${compatibilityScore}% compatibility) based on a required skills match of ${requiredScore}%. ${topStrengthsText} ${topGapsText} ${prereqStatus}`.trim();
  }
}
