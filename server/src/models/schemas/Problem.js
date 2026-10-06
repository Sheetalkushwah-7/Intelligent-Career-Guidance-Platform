/**
 * models/schemas/Problem.js
 * Mongoose schema for a DSA Practice Problem.
 *
 * Problems are the primary unit of DSA practice. Each problem includes
 * sandboxed test cases, starter code, expected complexity, viva questions,
 * and concept tags — consumed by DSAService and DiagnosticEngine.
 *
 * @typedef {{ id: string, description: string, input: Object, expected: any, isEdgeCase?: boolean, isScaleCase?: boolean }} TestCase
 *
 * @typedef {Object} ProblemShape
 * @property {string}     id                       Unique slug
 * @property {string}     title                    Display title
 * @property {string}     difficulty               'Easy' | 'Medium' | 'Hard'
 * @property {string[]}   concepts                 DSA concepts covered
 * @property {string}     description              Problem statement
 * @property {string}     starterCode              JavaScript function skeleton
 * @property {TestCase[]} testCases                Automated test cases
 * @property {string}     expectedTimeComplexity   e.g. 'O(N)'
 * @property {string}     expectedSpaceComplexity  e.g. 'O(1)'
 * @property {string[]}   vivaQuestions            Interview follow-up questions
 * @property {number}     estimatedMinutes         Estimated time to solve
 */

let ProblemModel = null;

export async function getProblemModel() {
  if (ProblemModel) return ProblemModel;
  try {
    const { default: mongoose } = await import('mongoose');
    if (mongoose.connection.readyState !== 1) return null;

    const TestCaseSchema = new mongoose.Schema(
      {
        id: { type: String },
        description: { type: String },
        input: { type: mongoose.Schema.Types.Mixed },
        expected: { type: mongoose.Schema.Types.Mixed },
        isEdgeCase: { type: Boolean, default: false },
        isScaleCase: { type: Boolean, default: false },
      },
      { _id: false }
    );

    const schema = new mongoose.Schema(
      {
        id: { type: String, required: true, unique: true, index: true },
        title: { type: String, required: true },
        difficulty: {
          type: String,
          enum: ['Easy', 'Medium', 'Hard'],
          required: true,
        },
        concepts: [{ type: String }],
        description: { type: String, default: '' },
        starterCode: { type: String, default: '' },
        testCases: [TestCaseSchema],
        expectedTimeComplexity: { type: String, default: 'O(N)' },
        expectedSpaceComplexity: { type: String, default: 'O(1)' },
        vivaQuestions: [{ type: String }],
        estimatedMinutes: { type: Number, default: 30 },
      },
      { timestamps: true }
    );

    ProblemModel = mongoose.models.Problem || mongoose.model('Problem', schema);
    return ProblemModel;
  } catch {
    return null;
  }
}
