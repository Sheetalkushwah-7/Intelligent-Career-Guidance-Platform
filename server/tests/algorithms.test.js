import test from 'node:test';
import assert from 'node:assert/strict';

import { PriorityQueue } from '../src/algorithms/PriorityQueue.js';
import { Graph } from '../src/algorithms/Graph.js';
import { TopologicalSort } from '../src/algorithms/TopologicalSort.js';
import { KnapsackDP } from '../src/algorithms/KnapsackDP.js';
import { SearchSort } from '../src/algorithms/SearchSort.js';
import { DiagnosticEngine, WEAKNESS_TYPES } from '../src/algorithms/DiagnosticEngine.js';
import { SimulatorEngine, SimulationStack } from '../src/algorithms/SimulatorEngine.js';
import { DecayEngine } from '../src/algorithms/DecayEngine.js';

test('1. PriorityQueue: Max-Heap and Min-Heap operations', () => {
  const maxPQ = new PriorityQueue('MAX');
  maxPQ.push('Task C', 30);
  maxPQ.push('Task A', 10);
  maxPQ.push('Task D', 80);
  maxPQ.push('Task B', 50);

  assert.equal(maxPQ.size(), 4);
  assert.equal(maxPQ.peek(), 'Task D');
  assert.equal(maxPQ.pop(), 'Task D');
  assert.equal(maxPQ.pop(), 'Task B');
  assert.equal(maxPQ.pop(), 'Task C');
  assert.equal(maxPQ.pop(), 'Task A');
  assert.equal(maxPQ.isEmpty(), true);

  const minPQ = new PriorityQueue('MIN');
  minPQ.push('Low', 5);
  minPQ.push('High', 100);
  minPQ.push('Med', 40);
  assert.equal(minPQ.pop(), 'Low');
  assert.equal(minPQ.pop(), 'Med');
  assert.equal(minPQ.pop(), 'High');
});

test('2. Graph: Cycle Detection, BFS, and DFS', () => {
  const g = new Graph();
  g.addEdge('Arrays', 'TwoPointers');
  g.addEdge('TwoPointers', 'SlidingWindow');
  g.addEdge('Arrays', 'BinarySearch');

  assert.equal(g.detectCycle().hasCycle, false);

  // Shortest path
  const path = g.findShortestPath('Arrays', 'SlidingWindow');
  assert.deepEqual(path, ['Arrays', 'TwoPointers', 'SlidingWindow']);

  // BFS
  const bfsResult = g.bfs('Arrays');
  assert.equal(bfsResult.length, 4);
  assert.equal(bfsResult[0].id, 'Arrays');

  // Cycle check
  const cycleGraph = new Graph();
  cycleGraph.addEdge('A', 'B');
  cycleGraph.addEdge('B', 'C');
  cycleGraph.addEdge('C', 'A');
  assert.equal(cycleGraph.detectCycle().hasCycle, true);
});

test('3. TopologicalSort: Prerequisite resolution and stages', () => {
  const g = new Graph();
  g.addEdge('PythonBasics', 'DataStructures');
  g.addEdge('DataStructures', 'Algorithms');
  g.addEdge('Algorithms', 'MachineLearning');
  g.addEdge('LinearAlgebra', 'MachineLearning');

  const result = TopologicalSort.sort(g);
  assert.equal(result.success, true);
  assert.ok(result.order.indexOf('PythonBasics') < result.order.indexOf('DataStructures'));
  assert.ok(result.order.indexOf('DataStructures') < result.order.indexOf('Algorithms'));
  assert.ok(result.order.indexOf('Algorithms') < result.order.indexOf('MachineLearning'));
  assert.ok(result.order.indexOf('LinearAlgebra') < result.order.indexOf('MachineLearning'));

  // Targeted path
  const targeted = TopologicalSort.generateTargetedLearningPath(
    g,
    ['MachineLearning'],
    new Set(['PythonBasics'])
  );
  assert.ok(!targeted.path.some(p => p.id === 'PythonBasics'));
  assert.ok(targeted.path.some(p => p.id === 'MachineLearning'));
});

test('4. KnapsackDP: 0/1 Knapsack optimal task selection within time budget', () => {
  const tasks = [
    { id: 't1', title: 'Two Pointers Drills', skillName: 'Algorithms', timeHours: 5, impact: 25 },
    { id: 't2', title: 'SQL Joins & Aggregates', skillName: 'SQL', timeHours: 10, impact: 60 },
    { id: 't3', title: 'Sliding Window Patterns', skillName: 'Algorithms', timeHours: 15, impact: 70 },
    { id: 't4', title: 'Pandas Data Cleaning', skillName: 'Python', timeHours: 20, impact: 100 }
  ];

  // With 25 hours budget
  const result = KnapsackDP.optimize(tasks, 25);
  assert.ok(result.totalTime <= 25);
  assert.ok(result.totalImpact >= 130); // t1 (5h, 25) + t4 (20h, 100) = 125 or t2(10h,60) + t3(15h,70) = 130!
  assert.equal(result.selectedTasks.some(t => t.id === 't2'), true);
  assert.equal(result.selectedTasks.some(t => t.id === 't3'), true);

  // Alternative scenarios
  const alternatives = KnapsackDP.simulateAlternatives(tasks, 25);
  assert.ok(alternatives.length > 0);
});

