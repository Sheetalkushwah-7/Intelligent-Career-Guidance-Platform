import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  RotateCw, 
  TrendingUp, 
  Unlock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Layers,
  HelpCircle,
  Shuffle
} from 'lucide-react';
import { api } from '../api';
import { useStudent } from '../context/StudentContext';

export function Simulator() {
  const { student } = useStudent();
  const [allCareers, setAllCareers] = useState([]);
  const [targetCareerId, setTargetCareerId] = useState(student ? student.targetCareerId : 'data_analyst');
  const [skillProficiencies, setSkillProficiencies] = useState({});
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('whatif'); // 'whatif' or 'pivot'

  // Career Pivot state
  const [fromCareer, setFromCareer] = useState('data_analyst');
  const [toCareer, setToCareer] = useState('data_scientist');
  const [pivotResult, setPivotResult] = useState(null);

  useEffect(() => {
    loadCareers();
    if (student) {
      setSkillProficiencies({ ...student.skills });
      setTargetCareerId(student.targetCareerId || 'data_analyst');
    }
  }, [student]);

  useEffect(() => {
    if (targetCareerId && Object.keys(skillProficiencies).length > 0) {
      triggerSimulation();
    }
  }, [targetCareerId]);

  const loadCareers = async () => {
    try {
      const res = await api.getAllCareers();
      setAllCareers(res.careers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSliderChange = (skillId, val) => {
    setSkillProficiencies(prev => ({
      ...prev,
      [skillId]: Number(val)
    }));
  };

  const triggerSimulation = async () => {
    try {
      setLoading(true);
      const deltas = Object.entries(skillProficiencies).map(([skillId, newProficiency]) => ({
        skillId,
        newProficiency
      }));

      const res = await api.runWhatIf(targetCareerId, deltas);
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    try {
      const res = await api.undoSimulation();
      if (res.state) {
        triggerSimulation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRedo = async () => {
    try {
      const res = await api.redoSimulation();
      if (res.state) {
        triggerSimulation();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePreset = (skillId, targetVal) => {
    setSkillProficiencies(prev => ({
      ...prev,
      [skillId]: targetVal
    }));
    setTimeout(() => triggerSimulation(), 50);
  };

  const handlePivot = async () => {
    try {
      const res = await api.pivotCareer(fromCareer, toCareer);
      setPivotResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const activeCareer = allCareers.find(c => c.id === targetCareerId);

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Career Readiness What-If Simulator</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Flagship #2 • Stack LIFO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate hypothetical skill improvements, observe dynamic readiness score deltas, and detect newly unlocked career options.
          </p>
        </div>

        {/* Tab switcher: What-If vs Pivot */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('whatif')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'whatif' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            What-If Simulator
          </button>
          <button
            onClick={() => setActiveSubTab('pivot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'pivot' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Career Pivot
          </button>
        </div>
      </div>

      {activeSubTab === 'whatif' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Target Career & Skill Sliders */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Target Simulated Career:
                </label>
                {/* Undo / Redo Stack Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleUndo}
                    disabled={!simulationResult?.canUndo}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                    title="Undo Simulation Step (Stack Pop)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!simulationResult?.canRedo}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
                    title="Redo Simulation Step"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <select
                value={targetCareerId}
                onChange={(e) => setTargetCareerId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
              >
                {allCareers.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.category})</option>
                ))}
              </select>

              {/* Canonical Preset Quick Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePreset('sql', 80)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 text-xs"
                  >
                    SQL: 40% → 80%
                  </button>
                  <button
                    onClick={() => handlePreset('trees_graphs', 80)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 text-xs"
                  >
                    Trees & Graphs → 80%
                  </button>
                  <button
                    onClick={() => handlePreset('statistics_prob', 85)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 text-xs"
                  >
                    Statistics → 85%
                  </button>
                </div>
              </div>

              {/* Sliders for Relevant Required Skills */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Adjust Hypothetical Proficiencies:
                </span>

                {activeCareer?.requiredSkills?.map(req => {
                  const currVal = skillProficiencies[req.skillId] ?? 50;
                  const originalVal = student?.skills?.[req.skillId] ?? 50;
                  const delta = currVal - originalVal;

                  return (
                    <div key={req.skillId} className="space-y-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{req.skillName}</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">Orig: {originalVal}%</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-purple-400 font-bold">{currVal}%</span>
                          {delta !== 0 && (
                            <span className={`text-[10px] font-bold ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ({delta > 0 ? `+${delta}` : delta}%)
                            </span>
                          )}
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currVal}
                        onChange={(e) => handleSliderChange(req.skillId, e.target.value)}
                        onMouseUp={triggerSimulation}
                        onTouchEnd={triggerSimulation}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />

                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Min Threshold: {req.minProficiency}%</span>
                        <span>Weight: {req.weight}x</span>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={triggerSimulation}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all"
                >
                  {loading ? 'Recalculating...' : 'Recalculate Readiness Projection'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Projected Impact, Gaps Reduced, Unlocks */}
          <div className="lg:col-span-7 space-y-6">
            {simulationResult ? (
              <div className="space-y-6">
                {/* Score Comparison Display */}
                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-xs text-slate-400 font-medium">Current Readiness</span>
                      <div className="text-3xl font-black text-slate-200 mt-1">
                        {simulationResult.baselineScore}%
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                      <span className="text-xs text-purple-300 font-medium">Projected Readiness</span>
                      <div className="text-3xl font-black text-purple-400 mt-1">
                        {simulationResult.projectedScore}%
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                      <span className="text-xs text-emerald-300 font-medium">Net Delta Gain</span>
                      <div className="text-3xl font-black text-emerald-400 mt-1">
                        {simulationResult.scoreGain}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Next Action */}
                  <div className="mt-5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">Optimal Next Action: </span>
                      <span className="text-slate-300">{simulationResult.recommendedNextAction}</span>
                    </div>
                  </div>
                </div>

                {/* Gaps Reduced / Closed */}
                <div className="glass-panel rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Career Gaps Reduced / Resolved</span>
                    <span className="text-[10px] text-slate-400">
                      {simulationResult.remainingGapsCount} remaining gaps
                    </span>
                  </h3>

                  {simulationResult.gapsReduced.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No gap reductions observed with the current settings.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {simulationResult.gapsReduced.map(gap => (
                        <div key={gap.skillId} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {gap.isFullyClosed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-sky-400" />
                            )}
                            <div>
                              <span className="font-bold text-white">{gap.skillName}</span>
                              <span className="text-slate-400 ml-2">
                                (Gap dropped from {gap.previousGap}% to {gap.remainingGap}%)
                              </span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            gap.isFullyClosed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-300'
                          }`}>
                            {gap.isFullyClosed ? 'GAP FULLY RESOLVED' : `-${gap.reduction}% Reduced`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Career Unlock System */}
                {simulationResult.newlyUnlockedCareers.length > 0 && (
                  <div className="glass-panel rounded-2xl p-6 border-emerald-500/30 bg-emerald-950/10 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Unlock className="w-4 h-4" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">
                        Newly Unlocked Career Opportunities! (Eligibility ≥ 75%)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {simulationResult.newlyUnlockedCareers.map(car => (
                        <div key={car.careerId} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                          <h4 className="text-xs font-bold text-white">{car.title}</h4>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Old: {car.baselineScore}%</span>
                            <span className="text-emerald-400 font-bold font-mono">
                              Now: {car.projectedScore}% (+{car.gain}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Career Pivot Simulator View */
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Career Pivot Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Simulate transitioning between roles. Analyze transferable skills, assess readiness gaps, and determine pivot feasibility.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">From Current Role:</label>
              <select
                value={fromCareer}
                onChange={(e) => setFromCareer(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                {allCareers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Pivot Role:</label>
              <select
                value={toCareer}
                onChange={(e) => setToCareer(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              >
                {allCareers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handlePivot}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Analyze Career Pivot Feasibility
          </button>

          {pivotResult && (
            <div className="space-y-5 pt-5 border-t border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">Current Readiness</span>
                  <div className="text-2xl font-black text-white mt-1">{pivotResult.currentCareer.readiness}%</div>
                </div>
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-center">
                  <span className="text-xs text-purple-300">Target Pivot Readiness</span>
                  <div className="text-2xl font-black text-purple-400 mt-1">{pivotResult.pivotCareer.readiness}%</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400">Pivot Feasibility</span>
                  <div className={`text-2xl font-black mt-1 ${
                    pivotResult.feasibility === 'HIGH' ? 'text-emerald-400' :
                    pivotResult.feasibility === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {pivotResult.feasibility}
                  </div>
                </div>
              </div>

              {/* Transferable Skills */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transferable Skills ({pivotResult.transferableSkillsCount}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pivotResult.transferableSkills.map(s => (
                    <div key={s.skillId} className="p-2.5 rounded-lg bg-emerald-950/10 border border-emerald-900/30 flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-semibold">{s.skillName}</span>
                      <span className="text-emerald-400 font-mono">{s.proficiency}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
