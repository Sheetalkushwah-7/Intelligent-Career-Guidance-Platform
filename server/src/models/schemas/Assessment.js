/**
 * models/schemas/Assessment.js
 * Mongoose schema for a Student Assessment snapshot.
 *
 * Records the result of a skill self-assessment or diagnostic quiz.
 * Each Assessment captures the student's declared/measured skill
 * proficiencies at a point in time, enabling longitudinal progress tracking.
 *
 * @typedef {Object} AssessmentShape
 * @property {string}  studentId   FK → Student.id
 * @property {Object}  skills      { [skillId]: proficiency (0–100) }
 * @property {Object}  answers     { [questionId]: selected option value }
 * @property {Object[]} skillProfile Sorted score bands generated from answers
 * @property {string}  type        'self_report' | 'diagnostic' | 'viva'
 * @property {number}  version     Assessment version/attempt number
 * @property {Date}    answeredAt  When the assessment was completed
 */

let AssessmentModel = null;

export async function getAssessmentModel() {
  if (AssessmentModel) return AssessmentModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        studentId: { type: String, required: true, index: true },
        skills: {
          type: Map,
          of: { type: Number, min: 0, max: 100 },
          required: true,
        },
        answers: {
          type: Map,
          of: { type: String },
          required: true,
        },
        overallScore: { type: Number, required: true, min: 0, max: 100 },
        questionCount: { type: Number, required: true, min: 1 },
        correctCount: { type: Number, required: true, min: 0 },
        type: {
          type: String,
          enum: ['self_report', 'diagnostic', 'viva'],
          default: 'self_report',
        },
        version: { type: Number, default: 1 },
        answeredAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    AssessmentModel = mongoose.models.Assessment || mongoose.model('Assessment', schema);
    return AssessmentModel;
  } catch {
    return null;
  }
}
