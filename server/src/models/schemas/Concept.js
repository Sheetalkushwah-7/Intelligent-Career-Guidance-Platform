/**
 * models/schemas/Concept.js
 * Mongoose schema for a DSA/CS Concept node.
 *
 * Concepts are fine-grained sub-topics within a Skill.
 * For example, the 'trees_graphs' skill covers concepts like
 * 'BFS Traversal', 'Topological Sort', 'Dijkstra'.
 * Concept mastery is tracked separately to enable granular diagnostics.
 *
 * @typedef {Object} ConceptShape
 * @property {string}   id           Unique slug (e.g. 'topological_sort')
 * @property {string}   name         Human-readable label
 * @property {string}   category     Broad algorithmic category
 * @property {string}   description  What the concept covers
 * @property {string[]} linkedSkills Skill IDs that include this concept
 */

let ConceptModel = null;

export async function getConceptModel() {
  if (ConceptModel) return ConceptModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        category: { type: String, default: 'General' },
        description: { type: String, default: '' },
        linkedSkills: [{ type: String }],
      },
      { timestamps: true }
    );

    ConceptModel = mongoose.models.Concept || mongoose.model('Concept', schema);
    return ConceptModel;
  } catch {
    return null;
  }
}
