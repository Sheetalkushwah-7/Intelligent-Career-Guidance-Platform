/**
 * models/schemas/SkillProgress.js
 * Mongoose schema for tracking a student's skill proficiency over time.
 *
 * Provides the longitudinal time-series data needed by the DecayEngine
 * (Ebbinghaus model) to calculate retention curves and schedule spaced
 * practice revision. One document per student-skill pair.
 *
 * @typedef {{ proficiency: number, date: Date, source: string }} ProgressEntry
 *
 * @typedef {Object} SkillProgressShape
 * @property {string}           studentId        FK → Student.id
 * @property {string}           skillId          FK → Skill.id
 * @property {number}           proficiency      Current proficiency (0–100)
 * @property {number}           lastPracticedDays Days since last active session
 * @property {number}           repetitions      Total practice repetitions
 * @property {ProgressEntry[]}  history          Time-series of past proficiency scores
 */

let SkillProgressModel = null;

export async function getSkillProgressModel() {
  if (SkillProgressModel) return SkillProgressModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const ProgressEntrySchema = new mongoose.Schema(
      {
        proficiency: { type: Number, min: 0, max: 100 },
        date: { type: Date, default: Date.now },
        source: {
          type: String,
          enum: ['self_report', 'submission', 'viva', 'diagnostic'],
          default: 'submission',
        },
      },
      { _id: false }
    );

    const schema = new mongoose.Schema(
      {
        studentId: { type: String, required: true, index: true },
        skillId: { type: String, required: true, index: true },
        proficiency: { type: Number, min: 0, max: 100, default: 0 },
        lastPracticedDays: { type: Number, default: 0 },
        repetitions: { type: Number, default: 0 },
        history: [ProgressEntrySchema],
      },
      { timestamps: true }
    );

    // One record per student-skill pair
    schema.index({ studentId: 1, skillId: 1 }, { unique: true });

    SkillProgressModel =
      mongoose.models.SkillProgress || mongoose.model('SkillProgress', schema);
    return SkillProgressModel;
  } catch {
    return null;
  }
}
