/**
 * optimizerService.js
 * 0/1 Knapsack Dynamic Programming Time-Budget Learning Optimizer.
 */

import { KnapsackDP } from '../algorithms/KnapsackDP.js';
import { dataStore } from '../models/DataStore.js';

export class OptimizerService {
  /**
   * Optimize student learning schedule given a time budget in hours
   * @param {number} budgetHours 
   * @param {string} targetCareerId 
   */
  static buildOptimalPlan(budgetHours, targetCareerId) {
    const hours = Math.max(2, Math.min(120, Number(budgetHours) || 30));
    const tasks = dataStore.getAllLearningTasks();

    // Solve using 0/1 Knapsack DP
    const optimizationResult = KnapsackDP.optimize(tasks, hours);

    // Generate alternative scenarios (+/- 5h, +/- 10h)
    const alternativeScenarios = KnapsackDP.simulateAlternatives(tasks, hours);

    const planRecord = {
      id: `plan_${Date.now()}`,
      budgetHours: hours,
      targetCareerId: targetCareerId || 'data_scientist',
      totalPlannedHours: optimizationResult.totalTime,
      totalImpactGained: optimizationResult.totalImpact,
      efficiencyRatio: optimizationResult.efficiencyRatio,
      selectedTasksCount: optimizationResult.selectedTasks.length,
      createdAt: new Date().toISOString()
    };

    dataStore.saveLearningPlan(planRecord);

    return {
      planSummary: planRecord,
      optimizationResult,
      alternativeScenarios
    };
  }
}
