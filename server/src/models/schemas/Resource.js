/**
 * models/schemas/Resource.js
 * Mongoose schema for a Learning Resource.
 *
 * Resources are curated external materials (courses, videos, articles,
 * exercises) attached to specific skills. Used by LearningService to
 * enrich the topological learning path with actionable study links.
 *
 * @typedef {Object} ResourceShape
 * @property {string}  id            Unique slug
 * @property {string}  title         Resource title
 * @property {string}  skillId       FK → Skill.id
 * @property {string}  type          'video' | 'article' | 'course' | 'exercise' | 'documentation'
 * @property {string}  url           Link to resource
 * @property {string}  provider      Source platform (e.g. 'YouTube', 'Coursera')
 * @property {number}  durationHours Estimated hours to complete
 * @property {boolean} isFree        Whether the resource is freely accessible
 * @property {string}  difficulty    'Beginner' | 'Intermediate' | 'Advanced'
 */

let ResourceModel = null;

export async function getResourceModel() {
  if (ResourceModel) return ResourceModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        title: { type: String, required: true },
        skillId: { type: String, required: true, index: true },
        type: {
          type: String,
          enum: ['video', 'article', 'course', 'exercise', 'documentation'],
          default: 'article',
        },
        url: { type: String, default: '' },
        provider: { type: String, default: '' },
        durationHours: { type: Number, default: 1 },
        isFree: { type: Boolean, default: true },
        difficulty: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced'],
          default: 'Intermediate',
        },
      },
      { timestamps: true }
    );

    ResourceModel = mongoose.models.Resource || mongoose.model('Resource', schema);
    return ResourceModel;
  } catch {
    return null;
  }
}
