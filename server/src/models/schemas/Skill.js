/**
 * models/schemas/Skill.js
 * Mongoose schema for a Skill node in the Knowledge Graph.
 *
 * Skills form the vertices of the prerequisite DAG.
 * Each skill has prerequisite edges pointing to skills that must be
 * completed before it — used by TopologicalSort for learning path ordering.
 *
 * @typedef {Object} SkillShape
 * @property {string}   id              Unique slug (e.g. 'dynamic_programming')
 * @property {string}   name            Human-readable label
 * @property {string}   category        'Core DSA' | 'Data Science' | 'Data Engineering' | 'AI' | 'Language'
 * @property {string}   difficulty      'Beginner' | 'Intermediate' | 'Advanced'
 * @property {string[]} prerequisites   Skill IDs that must be learned first
 * @property {string[]} concepts        Sub-concept labels covered by this skill
 * @property {string}   description     Short prose description
 */

let SkillModel = null;

export async function getSkillModel() {
  if (SkillModel) return SkillModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        category: {
          type: String,
          enum: ['Core DSA', 'Data Science', 'Data Engineering', 'AI', 'Language', 'Other'],
          default: 'Other',
        },
        difficulty: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced'],
          default: 'Intermediate',
        },
        prerequisites: [{ type: String }],
        concepts: [{ type: String }],
        description: { type: String, default: '' },
      },
      { timestamps: true }
    );

    SkillModel = mongoose.models.Skill || mongoose.model('Skill', schema);
    return SkillModel;
  } catch {
    return null;
  }
}
