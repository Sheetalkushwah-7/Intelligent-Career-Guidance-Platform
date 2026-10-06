/**
 * models/schemas/Career.js
 * Mongoose schema for a Career profile.
 *
 * Careers are the goal nodes in the Knowledge Graph.
 * Each career holds an array of required skills with minimum proficiency
 * thresholds and weights — consumed by the SimulatorEngine and PriorityQueue
 * to calculate compatibility scores and skill gaps.
 *
 * @typedef {{ skillId: string, skillName: string, minProficiency: number, weight: number }} RequiredSkill
 *
 * @typedef {Object} CareerShape
 * @property {string}          id             Unique slug (e.g. 'data_scientist')
 * @property {string}          title          Display name
 * @property {string}          category       Domain category
 * @property {string}          description    Role description
 * @property {number}          marketDemand   0–100 market demand index
 * @property {string}          medianSalary   Formatted salary string
 * @property {RequiredSkill[]} requiredSkills Weighted skill requirements
 */

let CareerModel = null;

export async function getCareerModel() {
  if (CareerModel) return CareerModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const RequiredSkillSchema = new mongoose.Schema(
      {
        skillId: { type: String, required: true },
        skillName: { type: String, required: true },
        minProficiency: { type: Number, min: 0, max: 100, required: true },
        weight: { type: Number, default: 1.0 },
      },
      { _id: false }
    );

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        title: { type: String, required: true },
        category: { type: String, default: 'General' },
        description: { type: String, default: '' },
        marketDemand: { type: Number, min: 0, max: 100, default: 50 },
        medianSalary: { type: String, default: '' },
        requiredSkills: [RequiredSkillSchema],
      },
      { timestamps: true }
    );

    CareerModel = mongoose.models.Career || mongoose.model('Career', schema);
    return CareerModel;
  } catch {
    return null;
  }
}
