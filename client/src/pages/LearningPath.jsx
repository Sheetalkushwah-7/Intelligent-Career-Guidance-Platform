import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  CheckCircle2, 
  ExternalLink, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Filter,
  Sparkles,
  Clock
} from 'lucide-react';
import { api } from '../api';
import { useStudent } from '../context/StudentContext';

export function LearningPath() {
  const { student } = useStudent();
  const [careerId, setCareerId] = useState(student ? student.targetCareerId : 'data_scientist');
  const [allCareers, setAllCareers] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCareers();
  }, []);

  useEffect(() => {
    if (careerId) {
      loadPath(careerId);
    }
  }, [careerId]);

  const loadCareers = async () => {
    try {
      const res = await api.getAllCareers();
      setAllCareers(res.careers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPath = async (targetId) => {
    try {
      setLoading(true);
      const res = await api.getLearningPath(targetId);
      setPathData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Topological Learning Roadmap</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Kahn's DAG Topo Sort
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prerequisites are topologically ordered so fundamentals precede dependent abstractions.
          </p>
        </div>

        {/* Role Selector & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={careerId}
            onChange={(e) => setCareerId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
          >
            {allCareers.map(c => (
              <option key={c.id} value={c.id}>Role: {c.title}</option>
            ))}
          </select>

          <button
            onClick={() => setFreeOnly(!freeOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              freeOnly 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {freeOnly ? 'Free Resources Only' : 'All Resources'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          Running Topological Sort on Prerequisite Graph...
        </div>
      ) : pathData ? (
        <div className="space-y-8">
          {/* Summary Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 to-slate-900 border border-sky-900/40 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">Target Objective</span>
              <h2 className="text-lg font-bold text-white">{pathData.careerTitle}</h2>
              <p className="text-xs text-slate-400">
                Sorted into {pathData.totalStages} sequential mastery stages without circular dependency deadlocks.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-400">Stages:</span>
                <span className="font-bold text-white">{pathData.totalStages}</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Estimated Effort:</span>
                <span className="font-bold text-white">~{pathData.estimatedTotalHours} hours</span>
              </div>
            </div>
          </div>

          {/* Stage by Stage Sequential View */}
          <div className="space-y-6">
            {pathData.roadmap.length === 0 ? (
              <div className="p-8 text-center rounded-2xl glass-panel space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">All Prerequisites Satisfied</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You have already mastered all prerequisite competencies required for {pathData.careerTitle}!
                </p>
              </div>
            ) : (
              pathData.roadmap.map((step, idx) => {
                const filteredResources = freeOnly 
                  ? (step.resources || []).filter(r => r.isFree)
                  : (step.resources || []);

                return (
                  <div key={step.stepId} className="glass-panel rounded-2xl p-6 relative overflow-hidden space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono font-bold text-sky-400 text-xs">
                          S{step.stage}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">{step.skillName}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {step.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Stage {step.stage} Milestone • Prerequisite Priority #{idx + 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <div className="text-right">
                          <div className="text-slate-400">Current: <span className="text-white font-bold">{step.currentProficiency}%</span></div>
                          <div className="text-sky-400">Target: <span className="font-bold">{step.targetProficiency}%</span></div>
                        </div>
                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-bold">
                          Δ -{step.gap}%
                        </span>
                      </div>
                    </div>

                    {/* Key Concepts */}
                    {step.concepts && step.concepts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sub-Concepts to Master:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {step.concepts.map((c, cIdx) => (
                            <span key={cIdx} className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Resources */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                        Curated Learning Resources ({filteredResources.length}):
                      </span>

                      {filteredResources.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No matching resources found for the active filter.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredResources.map(res => (
                            <a
                              key={res.id}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition-colors flex items-start justify-between gap-2 group"
                            >
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors flex items-center gap-1">
                                  {res.title}
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-2">{res.description}</p>
                                <div className="flex items-center gap-2 pt-1 text-[10px]">
                                  <span className="text-slate-500">{res.provider}</span>
                                  {res.isFree && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                                      FREE
                                    </span>
                                  )}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
