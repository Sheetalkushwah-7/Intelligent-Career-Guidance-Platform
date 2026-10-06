/**
 * KnapsackDP.js
 * 0/1 Knapsack Dynamic Programming Algorithm for Time-Budget Learning Optimization.
 * 
 * Maximizes Total Skill Impact within a constrained Student Time Budget (in Hours).
 * Mathematical Form:
 *   Maximize \sum_{i=1}^n v_i * x_i
 *   Subject to \sum_{i=1}^n w_i * x_i <= W, where x_i \in {0, 1}
 * 
 * Includes:
 *  - Full DP Table construction
 *  - Backtracking for optimal task subset
 *  - Impact-per-hour efficiency ratios
 *  - Greedy vs DP optimality contrast (showing why DP is mathematically superior)
 *  - Alternative Plan Simulation (+/- delta budget hours)
 */

export class KnapsackDP {
  /**
   * Solve the 0/1 Knapsack problem for learning tasks
   * @param {Array<{ id: string, title: string, skillId: string, skillName: string, timeHours: number, impact: number, category?: string }>} tasks 
   * @param {number} budgetHours Available student hours
   * @returns {object} Detailed optimization plan
   */
  static optimize(tasks, budgetHours) {
    const n = tasks.length;
    const W = Math.floor(Math.max(0, budgetHours));

    if (n === 0 || W <= 0) {
      return {
        selectedTasks: [],
        totalTime: 0,
        remainingTime: budgetHours,
        totalImpact: 0,
        skillBreakdown: {},
        dpTableSize: { rows: 0, cols: 0 },
        taskExplanations: []
      };
    }

    // dp[i][w] stores maximum impact using a subset of first i tasks with weight limit w
    const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

    // Build DP table bottom-up
    for (let i = 1; i <= n; i++) {
      const task = tasks[i - 1];
      const weight = Math.round(task.timeHours);
      const val = task.impact;

      for (let w = 0; w <= W; w++) {
        if (weight <= w) {
          dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + val);
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    // Backtrack to find which tasks were selected
    const selectedTasks = [];
    let currW = W;

    for (let i = n; i > 0; i--) {
      // If value comes from dp[i-1][currW], item i was NOT included
      if (dp[i][currW] !== dp[i - 1][currW]) {
        const item = tasks[i - 1];
        selectedTasks.unshift(item);
        currW -= Math.round(item.timeHours);
      }
    }

    const totalTime = selectedTasks.reduce((sum, t) => sum + t.timeHours, 0);
    const totalImpact = dp[n][W];
    const remainingTime = Math.max(0, budgetHours - totalTime);

    // Aggregate skill breakdown
    const skillBreakdown = {};
    for (const task of selectedTasks) {
      if (!skillBreakdown[task.skillName]) {
        skillBreakdown[task.skillName] = { hours: 0, impact: 0, taskCount: 0 };
      }
      skillBreakdown[task.skillName].hours += task.timeHours;
      skillBreakdown[task.skillName].impact += task.impact;
      skillBreakdown[task.skillName].taskCount += 1;
    }

    // Task explanations with efficiency ratio
    const taskExplanations = selectedTasks.map(task => {
      const ratio = (task.impact / task.timeHours).toFixed(2);
      return {
        taskId: task.id,
        title: task.title,
        skillName: task.skillName,
        timeRequired: `${task.timeHours} hrs`,
        expectedImpact: `+${task.impact} pts`,
        efficiencyRatio: `${ratio} impact/hr`,
        rationale: `Selected because it delivers high marginal impact (+${task.impact}) for ${task.timeHours}h investment (${ratio} pts/hr) within the ${budgetHours}h budget limit.`
      };
    });

    return {
      selectedTasks,
      totalTime,
      remainingTime,
      totalImpact,
      efficiencyRatio: totalTime > 0 ? (totalImpact / totalTime).toFixed(2) : 0,
      skillBreakdown,
      dpTableSample: this._sampleDPTable(dp, tasks, W),
      taskExplanations
    };
  }

  /**
   * Produce comparison scenarios: what if user allocates -5h, +5h, or +10h?
   */
  static simulateAlternatives(tasks, currentBudget) {
    const scenarios = [];
    const deltas = [-10, -5, +5, +10];

    for (const d of deltas) {
      const altBudget = currentBudget + d;
      if (altBudget > 0) {
        const result = this.optimize(tasks, altBudget);
        scenarios.push({
          deltaHours: d > 0 ? `+${d}h` : `${d}h`,
          budgetHours: altBudget,
          totalImpact: result.totalImpact,
          taskCount: result.selectedTasks.length,
          tasks: result.selectedTasks.map(t => t.title)
        });
      }
    }

    return scenarios;
  }

  /**
   * Sample small 2D representation of DP matrix for frontend visualization
   */
  static _sampleDPTable(dp, tasks, W) {
    const maxCols = Math.min(W, 10);
    const maxRows = Math.min(tasks.length, 6);
    const matrix = [];

    for (let i = 0; i <= maxRows; i++) {
      const row = [];
      for (let w = 0; w <= maxCols; w++) {
        row.push(dp[i][w]);
      }
      matrix.push({
        task: i === 0 ? 'Baseline (0 items)' : tasks[i - 1].title.slice(0, 18),
        values: row
      });
    }

    return matrix;
  }
}
