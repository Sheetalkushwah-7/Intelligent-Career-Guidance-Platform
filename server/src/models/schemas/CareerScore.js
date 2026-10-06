/**
 * models/schemas/CareerScore.js
 * Mongoose schema for a cached Career Readiness Score.
 *
 * Stores the output of SimulatorEngine.calculateReadiness() for a specific
 * student-career pair. Enables dashboards to display historical compatibility
 * trend lines without recomputing from scratch every request.
 *
 * @typedef {{ skillId: string, skillName: string, gap: number, requiredProficiency: number, currentProficiency: number, weight: number }} GapEntry
 *
 * @typedef {Object} CareerScoreShape
 * @property {string}     studentId           FK → Student.id
 * @property {string}     careerId            FK → Career.id
 * @property {string}     careerTitle         Denormalised for display
 * @property {number}     compatibilityScore  0–100 weighted readiness score
 * @property {GapEntry[]} gaps                Ordered list of unfilled skill gaps
 * @property {Object[]}   fulfilledSkills     Skills meeting the requirement
 * @property {Date}       calculatedAt        When this score was last computed
 */

let CareerScoreModel = null;

export async function getCareerScoreModel() {
  if (CareerScoreModel) return CareerScoreModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const GapSchema = new mongoose.Schema(
      {
        skillId: { type: String },
        skillName: { type: String },
        gap: { type: Number },
        requiredProficiency: { type: Number },
        currentProficiency: { type: Number },
        weight: { type: Number },
      },
      { _id: false }
    );

    const schema = new mongoose.Schema(
      {
        studentId: { type: String, required: true, index: true },
        careerId: { type: String, required: true, index: true },
        careerTitle: { type: String, default: '' },
        compatibilityScore: { type: Number, min: 0, max: 100, default: 0 },
        gaps: [GapSchema],
        fulfilledSkills: [mongoose.Schema.Types.Mixed],
        calculatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    // Most-recent score per student-career pair
    schema.index({ studentId: 1, careerId: 1, calculatedAt: -1 });

    CareerScoreModel =
      mongoose.models.CareerScore || mongoose.model('CareerScore', schema);
    return CareerScoreModel;
  } catch {
    return null;
  }
}
