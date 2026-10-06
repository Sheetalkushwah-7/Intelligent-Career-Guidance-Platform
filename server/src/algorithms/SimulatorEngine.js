/**
 * SimulatorEngine.js
 * Career Readiness Calculator, What-If Simulator, and Career Pivot Engine.
 * 
 * Uses a Stack data structure for Undo/Redo simulation history.
 * 
 * Calculates:
 *  - Baseline Career Readiness Score (0 - 100)
 *  - Projected Readiness Score after simulated skill improvements
 *  - Career Gaps Reduced / Closed
 *  - Newly "Unlocked" Careers across the entire career portfolio
 *  - Career Pivot Comparison (e.g. Data Analyst -> Data Engineer)
 */

export class SimulationStack {
  constructor(maxSize = 20) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
  }

  pushState(state) {
    if (this.undoStack.length >= this.maxSize) {
      this.undoStack.shift();
    }
    this.undoStack.push(state);
    this.redoStack = []; // clear redo on new action
  }

  undo() {
    if (this.undoStack.length <= 1) return null; // keep at least initial baseline
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  redo() {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop();
    this.undoStack.push(next);
    return next;
  }

  getHistory() {
    return [...this.undoStack];
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export class SimulatorEngine {
  /**
   * Calculate career readiness score for a student's skill profile
   * Score = sum(weight_i * min(1.0, current_i / required_i)) * 100
   * 
   * @param {object} skillProficiencies Map of skillId => proficiency (0-100)
   * @param {object} career Career object with requiredSkills: [{ skillId, minProficiency, weight }]
   * @returns {{ score: number, gaps: Array<object>, fulfilledSkills: Array<object> }}
   */
  static calculateReadiness(skillProficiencies, career) {
    if (!career || !career.requiredSkills || career.requiredSkills.length === 0) {
      return { score: 0, gaps: [], fulfilledSkills: [] };
    }

    let totalWeight = 0;
    let weightedFulfillment = 0;
    const gaps = [];
    const fulfilledSkills = [];

    for (const req of career.requiredSkills) {
      const weight = req.weight || 1;
      totalWeight += weight;

      const current = skillProficiencies[req.skillId] || 0;
      const target = req.minProficiency || 50;
      const ratio = Math.min(1.0, current / target);

      weightedFulfillment += weight * ratio;

      if (current < target) {
        gaps.push({
          skillId: req.skillId,
          skillName: req.skillName || req.skillId,
          currentProficiency: current,
          requiredProficiency: target,
          gap: target - current,
          weight
        });
      } else {
        fulfilledSkills.push({
          skillId: req.skillId,
          skillName: req.skillName || req.skillId,
          currentProficiency: current,
          requiredProficiency: target,
          surplus: current - target
        });
      }
    }

    const normalizedScore = totalWeight > 0 
      ? Math.round((weightedFulfillment / totalWeight) * 100)
      : 0;

    return {
      score: normalizedScore,
      gaps,
      fulfilledSkills
    };
  }

  /**
   * Simulate "What-If": Recalculates readiness and impact when student improves specified skills
   * 
   * @param {object} currentProficiencies Map of skillId => proficiency
   * @param {object} targetCareer Target career object
   * @param {Array<{ skillId: string, newProficiency: number }>} skillDeltas
   * @param {Array<object>} allCareers Optional list of all careers to check for unlocked options
   * @returns {object} Full What-If simulation report
   */
  static simulateWhatIf(currentProficiencies, targetCareer, skillDeltas, allCareers = []) {
    // 1. Compute baseline
    const baseline = this.calculateReadiness(currentProficiencies, targetCareer);

    // 2. Apply simulated skill mutations
    const simulatedProficiencies = { ...currentProficiencies };
    const appliedChanges = [];

    for (const delta of skillDeltas) {
      const prev = currentProficiencies[delta.skillId] || 0;
      simulatedProficiencies[delta.skillId] = delta.newProficiency;
      appliedChanges.push({
        skillId: delta.skillId,
        skillName: delta.skillName || delta.skillId,
        previous: prev,
        simulated: delta.newProficiency,
        delta: delta.newProficiency - prev
      });
    }

    // 3. Compute projected score
    const projected = this.calculateReadiness(simulatedProficiencies, targetCareer);

    // 4. Calculate gaps reduced
    const gapsReduced = [];
    for (const bg of baseline.gaps) {
      const pg = projected.gaps.find(g => g.skillId === bg.skillId);
      const newGap = pg ? pg.gap : 0;
      const reduction = bg.gap - newGap;
      if (reduction > 0) {
        gapsReduced.push({
          skillId: bg.skillId,
          skillName: bg.skillName,
          previousGap: bg.gap,
          remainingGap: newGap,
          reduction,
          isFullyClosed: newGap === 0
        });
      }
    }

    // 5. Detect Newly Unlocked Careers (readiness >= 75%)
    const newlyUnlockedCareers = [];
    const UNLOCK_THRESHOLD = 75;

    for (const car of allCareers) {
      if (car.id === targetCareer.id) continue;
      const baseCarScore = this.calculateReadiness(currentProficiencies, car).score;
      const projCarScore = this.calculateReadiness(simulatedProficiencies, car).score;

      if (baseCarScore < UNLOCK_THRESHOLD && projCarScore >= UNLOCK_THRESHOLD) {
        newlyUnlockedCareers.push({
          careerId: car.id,
          title: car.title,
          baselineScore: baseCarScore,
          projectedScore: projCarScore,
          gain: projCarScore - baseCarScore
        });
      }
    }

    // 6. Actionable next recommendation
    const scoreGain = projected.score - baseline.score;
    let nextAction = '';
    if (projected.score >= 85) {
      nextAction = 'Target career readiness is exceptionally high! Begin mock interview viva and portfolio development.';
    } else if (projected.gaps.length > 0) {
      const topRemainingGap = projected.gaps[0];
      nextAction = `Focus next on bridging ${topRemainingGap.skillName} (currently ${topRemainingGap.currentProficiency}%, target ${topRemainingGap.requiredProficiency}%).`;
    } else {
      nextAction = 'All required skill thresholds fulfilled for this role.';
    }

    return {
      targetCareerTitle: targetCareer.title,
      baselineScore: baseline.score,
      projectedScore: projected.score,
      scoreGain: scoreGain > 0 ? `+${scoreGain}%` : `${scoreGain}%`,
      skillsImproved: appliedChanges,
      gapsReduced,
      remainingGapsCount: projected.gaps.length,
      newlyUnlockedCareers,
      recommendedNextAction: nextAction,
      simulatedProfile: simulatedProficiencies
    };
  }

  /**
   * Career Pivot Simulator: Compare readiness between Current Career and Alternative Career
   */
  static simulateCareerPivot(currentProficiencies, fromCareer, toCareer) {
    const fromReadiness = this.calculateReadiness(currentProficiencies, fromCareer);
    const toReadiness = this.calculateReadiness(currentProficiencies, toCareer);

    // Identify transferable skills
    const fromSkills = new Set((fromCareer.requiredSkills || []).map(s => s.skillId));
    const transferableSkills = [];
    const missingPivotSkills = [];

    for (const toReq of toCareer.requiredSkills || []) {
      if (fromSkills.has(toReq.skillId)) {
        transferableSkills.push({
          skillId: toReq.skillId,
          skillName: toReq.skillName || toReq.skillId,
          proficiency: currentProficiencies[toReq.skillId] || 0
        });
      } else {
        missingPivotSkills.push({
          skillId: toReq.skillId,
          skillName: toReq.skillName || toReq.skillId,
          requiredProficiency: toReq.minProficiency
        });
      }
    }

    return {
      currentCareer: { id: fromCareer.id, title: fromCareer.title, readiness: fromReadiness.score },
      pivotCareer: { id: toCareer.id, title: toCareer.title, readiness: toReadiness.score },
      pivotReadinessDelta: toReadiness.score - fromReadiness.score,
      transferableSkillsCount: transferableSkills.length,
      transferableSkills,
      missingPivotSkillsCount: missingPivotSkills.length,
      missingPivotSkills,
      feasibility: toReadiness.score >= 60 ? 'HIGH' : (toReadiness.score >= 40 ? 'MODERATE' : 'LOW')
    };
  }
}
