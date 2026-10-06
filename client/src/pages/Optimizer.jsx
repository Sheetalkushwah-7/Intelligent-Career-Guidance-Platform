import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Table, 
  SlidersHorizontal,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../api';
import { useStudent } from '../context/StudentContext';

export function Optimizer() {
  const { student } = useStudent();
  const [budgetHours, setBudgetHours] = useState(30);
  const [targetCareerId, setTargetCareerId] = useState(student ? student.targetCareerId : 'data_scientist');
  const [allCareers, setAllCareers] = useState([]);
  const [planResult, setPlanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDPTable, setShowDPTable] = useState(false);

  useEffect(() => {
    loadCareers();
    runOptimization(30);
  }, []);

  const loadCareers = async () => {
    try {
      const res = await api.getAllCareers();
      setAllCareers(res.careers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const runOptimization = async (hours = budgetHours) => {
    try {
      setLoading(true);
      const res = await api.optimizePlan(hours, targetCareerId);
      setPlanResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const opt = planResult?.optimizationResult;

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Time-Budget Knapsack Optimizer</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Flagship #3 • 0/1 Knapsack DP
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Maximizes marginal skill improvement points within a strictly constrained hour budget using bottom-up Dynamic Programming.
          </p>
        </div>

        {/* Target Objective Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 hidden sm:block">Target Career:</label>
          <select
            value={targetCareerId}
            onChange={(e) => {
              setTargetCareerId(e.target.value);
              runOptimization(budgetHours);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
          >
            {allCareers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </div>

      {/* Budget Input & Controller Card */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              Specify Your Available Time Budget (Hours):
            </label>
            <p className="text-xs text-slate-400">
              The DP engine evaluates candidate tasks (task hours as weight, skill impact as value) to find the global optimum: maximize total impact within available budget W.
            </p>

            {/* Quick Budget Preset Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[15, 20, 25, 30, 40, 50].map(h => (
                <button
                  key={h}
                  onClick={() => {
                    setBudgetHours(h);
                    runOptimization(h);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    budgetHours === h 
                      ? 'bg-rose-600 text-white shadow-sm' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {h} Hours
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Custom Hours</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="number"
                  min="2"
                  max="120"
                  value={budgetHours}
                  onChange={(e) => setBudgetHours(Number(e.target.value))}
                  className="w-20 p-2 text-center rounded-xl bg-slate-900 border border-slate-700 font-mono text-base font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                />
                <span className="text-xs text-slate-400">hrs</span>
              </div>
            </div>

            <button
              onClick={() => runOptimization(budgetHours)}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all"
            >
              {loading ? 'Solving DP...' : 'Run DP Solver'}
            </button>
          </div>
        </div>
      </div>

      {opt && (
        <div className="space-y-8">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl glass-panel space-y-1">
              <span className="text-xs text-slate-400 font-medium">Time Utilized</span>
              <div className="text-2xl font-black text-white">
                {opt.totalTime} <span className="text-sm text-slate-400 font-normal">/ {budgetHours} hrs</span>
              </div>
              <p className="text-[11px] text-slate-500">Unused Budget: {opt.remainingTime}h</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel space-y-1">
              <span className="text-xs text-slate-400 font-medium">Optimal Skill Impact</span>
              <div className="text-2xl font-black text-rose-400">
                +{opt.totalImpact} <span className="text-sm font-normal text-rose-300">pts</span>
              </div>
              <p className="text-[11px] text-slate-500">Global DP Maximum</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel space-y-1">
              <span className="text-xs text-slate-400 font-medium">Skill Impact Per Hour</span>
              <div className="text-2xl font-black text-emerald-400">
                {opt.efficiencyRatio} <span className="text-sm font-normal text-emerald-300">pts/hr</span>
              </div>
              <p className="text-[11px] text-slate-500">Resource Efficiency Index</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel space-y-1">
              <span className="text-xs text-slate-400 font-medium">Selected Actions</span>
              <div className="text-2xl font-black text-sky-400">
                {opt.selectedTasks.length} <span className="text-sm font-normal text-sky-300">tasks</span>
              </div>
              <p className="text-[11px] text-slate-500">Backtracked from DP Table</p>
            </div>
          </div>

          {/* Detailed Selected Tasks Table with Justifications */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Optimal Tasks Selected by Dynamic Programming
              </h2>

              <button
                onClick={() => setShowDPTable(!showDPTable)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
              >
                <Table className="w-3.5 h-3.5 text-rose-400" />
                {showDPTable ? 'Hide DP Matrix' : 'Inspect DP Matrix Sample'}
              </button>
            </div>

            <div className="space-y-3">
              {opt.taskExplanations.map((task, idx) => (
                <div key={task.taskId} className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-rose-400">#{idx + 1}</span>
                      <h3 className="text-sm font-bold text-white">{task.title}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {task.skillName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-slate-400">Time: <span className="text-white font-bold">{task.timeRequired}</span></span>
                      <span className="text-slate-400">Impact: <span className="text-emerald-400 font-bold">{task.expectedImpact}</span></span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                        {task.efficiencyRatio}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {task.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sample DP Table Visualization */}
          {showDPTable && opt.dpTableSample && (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-rose-400" />
                  Dynamic Programming Table Sample: $DP[i][w]$
                </h3>
                <p className="text-xs text-slate-400">
                  Rows represent subproblem items; columns represent sub-capacities (hours 0 to W).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2">Item i</th>
                      {opt.dpTableSample[0]?.values.map((_, col) => (
                        <th key={col} className="p-2 text-center text-slate-500">{col}h</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {opt.dpTableSample.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-900 hover:bg-slate-900/40">
                        <td className="p-2 text-slate-300 font-sans font-medium">{row.task}</td>
                        {row.values.map((val, cIdx) => (
                          <td key={cIdx} className={`p-2 text-center ${val > 0 ? 'text-rose-400 font-bold' : 'text-slate-600'}`}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alternative Plan Simulation (+/- delta hours) */}
          {planResult.alternativeScenarios && planResult.alternativeScenarios.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  Alternative Budget Sensitivity Simulation
                </h3>
                <p className="text-xs text-slate-400">
                  Simulate marginal returns if you allocate slightly more or less time to preparation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {planResult.alternativeScenarios.map((scen, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {scen.deltaHours} ({scen.budgetHours}h)
                      </span>
                      <span className="text-xs font-bold text-rose-400 font-mono">
                        +{scen.totalImpact} pts
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Unlocks {scen.taskCount} tasks in optimal subset.
                    </div>

                    <div className="text-[11px] text-slate-500 line-clamp-2">
                      {scen.tasks.slice(0, 2).join(', ')}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
