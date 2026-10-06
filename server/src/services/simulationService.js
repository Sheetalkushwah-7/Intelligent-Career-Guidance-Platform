/**
 * simulationService.js
 * Career Readiness What-If Simulator with Stack-based Undo/Redo and Career Pivot Engine.
 */

import { SimulatorEngine, SimulationStack } from '../algorithms/SimulatorEngine.js';
import { dataStore } from '../models/DataStore.js';

// Stateful simulation stack instance for student session
const simulationStack = new SimulationStack(25);

export class SimulationService {
  /**
   * Run What-If simulation with specified skill deltas
   * @param {object} params
   * @param {string} params.careerId Target career ID
   * @param {Array<{ skillId: string, newProficiency: number }>} params.skillDeltas
   */
  static runWhatIf({ careerId, skillDeltas }) {
    const student = dataStore.getStudent();
    const targetCareer = dataStore.getCareer(careerId || student.targetCareerId);

    if (!targetCareer) {
      throw new Error(`Career '${careerId}' not found`);
    }

    const allCareers = dataStore.getAllCareers();

    // Enrich skill deltas with human names
    const enrichedDeltas = skillDeltas.map(d => {
      const skill = dataStore.getSkill(d.skillId);
      return {
        ...d,
        skillName: skill ? skill.name : d.skillId
      };
    });

    const report = SimulatorEngine.simulateWhatIf(
      student.skills,
      targetCareer,
      enrichedDeltas,
      allCareers
    );

    // Push into stack history
    const stateSnapshot = {
      id: `sim_${Date.now()}`,
      careerId: targetCareer.id,
      careerTitle: targetCareer.title,
      baselineScore: report.baselineScore,
      projectedScore: report.projectedScore,
      skillDeltas: enrichedDeltas,
      timestamp: new Date().toISOString()
    };

    simulationStack.pushState(stateSnapshot);
    dataStore.addSimulation(stateSnapshot);

    return {
      ...report,
      historyLength: simulationStack.undoStack.length,
      canUndo: simulationStack.undoStack.length > 1,
      canRedo: simulationStack.redoStack.length > 0
    };
  }

  /**
   * Undo simulation step
   */
  static undoSimulation() {
    const prevState = simulationStack.undo();
    return {
      state: prevState,
      canUndo: simulationStack.undoStack.length > 1,
      canRedo: simulationStack.redoStack.length > 0
    };
  }

  /**
   * Redo simulation step
   */
  static redoSimulation() {
    const nextState = simulationStack.redo();
    return {
      state: nextState,
      canUndo: simulationStack.undoStack.length > 1,
      canRedo: simulationStack.redoStack.length > 0
    };
  }

  /**
   * Simulate a Career Pivot (e.g., Data Analyst -> Data Scientist)
   */
  static runCareerPivot(fromCareerId, toCareerId) {
    const student = dataStore.getStudent();
    const fromCareer = dataStore.getCareer(fromCareerId);
    const toCareer = dataStore.getCareer(toCareerId);

    if (!fromCareer || !toCareer) {
      throw new Error('Both source and target careers must be specified');
    }

    return SimulatorEngine.simulateCareerPivot(student.skills, fromCareer, toCareer);
  }
}
