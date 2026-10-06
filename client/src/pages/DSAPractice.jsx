import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  HelpCircle,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { api } from '../api';
import { useStudent } from '../context/StudentContext';

export function DSAPractice() {
  const { student, refreshProfile } = useStudent();
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('description'); // 'description', 'testcases', 'hints'
  const [executionResult, setExecutionResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showVivaModal, setShowVivaModal] = useState(false);
  
  // Viva state
  const [vivaExplanation, setVivaExplanation] = useState('');
  const [vivaTime, setVivaTime] = useState('O(N)');
  const [vivaSpace, setVivaSpace] = useState('O(1)');
  const [vivaResult, setVivaResult] = useState(null);
  const [isSubmittingViva, setIsSubmittingViva] = useState(false);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      const res = await api.getProblems();
      setProblems(res.problems || []);
      if (res.problems && res.problems.length > 0) {
        selectProblem(res.problems[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectProblem = (problem) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode || '');
    setExecutionResult(null);
    setVivaResult(null);
    setActiveTab('description');
  };

  const handleRun = async () => {
    if (!selectedProblem || !code) return;
    try {
      setIsRunning(true);
      const res = await api.submitCode(selectedProblem.id, code);
      setExecutionResult(res);
      setActiveTab('testcases');
      refreshProfile(); // update mastery vector
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleVivaSubmit = async () => {
    if (!selectedProblem) return;
    try {
      setIsSubmittingViva(true);
      const res = await api.submitViva(selectedProblem.id, {
        explanation: vivaExplanation,
        timeComplexity: vivaTime,
        spaceComplexity: vivaSpace
      });
      setVivaResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingViva(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Adaptive DSA Practice & Root-Cause Diagnosis</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Flagship #1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time AST code heuristics and multi-pattern failure diagnosis beyond basic wrong-answer reporting.
          </p>
        </div>

        {selectedProblem && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVivaModal(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Interview Viva Defense
            </button>
            <button
              onClick={() => setCode(selectedProblem.solutionCode || selectedProblem.starterCode)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Load Reference Solution"
            >
              Load Sample Code
            </button>
          </div>
        )}
      </div>

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Bank List */}
        <div className="lg:col-span-3 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Curated DSA Bank</span>
            <span>{problems.length} Challenges</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {problems.map(prob => {
              const isSelected = selectedProblem && selectedProblem.id === prob.id;
              return (
                <div
                  key={prob.id}
                  onClick={() => selectProblem(prob)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500 shadow-md shadow-sky-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-white line-clamp-1">{prob.title}</h4>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      prob.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                      prob.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {prob.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>~{prob.estimatedMinutes}m</span>
                    <span>•</span>
                    <span className="text-slate-500 truncate">{prob.concepts.join(', ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right Column: IDE & Problem Description */}
        <div className="lg:col-span-9 space-y-4">
          {selectedProblem ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Problem Details Panel */}
              <div className="glass-panel rounded-2xl p-5 space-y-4 flex flex-col h-[700px] overflow-y-auto">
                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      activeTab === 'description' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('testcases')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold relative ${
                      activeTab === 'testcases' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Test Cases & Diagnosis
                    {executionResult && (
                      <span className={`ml-1.5 w-2 h-2 rounded-full inline-block ${
                        executionResult.diagnosis.isAccepted ? 'bg-emerald-400' : 'bg-rose-400'
                      }`} />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('hints')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      activeTab === 'hints' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Hints ({selectedProblem.hints?.length || 0})
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'description' && (
                  <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{selectedProblem.title}</h2>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                          Target: {selectedProblem.expectedTimeComplexity}
                        </span>
                      </div>
                      <p className="mt-2 text-slate-300">{selectedProblem.description}</p>
                    </div>

                    {/* Example Cases */}
                    <div className="space-y-2 pt-2">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Sample Inputs:</span>
                      {selectedProblem.testCases.slice(0, 2).map((tc, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px] space-y-1">
                          <div className="text-slate-400">Input: <span className="text-slate-200">{JSON.stringify(tc.input)}</span></div>
                          <div className="text-slate-400">Expected: <span className="text-emerald-400">{JSON.stringify(tc.expected)}</span></div>
                        </div>
                      ))}
                    </div>

                    {/* Target Concepts */}
                    <div className="space-y-1.5 pt-2">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Associated Concepts:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProblem.concepts.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800/80 text-sky-400 font-mono text-[11px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'testcases' && (
                  <div className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
                    {executionResult ? (
                      <div className="space-y-4">
                        {/* Adaptive Diagnostic Banner */}
                        <div className={`p-4 rounded-xl border ${
                          executionResult.diagnosis.isAccepted
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                        } space-y-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-sm">
                              {executionResult.diagnosis.isAccepted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                              )}
                              <span>{executionResult.diagnosis.feedback.headline}</span>
                            </div>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900/60">
                              Passed: {executionResult.diagnosis.passRate}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed">
                            {executionResult.diagnosis.feedback.explanation}
                          </p>

                          <div className="pt-2 border-t border-slate-800/60 text-[11px] text-sky-300 flex items-start gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{executionResult.diagnosis.feedback.tip}</span>
                          </div>
                        </div>

                        {/* Weakness & Complexity Badges */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] text-slate-400 font-medium">Diagnosed Weakness</div>
                            <div className="font-bold text-amber-400 capitalize mt-0.5">
                              {executionResult.diagnosis.primaryWeakness ? executionResult.diagnosis.primaryWeakness.replace(/_/g, ' ') : 'None (Optimized)'}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] text-slate-400 font-medium">Estimated Complexity</div>
                            <div className="font-mono font-bold text-sky-400 mt-0.5">
                              {executionResult.diagnosis.estimatedTimeComplexity} Time
                            </div>
                          </div>
                        </div>

                        {/* Detailed Test Run Case Breakdown */}
                        <div className="space-y-2">
                          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                            Test Case Verification Matrix:
                          </span>
                          {executionResult.testCaseResults.map((tc, idx) => (
                            <div 
                              key={idx}
                              className={`p-3 rounded-lg border font-mono text-[11px] space-y-1 ${
                                tc.passed ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-rose-950/10 border-rose-900/40 text-rose-200'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="flex items-center gap-1.5">
                                  {tc.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                                  Case #{tc.testCaseId} {tc.isEdgeCase && '(Edge Case)'} {tc.isScaleCase && '(Scale Case)'}
                                </span>
                                <span className="text-[10px] text-slate-400">{tc.executionTimeMs}ms</span>
                              </div>
                              <div className="text-slate-400">Input: <span className="text-slate-300">{JSON.stringify(tc.input)}</span></div>
                              <div className="text-slate-400">Expected: <span className="text-emerald-400">{JSON.stringify(tc.expected)}</span></div>
                              {!tc.passed && (
                                <div className="text-rose-400">Actual: <span>{JSON.stringify(tc.actual)}</span></div>
                              )}
                              {tc.error && (
                                <div className="text-rose-400">Error: <span>{tc.error}</span></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
                        <Play className="w-8 h-8 text-slate-600" />
                        <p>Write your code in the IDE and click "Run & Diagnose Code" to see algorithmic analysis.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'hints' && (
                  <div className="space-y-3 text-xs">
                    {(selectedProblem.hints || []).map((hint, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 space-y-1">
                        <span className="font-mono text-sky-400 font-bold text-[10px]">HINT {idx + 1}</span>
                        <p>{hint}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Code Editor Panel */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col h-[700px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-slate-400 ml-2">solution.js</span>
                  </div>

                  <button
                    onClick={() => setCode(selectedProblem.starterCode)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    title="Reset to starter template"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Editor Textarea */}
                <div className="flex-1 pt-3 pb-3 relative flex">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck="false"
                    className="w-full h-full bg-transparent font-mono text-xs text-slate-100 resize-none focus:outline-none leading-relaxed selection:bg-sky-500/30"
                    placeholder="// Write your solution here..."
                  />
                </div>

                {/* Run Button Bar */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    JavaScript Sandboxed VM
                  </span>

                  <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                    <span>{isRunning ? 'Analyzing Code...' : 'Run & Diagnose Code'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Select a problem to begin.
            </div>
          )}
        </div>
      </div>

      {/* AI Viva Modal */}
      {showVivaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-xl w-full rounded-2xl p-6 space-y-5 border border-slate-700 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Interview Viva & Complexity Defense</h3>
              </div>
              <button 
                onClick={() => setShowVivaModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              In technical interviews, writing working code is only 50% of the evaluation. You must defend your algorithmic complexity and structural decisions.
            </p>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Explain your algorithmic approach & invariant:</label>
                <textarea
                  value={vivaExplanation}
                  onChange={(e) => setVivaExplanation(e.target.value)}
                  placeholder="e.g. We utilize a two-pointer sliding window where the right pointer expands the window and the left pointer contracts whenever duplicate characters appear..."
                  className="w-full h-24 p-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-sans focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Time Complexity:</label>
                  <input
                    type="text"
                    value={vivaTime}
                    onChange={(e) => setVivaTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                    placeholder="O(N)"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Auxiliary Space:</label>
                  <input
                    type="text"
                    value={vivaSpace}
                    onChange={(e) => setVivaSpace(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                    placeholder="O(1) or O(N)"
                  />
                </div>
              </div>

              {vivaResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">Viva Score: {vivaResult.vivaScore}/100</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                      {vivaResult.rating}
                    </span>
                  </div>
                  <p className="text-slate-300">{vivaResult.explanationFeedback}</p>
                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                    <div>• Time: {vivaResult.timeEvaluation.feedback}</div>
                    <div>• Space: {vivaResult.spaceEvaluation.feedback}</div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={handleVivaSubmit}
                  disabled={isSubmittingViva}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
                >
                  {isSubmittingViva ? 'Evaluating Viva...' : 'Submit Defense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
