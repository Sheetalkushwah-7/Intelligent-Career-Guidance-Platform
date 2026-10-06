/**
 * models/schemas/LearningPlan.js
 * Mongoose schema for a time-budget learning plan (Knapsack optimizer output).
 *
 * Matches the plan record stored by OptimizerService via DataStore.saveLearningPlan().
 *
 * @typedef {Object} LearningPlanShape
 * @property {string}  id
 * @property {string}  studentId
 * @property {string}  targetCareerId
 * @property {number}  budgetHours
 * @property {number}  totalPlannedHours
 * @property {number}  totalImpactGained
 * @property {number}  efficiencyRatio
 * @property {number}  selectedTasksCount
 * @property {Object[]} selectedTasks
 * @property {Date}    createdAt
 */

let LearningPlanModel = null;

export async function getLearningPlanModel() {
  if (LearningPlanModel) return LearningPlanModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        studentId: { type: String, index: true },
        targetCareerId: { type: String, default: 'data_scientist' },
        budgetHours: { type: Number, required: true, min: 0 },
        totalPlannedHours: { type: Number, default: 0 },
        totalImpactGained: { type: Number, default: 0 },
        efficiencyRatio: { type: Number, default: 0 },
        selectedTasksCount: { type: Number, default: 0 },
        selectedTasks: [mongoose.Schema.Types.Mixed],
      },
      { timestamps: true }
    );

    schema.index({ studentId: 1, createdAt: -1 });

    LearningPlanModel =
      mongoose.models.LearningPlan || mongoose.model('LearningPlan', schema);
    return LearningPlanModel;
  } catch {
    return null;
  }
}
