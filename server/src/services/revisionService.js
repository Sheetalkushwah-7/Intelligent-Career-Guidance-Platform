/**
 * revisionService.js
 * Smart Revision and Skill Decay Detection using Ebbinghaus curve and Priority Queue.
 */

import { DecayEngine } from '../algorithms/DecayEngine.js';
import { dataStore } from '../models/DataStore.js';

export class RevisionService {
  /**
   * Get decay analysis for student skills and upcoming spaced revision queue
   */
  static getRevisionStatus() {
    const student = dataStore.getStudent();
    const allProblems = dataStore.getAllProblems();

    // Calculate ranked decay urgency using Max-Heap
    const decayRanking = DecayEngine.getDecayUrgencyRanking(student.skillHistory || []);

    // Build FIFO revision queue for decayed skills
    const revisionQueue = DecayEngine.buildRevisionQueue(decayRanking, allProblems);

    return {
      decayRanking,
      decayedCount: decayRanking.filter(s => s.isDecayed).length,
      revisionTasksQueue: revisionQueue.toArray(),
      totalMonitoredSkills: (student.skillHistory || []).length
    };
  }
}
