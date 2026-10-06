/**
 * models/schemas/LearningTask.js
 * Mongoose schema for a Learning Task — the core unit of the Knapsack optimizer.
 *
 * Each LearningTask represents a discrete study activity (e.g. "Complete
 * Graphs module on LeetCode"). Tasks have an estimated time cost and a
 * career-value score. The KnapsackDP algorithm selects the optimal subset
 * of tasks that maximises value within the student's hour budget.
 *
 * @typedef {Object} LearningTaskShape
 * @property {string}   id              Unique slug
 * @property {string}   title           Task display name
 * @property {string}   skillId         FK → Skill.id (which skill this improves)
 * @property {number}   estimatedHours  Time cost in hours
 * @property {number}   valuePoints     Career value score (optimizer objective)
 * @property {string[]} prerequisites   Task IDs that must be completed first
 * @property {string}   taskType        'video' | 'practice' | 'project' | 'reading'
 * @property {string}   description     Short description of the task
 */

let LearningTaskModel = null;

export async function getLearningTaskModel() {
  if (LearningTaskModel) return LearningTaskModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        title: { type: String, required: true },
        skillId: { type: String, required: true, index: true },
        estimatedHours: { type: Number, required: true, min: 0.5 },
        valuePoints: { type: Number, required: true, min: 1 },
        prerequisites: [{ type: String }],
        taskType: {
          type: String,
          enum: ['video', 'practice', 'project', 'reading', 'exercise'],
          default: 'practice',
        },
        description: { type: String, default: '' },
      },
      { timestamps: true }
    );

    LearningTaskModel = mongoose.models.LearningTask || mongoose.model('LearningTask', schema);
    return LearningTaskModel;
  } catch {
    return null;
  }
}
