/**
 * dsaService.js
 * DSA Practice, Safe Code Execution Runner, Adaptive Diagnostic Pipeline, and Viva Engine.
 */

import vm from 'node:vm';
import { DiagnosticEngine } from '../algorithms/DiagnosticEngine.js';
import { SearchSort } from '../algorithms/SearchSort.js';
import { dataStore } from '../models/DataStore.js';

export class DSAService {
  /**
   * Get all problems with optional concept/difficulty/search filtering
   */
  static getProblems({ difficulty, concept, search } = {}) {
    let problems = dataStore.getAllProblems();

    if (difficulty && difficulty !== 'ALL') {
      problems = problems.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (concept && concept !== 'ALL') {
      problems = problems.filter(p => (p.concepts || []).some(c => c.toLowerCase().includes(concept.toLowerCase())));
    }

    if (search) {
      const q = search.toLowerCase();
      problems = problems.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    return SearchSort.quickSort(problems, (a, b) => a.estimatedMinutes - b.estimatedMinutes);
  }

  /**
   * Execute student's code against test cases in a sandboxed context
   * @param {string} problemId 
   * @param {string} code 
   */
  static executeCode(problemId, code) {
    const problem = dataStore.getProblem(problemId);
    if (!problem) {
      throw new Error(`Problem '${problemId}' not found`);
    }

    const testCaseResults = [];

    for (const tc of problem.testCases || []) {
      const startTime = performance.now();
      let actualOutput = null;
      let runtimeError = null;
      let passed = false;

      try {
        // Create isolated VM sandbox with 500ms timeout
        const sandbox = {
          console: { log: () => {} }
        };
        const context = vm.createContext(sandbox);

        // Prepare invocation call
        const funcNameMatch = code.match(/function\s+([a-zA-Z0-9_$]+)/);
        const funcName = funcNameMatch ? funcNameMatch[1] : 'solution';

        // Extract input arguments
        const argValues = Object.values(tc.input);
        const scriptCode = `
          ${code}
          ${funcName}(...${JSON.stringify(argValues)});
        `;

        const script = new vm.Script(scriptCode);
        actualOutput = script.runInContext(context, { timeout: 500 });

        // Evaluate equality
        passed = JSON.stringify(actualOutput) === JSON.stringify(tc.expected);
      } catch (err) {
        runtimeError = err.message;
        passed = false;
      }

      const executionTimeMs = +(performance.now() - startTime).toFixed(2);

      testCaseResults.push({
        testCaseId: tc.id,
        input: tc.input,
        expected: tc.expected,
        actual: actualOutput,
        passed,
        error: runtimeError,
        isEdgeCase: tc.isEdgeCase || false,
        isScaleCase: tc.isScaleCase || false,
        executionTimeMs
      });
    }

    // Run Adaptive Diagnosis
    const student = dataStore.getStudent();
    const diagnosis = DiagnosticEngine.diagnose({
      code,
      problem,
      testCaseResults,
      currentMastery: student.conceptMastery
    });

    // Update student mastery
    dataStore.updateStudentMastery(diagnosis.updatedMastery);

    // Record submission
    const submissionRecord = {
      id: `sub_${Date.now()}`,
      problemId,
      problemTitle: problem.title,
      code,
      status: diagnosis.status,
      passRate: diagnosis.passRate,
      primaryWeakness: diagnosis.primaryWeakness,
      detectedWeaknesses: diagnosis.detectedWeaknesses,
      timestamp: new Date().toISOString()
    };
    dataStore.addSubmission(submissionRecord);

    return {
      submission: submissionRecord,
      testCaseResults,
      diagnosis,
      vivaQuestions: problem.vivaQuestions || []
    };
  }

  /**
   * AI Viva Explanation & Complexity Check
   */
  static evaluateViva(problemId, { explanation, timeComplexity, spaceComplexity }) {
    const problem = dataStore.getProblem(problemId);
    if (!problem) throw new Error('Problem not found');

    const expectedTime = problem.expectedTimeComplexity || 'O(N)';
    const expectedSpace = problem.expectedSpaceComplexity || 'O(1)';

    const timeNormalized = (timeComplexity || '').replace(/\s+/g, '').toUpperCase();
    const expTimeNormalized = expectedTime.replace(/\s+/g, '').toUpperCase();
    const isTimeCorrect = timeNormalized === expTimeNormalized;

    const spaceNormalized = (spaceComplexity || '').replace(/\s+/g, '').toUpperCase();
    const expSpaceNormalized = expectedSpace.replace(/\s+/g, '').toUpperCase();
    const isSpaceCorrect = spaceNormalized.includes(expSpaceNormalized) || expSpaceNormalized.includes(spaceNormalized);

    // Explanation heuristic
    const explanationLen = (explanation || '').trim().split(/\s+/).length;
    const isExplanationSubstantive = explanationLen >= 15;

    let score = 0;
    if (isTimeCorrect) score += 35;
    if (isSpaceCorrect) score += 35;
    if (isExplanationSubstantive) score += 30;

    return {
      vivaScore: score,
      rating: score >= 85 ? 'EXCELLENT' : (score >= 65 ? 'PROFICIENT' : 'NEEDS_CLARITY'),
      timeEvaluation: {
        provided: timeComplexity,
        expected: expectedTime,
        isCorrect: isTimeCorrect,
        feedback: isTimeCorrect 
          ? 'Accurate time complexity analysis.' 
          : `Expected ${expectedTime}. Make sure you account for loop boundaries and inner operations.`
      },
      spaceEvaluation: {
        provided: spaceComplexity,
        expected: expectedSpace,
        isCorrect: isSpaceCorrect,
        feedback: isSpaceCorrect
          ? 'Accurate auxiliary space analysis.'
          : `Expected ${expectedSpace}. Check for auxiliary hash maps or recursion call stacks.`
      },
      explanationFeedback: isExplanationSubstantive
        ? 'Well-articulated reasoning and structural explanation.'
        : 'Explanation was somewhat brief. Interviewers expect a clear description of the invariants and data structure rationale.'
    };
  }
}
