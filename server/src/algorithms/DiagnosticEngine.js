/**
 * DiagnosticEngine.js
 * Adaptive DSA Skill & Root-Cause Weakness Diagnosis Engine.
 * 
 * Analyzes code submissions beyond simple "Wrong Answer" or "TLE".
 * Evaluates:
 *  - Failure pattern signatures (empty input, boundary extremes, large scale input)
 *  - Time/Space complexity profile
 *  - Code approach heuristics (nested loops, missing hash lookups, recursion depth)
 *  - Updates concept mastery vectors [0 - 100]
 *  - Maps root causes to 18 specific DSA weaknesses
 */

export const WEAKNESS_TYPES = {
  ARRAY_TRAVERSAL: 'array_traversal',
  HASHMAP_USAGE: 'hashmap_usage',
  TWO_POINTERS: 'two_pointers',
  SLIDING_WINDOW: 'sliding_window',
  BINARY_SEARCH: 'binary_search',
  RECURSION_BASE_CASE: 'recursion_base_case',
  STACK_USAGE: 'stack_usage',
  QUEUE_BFS: 'queue_bfs',
  LINKED_LIST_POINTERS: 'linked_list_pointers',
  TREE_TRAVERSAL: 'tree_traversal',
  GRAPH_VISITED_SET: 'graph_visited_set',
  DP_MEMOIZATION: 'dp_memoization',
  TIME_COMPLEXITY_TLE: 'time_complexity_tle',
  SPACE_COMPLEXITY_MLE: 'space_complexity_mle',
  EDGE_CASE_EMPTY: 'edge_case_empty',
  EDGE_CASE_BOUNDS: 'edge_case_bounds',
  BRUTE_FORCE_TENDENCY: 'brute_force_tendency',
  OPTIMIZATION_WEAKNESS: 'optimization_weakness'
};

export class DiagnosticEngine {
  /**
   * Perform comprehensive diagnosis on a submission
   * @param {object} params
   * @param {string} params.code Student's submitted code
   * @param {object} params.problem Problem definition with concepts and expected complexities
   * @param {Array<object>} params.testCaseResults Array of { input, expected, actual, passed, isEdgeCase, isScaleCase, executionTimeMs }
   * @param {object} params.currentMastery Student's current concept mastery map
   * @returns {object} Diagnosis report
   */
  static diagnose({ code, problem, testCaseResults = [], currentMastery = {} }) {
    const passedCount = testCaseResults.filter(t => t.passed).length;
    const totalCount = testCaseResults.length;
    const isAccepted = passedCount === totalCount && totalCount > 0;

    const detectedWeaknesses = [];
    const detectedPatterns = [];
    const failedCases = testCaseResults.filter(t => !t.passed);

    // 1. Analyze Code Patterns (AST/Regex heuristics)
    const codeAnalysis = this._analyzeCodePatterns(code, problem);
    detectedPatterns.push(...codeAnalysis.patterns);

    // 2. Analyze Test Case Failure Signatures
    if (!isAccepted) {
      const caseAnalysis = this._analyzeFailures(failedCases, testCaseResults, problem);
      detectedWeaknesses.push(...caseAnalysis.weaknesses);
    }

    // Add weaknesses identified from code heuristics
    detectedWeaknesses.push(...codeAnalysis.weaknesses);

    // Deduplicate weaknesses preserving highest severity
    const uniqueWeaknesses = Array.from(new Set(detectedWeaknesses));

    // 3. Compute Updated Mastery Scores
    const updatedMastery = this._computeMasteryUpdates(
      currentMastery,
      problem.concepts || [],
      isAccepted,
      uniqueWeaknesses
    );

    // 4. Generate Explainable Diagnostic Feedback
    const primaryWeakness = uniqueWeaknesses[0] || (isAccepted ? null : WEAKNESS_TYPES.OPTIMIZATION_WEAKNESS);
    const feedback = this._generateFeedback(primaryWeakness, problem, isAccepted, codeAnalysis);

    return {
      status: isAccepted ? 'ACCEPTED' : (failedCases.some(c => c.isScaleCase) ? 'TIME_LIMIT_EXCEEDED' : 'WRONG_ANSWER'),
      passRate: totalCount > 0 ? `${passedCount}/${totalCount}` : '0/0',
      passedPercent: totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0,
      isAccepted,
      primaryWeakness,
      detectedWeaknesses: uniqueWeaknesses,
      detectedPatterns,
      estimatedTimeComplexity: codeAnalysis.timeComplexity,
      estimatedSpaceComplexity: codeAnalysis.spaceComplexity,
      feedback,
      updatedMastery,
      recommendedAction: this._recommendNextAction(primaryWeakness, problem)
    };
  }