test('5. SearchSort: Binary Search Range and QuickSort with multi-key comparator', () => {
  const problems = [
    { id: 'p1', estimatedMinutes: 15, relevanceScore: 80 },
    { id: 'p2', estimatedMinutes: 30, relevanceScore: 95 },
    { id: 'p3', estimatedMinutes: 45, relevanceScore: 70 },
    { id: 'p4', estimatedMinutes: 60, relevanceScore: 90 }
  ];

  const range = SearchSort.binarySearchRange(problems, 'estimatedMinutes', 20, 50);
  assert.equal(range.length, 2); // p2 (30) and p3 (45)

  const sorted = SearchSort.quickSort(problems, SearchSort.problemComparator);
  assert.equal(sorted[0].id, 'p2'); // highest relevance (95)
});

test('6. DiagnosticEngine: Root-cause diagnosis on nested loops and boundary cases', () => {
  const problem = {
    expectedTimeComplexity: 'O(N)',
    concepts: ['Array', 'Two Pointers']
  };

  const codeWithNestedLoops = `
    function twoSum(nums, target) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (nums[i] + nums[j] === target) return [i, j];
        }
      }
    }
  `;

  const testCaseResults = [
    { input: [2, 7, 11, 15], expected: [0, 1], actual: [0, 1], passed: true },
    { input: Array.from({ length: 10000 }, (_, i) => i), passed: false, isScaleCase: true, executionTimeMs: 450 }
  ];

  const report = DiagnosticEngine.diagnose({
    code: codeWithNestedLoops,
    problem,
    testCaseResults,
    currentMastery: { Array: 60, 'Two Pointers': 40 }
  });

  assert.equal(report.isAccepted, false);
  assert.ok(report.detectedWeaknesses.includes(WEAKNESS_TYPES.BRUTE_FORCE_TENDENCY) ||
            report.detectedWeaknesses.includes(WEAKNESS_TYPES.TIME_COMPLEXITY_TLE));
  assert.ok(report.feedback.explanation.includes('nested'));
});

test('7. SimulatorEngine: Career Readiness, What-If simulation, and Stack undo/redo', () => {
  const currentSkills = {
    python: 80,
    sql: 40,
    statistics: 45
  };

  const dataAnalyst = {
    id: 'data-analyst',
    title: 'Data Analyst',
    requiredSkills: [
      { skillId: 'python', skillName: 'Python', minProficiency: 80, weight: 1.0 },
      { skillId: 'sql', skillName: 'SQL', minProficiency: 80, weight: 1.5 },
      { skillId: 'statistics', skillName: 'Statistics', minProficiency: 70, weight: 1.0 }
    ]
  };

  const baseReadiness = SimulatorEngine.calculateReadiness(currentSkills, dataAnalyst);
  assert.ok(baseReadiness.score < 75);

  const whatIf = SimulatorEngine.simulateWhatIf(
    currentSkills,
    dataAnalyst,
    [{ skillId: 'sql', skillName: 'SQL', newProficiency: 80 }]
  );

  assert.ok(whatIf.projectedScore > baseReadiness.score);
  assert.equal(whatIf.gapsReduced.length, 1);
  assert.equal(whatIf.gapsReduced[0].isFullyClosed, true);

  // Stack Undo/Redo test
  const stack = new SimulationStack();
  stack.pushState({ score: baseReadiness.score });
  stack.pushState({ score: whatIf.projectedScore });
  assert.equal(stack.undo().score, baseReadiness.score);
  assert.equal(stack.redo().score, whatIf.projectedScore);
});

test('8. DecayEngine: Ebbinghaus retention calculation and urgency ranking', () => {
  const active = DecayEngine.calculateRetention(1, 4, 90);
  assert.equal(active.isDecayed, false);
  assert.ok(active.retentionPercent > 80);

  const neglected = DecayEngine.calculateRetention(35, 1, 85);
  assert.equal(neglected.isDecayed, true);
  assert.ok(neglected.retentionPercent < 60);

  const ranked = DecayEngine.getDecayUrgencyRanking([
    { skillId: 's1', skillName: 'SQL', lastPracticedDays: 1, repetitions: 4, proficiency: 90 },
    { skillId: 's2', skillName: 'Dynamic Programming', lastPracticedDays: 30, repetitions: 1, proficiency: 80 }
  ]);

  assert.equal(ranked[0].skillId, 's2'); // DP neglected for 30 days is top urgency
});
