/**
 * models/schemas/Submission.js
 * Mongoose schema for a DSA Code Submission.
 *
 * Records every code execution attempt by the student.
 * Includes the raw code, test-case pass rate, DiagnosticEngine output,
 * and detected weakness patterns. Forms the basis of the activity feed
 * and longitudinal performance analysis.
 *
 * @typedef {Object} SubmissionShape
 * @property {string}   id                  Auto-generated unique ID
 * @property {string}   studentId           FK → Student.id
 * @property {string}   problemId           FK → Problem.id
 * @property {string}   problemTitle        Denormalised for display
 * @property {string}   code                Submitted JavaScript source
 * @property {string}   status              'ACCEPTED' | 'PARTIAL' | 'FAILED' | 'ERROR'
 * @property {number}   passRate            0.0–1.0 fraction of test cases passed
 * @property {string}   primaryWeakness     Top diagnosed weakness label
 * @property {string[]} detectedWeaknesses  All detected weakness pattern IDs
 * @property {Date}     timestamp           Submission time
 */

let SubmissionModel = null;

export async function getSubmissionModel() {
  if (SubmissionModel) return SubmissionModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        studentId: { type: String, required: true, index: true },
        problemId: { type: String, required: true, index: true },
        problemTitle: { type: String, default: '' },
        code: { type: String, required: true },
        status: {
          type: String,
          enum: ['ACCEPTED', 'PARTIAL', 'FAILED', 'ERROR'],
          required: true,
        },
        passRate: { type: Number, min: 0, max: 1, default: 0 },
        primaryWeakness: { type: String, default: null },
        detectedWeaknesses: [{ type: String }],
        timestamp: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    // Index for fetching a student's submission history
    schema.index({ studentId: 1, timestamp: -1 });

    SubmissionModel = mongoose.models.Submission || mongoose.model('Submission', schema);
    return SubmissionModel;
  } catch {
    return null;
  }
}