  /**
   * Static analysis of code patterns
   */
  static _analyzeCodePatterns(code, problem) {
    const weaknesses = [];
    const patterns = [];
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // strip comments

    // Detect nested loops
    const loopRegex = /(for\s*\(|while\s*\(|for\s+await)/g;
    const loopMatches = cleanCode.match(loopRegex) || [];
    const hasNestedLoops = /for\s*\([^)]*\)\s*\{[^{}]*(?:for|while)\s*\(/s.test(cleanCode) ||
      /while\s*\([^)]*\)\s*\{[^{}]*(?:for|while)\s*\(/s.test(cleanCode);

    // Detect quadratic vs linear requirements
    if (hasNestedLoops) {
      patterns.push('Nested iterative loops detected (Potential O(N^2))');
      if (problem.expectedTimeComplexity && problem.expectedTimeComplexity.includes('O(N)')) {
        weaknesses.push(WEAKNESS_TYPES.BRUTE_FORCE_TENDENCY);
        weaknesses.push(WEAKNESS_TYPES.TIME_COMPLEXITY_TLE);
      }
    }

    // Detect linear searches inside loops: indexOf, includes, find
    const hasSearchInLoop = /(?:for|while)\s*\([^{]*\{[^{}]*\.(?:indexOf|includes|find)\s*\(/s.test(cleanCode);
    if (hasSearchInLoop) {
      patterns.push('Array linear search (.includes/indexOf) called inside loop');
      weaknesses.push(WEAKNESS_TYPES.HASHMAP_USAGE);
      weaknesses.push(WEAKNESS_TYPES.OPTIMIZATION_WEAKNESS);
    }

    // Detect recursion without explicit base case return
    const isRecursive = /function\s+([a-zA-Z0-9_$]+)[\s\S]*?\1\s*\(/.test(cleanCode) ||
      /const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>)[\s\S]*?\1\s*\(/.test(cleanCode);
    if (isRecursive) {
      patterns.push('Recursive subroutine detected');
      const hasBaseCase = /if\s*\([^{}]*\)\s*return/s.test(cleanCode);
      if (!hasBaseCase) {
        weaknesses.push(WEAKNESS_TYPES.RECURSION_BASE_CASE);
      }

      // Check if problem is DP and recursive solution lacks memo/cache
      const isDPProblem = (problem.concepts || []).some(c => c.toLowerCase().includes('dynamic') || c.toLowerCase().includes('dp'));
      const hasMemo = /memo|cache|dp\[|Map\(|new Array/i.test(cleanCode);
      if (isDPProblem && !hasMemo) {
        patterns.push('Recursive exploration without memoization / DP cache');
        weaknesses.push(WEAKNESS_TYPES.DP_MEMOIZATION);
        weaknesses.push(WEAKNESS_TYPES.BRUTE_FORCE_TENDENCY);
      }
    }

    // Two pointers check
    const hasTwoPointers = /left\s*=\s*0|let\s+l\s*=\s*0|right\s*=\s*|let\s+r\s*=/i.test(cleanCode);
    if (hasTwoPointers) {
      patterns.push('Two-pointer pattern identified');
    }

    // Hash map check
    const usesHashMap = /new\s+Map|new\s+Set|\bmap\b|\bhash\b|\{\}/i.test(cleanCode);
    if (usesHashMap) {
      patterns.push('Hash-based key-value structure utilized');
    }

    return {
      patterns,
      weaknesses,
      timeComplexity: hasNestedLoops ? 'O(N^2)' : (isRecursive ? 'O(2^N) or O(N)' : 'O(N)'),
      spaceComplexity: usesHashMap ? 'O(N)' : 'O(1)'
    };
  }

  /**
   * Analyze failed test cases
   */
  static _analyzeFailures(failedCases, allCases, problem) {
    const weaknesses = [];

    for (const failed of failedCases) {
      // Scale cases: passed small, failed large -> TLE / Brute Force
      if (failed.isScaleCase || failed.executionTimeMs > 200) {
        weaknesses.push(WEAKNESS_TYPES.TIME_COMPLEXITY_TLE);
        weaknesses.push(WEAKNESS_TYPES.BRUTE_FORCE_TENDENCY);
      }

      // Edge cases: empty or single element
      if (failed.isEdgeCase) {
        const inpStr = JSON.stringify(failed.input);
        if (inpStr === '[]' || inpStr === '""' || inpStr === 'null' || inpStr === '0') {
          weaknesses.push(WEAKNESS_TYPES.EDGE_CASE_EMPTY);
        } else {
          weaknesses.push(WEAKNESS_TYPES.EDGE_CASE_BOUNDS);
        }
      }

      // Array boundary errors (e.g. undefined output)
      if (failed.actual === undefined || failed.actual === null || String(failed.actual).includes('NaN')) {
        weaknesses.push(WEAKNESS_TYPES.ARRAY_TRAVERSAL);
      }
    }

    return { weaknesses };
  }

  /**
   * Compute dynamic mastery updates for student concepts
   */
  static _computeMasteryUpdates(currentMastery, problemConcepts, isAccepted, weaknesses) {
    const updated = { ...currentMastery };

    for (const concept of problemConcepts) {
      const currentScore = updated[concept] ?? 50; // default baseline 50

      if (isAccepted) {
        // Gain mastery on successful submission
        const gain = weaknesses.length > 0 ? 5 : 12;
        updated[concept] = Math.min(100, currentScore + gain);
      } else {
        // Mild decay on failure targeting weaknesses
        const penalty = 8;
        updated[concept] = Math.max(0, currentScore - penalty);
      }
    }

    return updated;
  }

  /**
   * Generate human-readable, educational root-cause explanation
   */
  static _generateFeedback(weakness, problem, isAccepted, codeAnalysis) {
    if (isAccepted && (!weakness || weakness === WEAKNESS_TYPES.OPTIMIZATION_WEAKNESS)) {
      return {
        headline: 'Solution Passed All Test Cases!',
        explanation: `Great work! Your solution correctly met the algorithmic constraints (${codeAnalysis.timeComplexity} time).`,
        tip: 'Consider reviewing the solution tab to explore alternative one-pass or constant space trade-offs.'
      };
    }

    switch (weakness) {
      case WEAKNESS_TYPES.TIME_COMPLEXITY_TLE:
      case WEAKNESS_TYPES.BRUTE_FORCE_TENDENCY:
        return {
          headline: 'Time Limit Exceeded / Suboptimal Quadratic Loop',
          explanation: `Your submission used nested iterations (${codeAnalysis.timeComplexity}), which times out on large inputs ($N \\ge 10^5$). Expected target complexity is ${problem.expectedTimeComplexity || 'O(N)'}.`,
          tip: 'Replace the inner linear scan with an auxiliary HashMap lookup or sort the array and apply Two Pointers to achieve linear O(N) execution.'
        };
      case WEAKNESS_TYPES.EDGE_CASE_EMPTY:
      case WEAKNESS_TYPES.EDGE_CASE_BOUNDS:
        return {
          headline: 'Edge Case & Boundary Failure',
          explanation: 'Your code failed on boundary test cases (e.g. empty collection, single-element input, or negative values).',
          tip: 'Always validate base boundary conditions at the beginning of your function (e.g., if (!arr || arr.length === 0) return ...).'
        };
      case WEAKNESS_TYPES.HASHMAP_USAGE:
        return {
          headline: 'Suboptimal Search in Iteration',
          explanation: 'Detected .includes() or .indexOf() inside an active loop, turning a potential linear pass into quadratic O(N^2) work.',
          tip: 'Pre-populate a JavaScript Set or Map in one pass, then perform O(1) key lookups.'
        };
      case WEAKNESS_TYPES.DP_MEMOIZATION:
        return {
          headline: 'Overlapping Subproblems Without Caching',
          explanation: 'Your recursive approach recalculates the same subproblems repeatedly, creating exponential O(2^N) calls.',
          tip: 'Introduce a memoization table (e.g. memo = new Map() or 2D array) to cache return values for seen states.'
        };
      case WEAKNESS_TYPES.RECURSION_BASE_CASE:
        return {
          headline: 'Unbounded Recursion / Missing Base Case',
          explanation: 'The call stack exceeded limits or terminated prematurely without reaching a valid base case.',
          tip: 'Ensure every recursive path has a strictly reachable termination condition.'
        };
      default:
        return {
          headline: 'Algorithmic State Inconsistency',
          explanation: 'The outputs produced on certain test cases deviated from the expected values. Check pointer increments and array indexing.',
          tip: 'Walk through your code line by line with a 3-element dry run.'
        };
    }
  }

  /**
   * Suggest next best actionable remediation
   */
  static _recommendNextAction(weakness, problem) {
    if (!weakness) {
      return {
        type: 'ADVANCE',
        title: 'Advance to Next Difficulty',
        message: 'You have demonstrated solid mastery. Proceed to the next problem in your topological path.'
      };
    }

    return {
      type: 'REMEDY_WEAKNESS',
      weakness,
      title: `Reinforce: ${weakness.replace(/_/g, ' ').toUpperCase()}`,
      message: `Practice targeted problems focused on overcoming ${weakness.replace(/_/g, ' ')} before proceeding to advanced modules.`
    };
  }
}
