/**
 * models/schemas/Simulation.js
 * Mongoose schema for a What-If Career Readiness Simulation.
 *
 * Records every simulation run — the baseline score, projected score,
 * applied skill deltas, and newly unlocked careers. Stored in the
 * SimulationStack (undo/redo) during the session and persisted here
 * for audit history and analytics dashboards.
 *
 * @typedef {{ skillId: string, skillName: string, previous: number, simulated: number, delta: number }} AppliedChange
 *
 * @typedef {Object} SimulationShape
 * @property {string}          id               Auto-generated unique ID
 * @property {string}          studentId        FK → Student.id
 * @property {string}          careerId         FK → Career.id (target career)
 * @property {string}          careerTitle      Denormalised for display
 * @property {number}          baselineScore    Career readiness before simulation
 * @property {number}          projectedScore   Career readiness after simulation
 * @property {Object[]}        skillDeltas      Requested skill improvements
 * @property {AppliedChange[]} appliedChanges   Actual mutations with before/after values
 * @property {string[]}        unlockedCareers  Careers newly above 70% after simulation
 * @property {Date}            timestamp        When the simulation was run
 */

let SimulationModel = null;

export async function getSimulationModel() {
  if (SimulationModel) return SimulationModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const AppliedChangeSchema = new mongoose.Schema(
      {
        skillId: { type: String },
        skillName: { type: String },
        previous: { type: Number },
        simulated: { type: Number },
        delta: { type: Number },
      },
      { _id: false }
    );

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        studentId: { type: String, required: true, index: true },
        careerId: { type: String, required: true },
        careerTitle: { type: String, default: '' },
        baselineScore: { type: Number, min: 0, max: 100, default: 0 },
        projectedScore: { type: Number, min: 0, max: 100, default: 0 },
        skillDeltas: [mongoose.Schema.Types.Mixed],
        appliedChanges: [AppliedChangeSchema],
        unlockedCareers: [{ type: String }],
        timestamp: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    schema.index({ studentId: 1, timestamp: -1 });

    SimulationModel =
      mongoose.models.Simulation || mongoose.model('Simulation', schema);
    return SimulationModel;
  } catch {
    return null;
  }
}
