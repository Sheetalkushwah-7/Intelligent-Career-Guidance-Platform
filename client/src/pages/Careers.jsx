import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  BarChart2,
  RefreshCw,
  Cpu,
  Info,
  Sliders,
  Sparkles,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../api';
import { useStudent } from '../context/StudentContext';

export function Careers() {
  const { setActiveTab } = useStudent();
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCareerId, setSelectedCareerId] = useState(null);
  const [selectedCareerData, setSelectedCareerData] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [testProfiles, setTestProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [formulaDoc, setFormulaDoc] = useState(null);
  const [studentSkills, setStudentSkills] = useState({});
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  
  // Comparison state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestProfiles();
    loadRecommendations();
  }, []);

  useEffect(() => {
    if (selectedProfileId !== undefined) {
      loadRecommendations(selectedProfileId);
    }
  }, [selectedProfileId]);

  const loadTestProfiles = async () => {
    try {
      const res = await api.getTestProfiles();
      if (res.success) {
        setTestProfiles(res.profiles || []);
      }
    } catch (err) {
      console.error("Failed to load test profiles:", err);
    }
  };

  const loadRecommendations = async (profileId = selectedProfileId) => {
    try {
      setLoading(true);
      const res = await api.getRecommendedCareers(10, profileId);
      if (res.success) {
        setRecommendations(res.recommendations || []);
        setFormulaDoc(res.formula || null);
        setStudentSkills(res.studentSkills || {});

        const recs = res.recommendations || [];
        if (recs.length > 0) {
          const firstCareerId = recs[0].career.id;
          setSelectedCareerId(firstCareerId);
          setSelectedCareerData(recs[0]);
          loadGapAnalysis(firstCareerId, profileId);
        }
      }
    } catch (err) {
      console.error("Error loading recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadGapAnalysis = async (careerId, profileId = selectedProfileId) => {
    try {
      const res = await api.getCareerGap(careerId, profileId);
      if (res.success) {
        setGapAnalysis(res);
      }
    } catch (err) {
      console.error("Error loading gap analysis:", err);
    }
  };

  const handleSelectCareer = (recItem) => {
    setSelectedCareerId(recItem.career.id);
    setSelectedCareerData(recItem);
    loadGapAnalysis(recItem.career.id, selectedProfileId);
  };

  const toggleCompare = (careerId) => {
    let next;
    if (compareList.includes(careerId)) {
      next = compareList.filter(id => id !== careerId);
    } else {
      if (compareList.length >= 3) return; // limit to 3
      next = [...compareList, careerId];
    }
    setCompareList(next);
  };

  const runComparison = async () => {
    if (compareList.length < 2) return;
    try {
      setLoading(true);
      const res = await api.compareCareers(compareList, selectedProfileId);
      if (res.success) {
        setComparisonResults(res.comparisons || []);
        setComparisonMode(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    if (score >= 40) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header & DSA Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-sky-400" />
              Career Recommendation Engine
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Max-Heap O(N log K)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              HashMap O(1) Lookup
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              QuickSort Ranking
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Deterministic, explainable career compatibility scoring computed directly from student skill profiles.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Profile Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Profile:</span>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-2"
            >
              <option value="" className="bg-slate-900 text-white">Active Student Profile</option>
              {testProfiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 transition-all"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            Formula Info
          </button>

          {compareList.length >= 2 && !comparisonMode && (
            <button
              onClick={runComparison}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Compare ({compareList.length}) Roles
            </button>
          )}

          {comparisonMode && (
            <button
              onClick={() => setComparisonMode(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Back to Rankings
            </button>
          )}

          <button
            onClick={() => loadRecommendations(selectedProfileId)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            title="Recalculate Recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsible Formula Documentation Banner */}
      {showFormulaModal && formulaDoc && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/30 text-xs space-y-3 relative animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              Scoring Formula & DSA Architecture
            </h3>
            <button 
              onClick={() => setShowFormulaModal(false)}
              className="text-slate-400 hover:text-white font-mono text-xs px-2 py-0.5 rounded bg-slate-800"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="space-y-2">
              <p className="font-semibold text-white">Transparent Compatibility Formula:</p>
              <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-sky-300 border border-slate-800">
                {formulaDoc.formula}
              </div>
              <p className="text-[11px] text-slate-400">
                • <strong>Required Skills (80% Weight)</strong>: Core technical prerequisites.<br />
                • <strong>Preferred Skills (20% Weight)</strong>: Bonus domain competencies.<br />
                • Skill fulfillment ratio is capped at 1.0 per skill: <code className="text-amber-300">min(1.0, StudentSkill / RequiredTarget)</code>
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-white">DSA Pipeline Architecture:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li><strong className="text-emerald-400">HashMap</strong>: O(1) constant time skill level lookups per role requirement.</li>
                <li><strong className="text-sky-400">ArrayList</strong>: Contiguous required and preferred skill collections.</li>
                <li><strong className="text-indigo-400">Max Heap / PriorityQueue</strong>: Extracting Top-K ranked career options & ranking top skill gaps.</li>
                <li><strong className="text-amber-400">QuickSort</strong>: Deterministic multi-key sorting of matching & missing skill arrays.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {comparisonMode ? (
        /* Side-by-Side Career Comparison Mode */
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            Side-by-Side Career Compatibility Comparison
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comparisonResults.map(career => (
              <div key={career.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {career.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{career.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-2xl font-black text-sky-400">{career.compatibilityScore}%</div>
                    <span className="text-xs text-slate-400">Compatibility</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Market Demand</span>
                    <span className="font-semibold text-emerald-400">{career.marketDemand}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Salary Range</span>
                    <span className="font-semibold text-slate-200">{career.medianSalary}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Matching / Missing</span>
                    <span className="font-semibold text-sky-400">{career.matchingCount} match / {career.missingCount} gaps</span>
                  </div>
                </div>

                {/* Explanation Snippet */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 italic">
                  "{career.explanation}"
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Required Skills</div>
                  {career.skillsSummary.map((s, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>{s.name}</span>
                        <span className={s.current >= s.required ? 'text-emerald-400 font-bold' : 'text-amber-400 font-mono'}>
                          {s.current}% / {s.required}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${s.current >= s.required ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, (s.current / s.required) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setComparisonMode(false);
                    const match = recommendations.find(r => r.career.id === career.id);
                    if (match) handleSelectCareer(match);
                  }}
                  className="w-full py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-semibold transition-all"
                >
                  View Deep Analysis
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Main Recommendation Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ranked Career Recommendations (Max Heap Priority Queue Order) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-semibold text-slate-400 flex items-center justify-between px-1">
              <span className="uppercase tracking-wider">Ranked Recommendations (Max-Heap)</span>
              <span className="text-[10px] text-slate-500">Compare (Max 3)</span>
            </div>

            <div className="space-y-3">
              {recommendations.map((item, idx) => {
                const career = item.career;
                const isSelected = selectedCareerId === career.id;
                const isChecked = compareList.includes(career.id);
                const scoreColor = getScoreBadgeColor(item.compatibilityScore);

                return (
                  <div
                    key={career.id}
                    onClick={() => handleSelectCareer(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            #{idx + 1}
                          </span>
                          <h3 className="text-base font-bold text-white leading-tight">{career.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{career.category}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Compatibility Badge */}
                        <div className={`px-2.5 py-1 rounded-xl text-center border font-black text-sm ${scoreColor}`}>
                          {item.compatibilityScore}%
                        </div>

                        {/* Compare Checkbox */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleCompare(career.id);
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 cursor-pointer"
                          title="Select for comparison"
                        />
                      </div>
                    </div>

                    {/* Progress score bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full rounded-full ${
                          item.compatibilityScore >= 80 ? 'bg-emerald-500' :
                          item.compatibilityScore >= 60 ? 'bg-sky-500' :
                          item.compatibilityScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.compatibilityScore}%` }}
                      />
                    </div>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {career.marketDemand}% Market Demand
                      </span>
                      <span className="text-slate-300 font-medium">
                        {item.matchingSkills?.length || 0} matching • {item.missingSkills?.length || 0} gaps
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Career Inspector & Explanation */}
          <div className="lg:col-span-7">
            {selectedCareerData && gapAnalysis ? (
              <div className="glass-panel rounded-2xl p-6 space-y-6">
                {/* Career Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                        {selectedCareerData.career.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {selectedCareerData.career.medianSalary}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{selectedCareerData.career.title}</h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                      {selectedCareerData.career.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('learning')}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all self-start sm:self-auto"
                  >
                    <span>Generate Learning Path</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Score Visualization Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Overall Fit</span>
                    <div className="text-2xl font-black text-sky-400">{selectedCareerData.compatibilityScore}%</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${selectedCareerData.compatibilityScore}%` }} />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Required Skills (80%)</span>
                    <div className="text-2xl font-black text-emerald-400">{selectedCareerData.scoringBreakdown?.requiredScore}%</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedCareerData.scoringBreakdown?.requiredScore}%` }} />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Preferred Skills (20%)</span>
                    <div className="text-2xl font-black text-indigo-400">{selectedCareerData.scoringBreakdown?.preferredScore}%</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedCareerData.scoringBreakdown?.preferredScore}%` }} />
                    </div>
                  </div>
                </div>

                {/* Explainability Section */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 border border-sky-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <Award className="w-4 h-4" />
                    <span>Deterministic Explanation (Why Recommended)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedCareerData.explanation}
                  </p>
                </div>

                {/* Strongest Matching Skills (Max Heap Ranked) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Strongest Matching Skills (Max-Heap Order)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Ranked by Proficiency × Weight</span>
                  </h3>

                  {selectedCareerData.strongestMatchingSkills.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No matching skills recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedCareerData.strongestMatchingSkills.map(skill => (
                        <div key={skill.skillId} className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{skill.skillName}</span>
                            <span className="text-emerald-400 font-mono font-semibold">{skill.currentProficiency}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, skill.currentProficiency)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Largest Skill Gaps (Max Heap Ranked) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Largest Skill Gaps (Max-Heap Order)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Ranked by Gap × Weight</span>
                  </h3>

                  {selectedCareerData.largestSkillGaps.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      All required skill thresholds meet or exceed target expectations for this role!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCareerData.largestSkillGaps.map(gap => (
                        <div key={gap.skillId} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{gap.skillName}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-400">Current: {gap.currentProficiency}%</span>
                              <span className="text-slate-600">→</span>
                              <span className="text-sky-400 font-bold">Target: {gap.targetProficiency}%</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                                Δ -{gap.gap}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-sky-500 rounded-full"
                              style={{ width: `${Math.min(100, (gap.currentProficiency / gap.targetProficiency) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prerequisites & Relevant Concepts Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                  {selectedCareerData.career.prerequisiteSkills?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Prerequisite Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCareerData.career.prerequisiteSkills.map((p, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCareerData.career.relevantConcepts?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Relevant Core Concepts
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCareerData.career.relevantConcepts.map((c, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommended Learning Areas */}
                {selectedCareerData.career.recommendedLearningAreas?.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      Recommended Learning Areas
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedCareerData.career.recommendedLearningAreas.map((area, idx) => (
                        <span key={idx} className="text-xs px-3 py-1 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 glass-panel rounded-2xl">
                Select a career to view detailed compatibility breakdown.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
