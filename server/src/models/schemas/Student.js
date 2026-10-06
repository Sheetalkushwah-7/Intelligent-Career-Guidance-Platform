/**
 * models/schemas/Student.js
 * Mongoose schema for a Student profile.
 *
 * Represents a single learner using the platform.
 * Skills and conceptMastery are stored as Maps for O(1) key-access.
 */

/**
 * @typedef {Object} SkillHistoryEntry
 * @property {string} skillId
 * @property {string} skillName
 * @property {number} proficiency      0–100
 * @property {number} lastPracticedDays  Days since last practice session
 * @property {number} repetitions      Total practice repetitions
 */

/**
 * @typedef {Object} StudentShape
 * @property {string}  id
 * @property {string}  name
 * @property {string}  email
 * @property {string}  degree
 * @property {number}  semester          1–8
 * @property {string}  targetCareerId    FK → Career.id
 * @property {Object}  skills            { [skillId]: proficiency (0–100) }
 * @property {Object}  conceptMastery    { [conceptName]: mastery (0–100) }
 * @property {SkillHistoryEntry[]} skillHistory
 * @property {Date}    createdAt
 * @property {Date}    updatedAt
 */

let StudentModel = null;

/**
 * Lazily build and cache the Mongoose model.
 * Returns null when Mongoose is not available (MemoryStore mode).
 */
export async function getStudentModel() {
  if (StudentModel) return StudentModel;

  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        degree: { type: String, default: 'B.Tech CSE (Data Science)' },
        semester: { type: Number, min: 1, max: 8, default: 1 },
        targetCareerId: { type: String, default: 'data_scientist' },
        skills: {
          type: Map,
          of: { type: Number, min: 0, max: 100 },
          default: {},
        },
        conceptMastery: {
          type: Map,
          of: { type: Number, min: 0, max: 100 },
          default: {},
        },
        skillHistory: [
          {
            skillId: { type: String, required: true },
            skillName: { type: String },
            proficiency: { type: Number, min: 0, max: 100 },
            lastPracticedDays: { type: Number, default: 0 },
            repetitions: { type: Number, default: 0 },
          },
        ],
      },
      {
        timestamps: true,
        toJSON: { virtuals: true },
      }
    );

    StudentModel = mongoose.models.Student || mongoose.model('Student', schema);
    return StudentModel;
  } catch {
    return null;
  }
}
