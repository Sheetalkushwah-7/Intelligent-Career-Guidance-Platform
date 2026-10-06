/**
 * DecayEngine.js
 * Ebbinghaus Forgetting Curve and Spaced Practice Scheduler.
 * 
 * Mathematical Formulation:
 *   R(t) = e^(-t / S)
 * Where:
 *   - t: Elapsed time since last practice (in days)
 *   - S: Memory Stability factor (strengthened with repeated review sessions)
 *   - R(t): Estimated retention probability (0.0 to 1.0)
 * 
 * Uses:
 *  - PriorityQueue (Max-Heap) for ordering concepts by Decay Urgency
 *  - Queue for Spaced Practice Daily Review scheduling
 */

import { PriorityQueue } from './PriorityQueue.js';

export class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    return this.isEmpty() ? null : this.items.shift();
  }

  peek() {
    return this.isEmpty() ? null : this.items[0];
  }

  size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  toArray() {
    return [...this.items];
  }
}

export class DecayEngine {
  /**
   * Calculate current retention level for a skill/concept
   * @param {number} daysSinceLastPractice 
   * @param {number} repetitions Number of times successfully practiced
   * @param {number} initialProficiency Base proficiency (0 - 100)
   * @returns {{ retentionPercent: number, effectiveProficiency: number, isDecayed: boolean, urgencyScore: number }}
   */
  static calculateRetention(daysSinceLastPractice, repetitions = 1, initialProficiency = 70) {
    // Stability S grows with repetitions: S = 2 * (repetitions ^ 1.2)
    const stability = Math.max(1, 2 * Math.pow(Math.max(1, repetitions), 1.2));
    const retention = Math.exp(-daysSinceLastPractice / stability);

    const retentionPercent = Math.round(retention * 100);
    const effectiveProficiency = Math.round((retention * initialProficiency));
    const isDecayed = retentionPercent < 70;

    // Urgency score: higher if retention is low but base proficiency was high (more valuable knowledge slipping away)
    const urgencyScore = Math.round((1 - retention) * initialProficiency);

    return {
      retentionPercent,
      effectiveProficiency,
      isDecayed,
      urgencyScore
    };
  }

  /**
   * Rank all student skills by decay urgency using a Max-Heap Priority Queue
   * @param {Array<{ skillId: string, skillName: string, lastPracticedDays: number, repetitions: number, proficiency: number }>} skillHistory 
   * @returns {Array<object>} Skills ordered by most urgent need of revision
   */
  static getDecayUrgencyRanking(skillHistory) {
    const pq = new PriorityQueue('MAX');

    for (const item of skillHistory) {
      const stats = this.calculateRetention(
        item.lastPracticedDays,
        item.repetitions || 1,
        item.proficiency || 50
      );

      pq.push({
        skillId: item.skillId,
        skillName: item.skillName,
        daysInactive: item.lastPracticedDays,
        repetitions: item.repetitions,
        nominalProficiency: item.proficiency,
        effectiveProficiency: stats.effectiveProficiency,
        retentionPercent: stats.retentionPercent,
        isDecayed: stats.isDecayed
      }, stats.urgencyScore);
    }

    const ranked = [];
    while (!pq.isEmpty()) {
      const node = pq.popWithPriority();
      ranked.push({
        ...node.item,
        urgencyScore: node.priority
      });
    }

    return ranked;
  }

  /**
   * Schedule automatic revision problems into a FIFO Queue
   * @param {Array<object>} decayedSkills 
   * @param {Array<object>} allProblems 
   * @returns {Queue} Queue of revision problems
   */
  static buildRevisionQueue(decayedSkills, allProblems) {
    const queue = new Queue();

    for (const skill of decayedSkills) {
      if (skill.isDecayed) {
        // Find matching problems for this skill/concept
        const matchingProblems = allProblems.filter(p => 
          (p.concepts || []).some(c => c.toLowerCase().includes(skill.skillName.toLowerCase())) ||
          (p.skills || []).includes(skill.skillId)
        );

        if (matchingProblems.length > 0) {
          // Select 1 quick revision problem
          queue.enqueue({
            reason: `Retention dropped to ${skill.retentionPercent}% (${skill.daysInactive} days inactive)`,
            skillName: skill.skillName,
            problem: matchingProblems[0]
          });
        }
      }
    }

    return queue;
  }
}
