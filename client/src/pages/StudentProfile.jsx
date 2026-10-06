/**
 * StudentProfile.jsx
 *
 * Phase 2: Student Profile & Skill Assessment
 *
 * DATA STRUCTURES (client-side mirrors of server logic):
 * ─────────────────────────────────────────────────────────────────
 * skillById    : Map<skillId, Skill>         O(1) name/category lookup per question
 * questionsBySkill : Map<skillId, Question[]>  O(1) grouping for the assessment form
 * answeredSkills   : Set<skillId>              O(1) progress tracking
 *
 * The Maps are built once via useMemo and shared across all child renders.
 * This avoids repeated O(n) Array.find() calls during answer selection.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  GraduationCap,
  Save,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User2,
  Zap,
} from 'lucide-react';
import { api } from '../api';
import { useStudent } from '../context/StudentContext';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';

// ─── Constants ────────────────────────────────────────────────────────────────

const BANDS = [
  {
    key: 'strong',
    label: 'Strong Skills',
    sublabel: 'Score ≥ 70',
    Icon: TrendingUp,
    colorClass: 'emerald',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    gradientFrom: 'from-emerald-500/20',
  },
  {
    key: 'average',
    label: 'Average Skills',
    sublabel: 'Score 40–69',
    Icon: Zap,
    colorClass: 'amber',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    gradientFrom: 'from-amber-500/20',
  },
  {
    key: 'weak',
    label: 'Weak Skills',
    sublabel: 'Score < 40',
    Icon: TrendingDown,
    colorClass: 'rose',
    barColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    gradientFrom: 'from-rose-500/20',
  },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated radial progress ring */
function ScoreRing({ score, size = 88, stroke = 8, colorClass = 'sky' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor = {
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    sky: '#0ea5e9',
  }[colorClass] ?? '#0ea5e9';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#1e293b" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={strokeColor} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  );
}

/** Horizontal skill bar with animated fill */
function SkillBar({ name, score, category, band }) {
  const b = BANDS.find((b) => b.key === band) ?? BANDS[1];
  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-slate-200 font-medium truncate">{name}</span>
          <span className="text-slate-600 hidden sm:inline shrink-0">· {category}</span>
        </div>
        <span className={`font-mono font-bold shrink-0 ml-2 ${b.textColor}`}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className={`h-full rounded-full ${b.barColor} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/** Band card showing strong/average/weak classification */
function BandCard({ band, skills }) {
  const { label, sublabel, Icon, textColor, borderColor, bgColor } = band;
  const isEmpty = !skills?.length;

  return (
    <div className={`glass-panel rounded-2xl p-5 space-y-4 border ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${bgColor}`}>
            <Icon className={`w-4 h-4 ${textColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{label}</h3>
            <p className={`text-[10px] ${textColor} font-mono`}>{sublabel}</p>
          </div>
        </div>
        <span className={`text-xl font-black ${textColor}`}>{skills?.length ?? 0}</span>
      </div>

      {isEmpty ? (
        <p className="text-xs text-slate-500 italic">No skills in this range yet.</p>
      ) : (
        <div className="space-y-2.5">
          {skills.map((s) => (
            <div key={s.skillId} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <CircleCheck className={`w-3 h-3 shrink-0 ${textColor}`} />
                <span className="text-xs text-slate-200 truncate">{s.name}</span>
              </div>
              <span className={`text-xs font-mono font-bold shrink-0 ${textColor}`}>{s.score}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Collapsible skill-group fieldset in the assessment form */
function SkillGroup({ skillId, skillName, questions, answers, onAnswer, isComplete }) {
  const [open, setOpen] = useState(true);
  const answeredCount = questions.filter((q) => Object.hasOwn(answers, q.id)).length;

  return (
    <div className={`glass-panel rounded-xl overflow-hidden border transition-colors duration-200
      ${isComplete ? 'border-emerald-500/30' : 'border-slate-800'}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isComplete ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-sm font-bold text-white">{skillName}</span>
          <span className="text-xs text-slate-500">{answeredCount}/{questions.length} answered</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {/* Questions */}
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-800/60">
          {questions.map((q, idx) => (
            <div key={q.id} className="pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-slate-500 mt-1 shrink-0 w-4">{idx + 1}.</span>
                <div className="space-y-1">
                  <span className={`text-[10px] font-mono uppercase tracking-wider
                    ${q.difficulty === 'beginner' ? 'text-emerald-500' :
                      q.difficulty === 'intermediate' ? 'text-amber-500' : 'text-rose-500'}`}>
                    {q.difficulty}
                  </span>
                  <p className="text-sm text-slate-100 leading-relaxed">{q.prompt}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs cursor-pointer
                        transition-all duration-150 select-none
                        ${selected
                          ? 'border-sky-500 bg-sky-500/10 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                          : 'border-slate-700/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800/40'
                        }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={selected}
                        onChange={() => onAnswer(q.id, opt.value)}
                        className="sr-only"
                      />
                      <div className={`w-3.5 h-3.5 rounded-full border shrink-0 transition-all
                        ${selected ? 'border-sky-400 bg-sky-400' : 'border-slate-600'}`}>
                        {selected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950 mx-auto mt-[2px]" />}
                      </div>
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Toast/banner notification */
function Banner({ type, message, onDismiss }) {
  if (!message) return null;
  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error:   'border-rose-500/30 bg-rose-500/10 text-rose-300',
    info:    'border-sky-500/30 bg-sky-500/10 text-sky-300',
  };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[type] ?? styles.info}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100 text-lg leading-none ml-1">×</button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudentProfile() {
  const { student, allSkills, allCareers, updateProfile, updateSkills } = useStudent();

  // Assessment state
  const [questions, setQuestions] = useState([]);
  const [questionStats, setQuestionStats] = useState(null);
  const [skillProfile, setSkillProfile] = useState(null);
  const [answers, setAnswers] = useState({});

  // Profile form state
  const [form, setForm] = useState({ name: '', degree: '', semester: '', targetCareerId: '' });

  // UI state
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null); // last score result

  // ── HashMap: skillId → Skill (O(1) lookup) ─────────────────────────────────
  const skillById = useMemo(
    () => new Map(allSkills.map((s) => [s.id, s])),
    [allSkills]
  );

  // ── HashMap: skillId → Question[] (O(1) grouping) ──────────────────────────
  const questionsBySkill = useMemo(() => {
    const grouped = new Map();
    for (const q of questions) {
      const group = grouped.get(q.skillId) ?? [];
      group.push(q);
      grouped.set(q.skillId, group);
    }
    return grouped;
  }, [questions]);

  // Set of skillIds with all questions answered (O(1) per check)
  const completedSkills = useMemo(() => {
    const done = new Set();
    for (const [skillId, qs] of questionsBySkill) {
      if (qs.every((q) => Object.hasOwn(answers, q.id))) done.add(skillId);
    }
    return done;
  }, [answers, questionsBySkill]);

  const totalQuestions = questions.length;
  const answeredCount  = Object.keys(answers).length;
  const progressPct    = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // ── Load assessment questions & current state ───────────────────────────────
  const loadAssessment = useCallback(async () => {
    try {
      setLoadingAssessment(true);
      setError(null);
      const [questionsRes, stateRes] = await Promise.all([
        api.getAssessmentQuestions(),
        api.getAssessmentState(),
      ]);
      setQuestions(questionsRes.questions ?? []);
      setQuestionStats(questionsRes.stats ?? null);
      setSkillProfile(stateRes.skillProfile ?? null);
    } catch (err) {
      setError(err.message || 'Could not load assessment. Check the server is running.');
    } finally {
      setLoadingAssessment(false);
    }
  }, []);

  // Sync form when student data arrives
  useEffect(() => {
    if (student) {
      setForm({
        name: student.name ?? '',
        degree: student.degree ?? '',
        semester: String(student.semester ?? 1),
        targetCareerId: student.targetCareerId ?? '',
      });
    }
  }, [student]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const semNum = Number(form.semester);
    if (!form.name.trim())          return setError('Name is required.');
    if (!form.degree.trim())        return setError('Degree / branch is required.');
    if (semNum < 1 || semNum > 8)   return setError('Semester must be between 1 and 8.');
    if (!form.targetCareerId.trim()) return setError('Please select a target career.');

    try {
      setSavingProfile(true);
      setError(null);
      await updateProfile({ ...form, semester: semNum });
      setSuccessMsg('Profile saved successfully!');
    } catch (err) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();

    if (answeredCount < totalQuestions) {
      setError(`Please answer all ${totalQuestions} questions before submitting. (${totalQuestions - answeredCount} remaining)`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      const result = await updateSkills(answers);
      setSkillProfile(result.skillProfile);
      setAssessmentResult(result.assessment);
      setAnswers({});
      setSuccessMsg(
        `Assessment complete! Overall score: ${result.assessment.overallScore}% ` +
        `(${result.assessment.correctCount}/${result.assessment.questionCount} correct)`
      );
      // Scroll to results
      setTimeout(() => {
        document.getElementById('skill-profile-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err) {
      setError(err.message || 'Could not submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────────

  const overallScore = skillProfile?.all?.length
    ? Math.round(skillProfile.all.reduce((sum, s) => sum + s.score, 0) / skillProfile.all.length)
    : null;

  const overallBand = overallScore == null ? null
    : overallScore >= 70 ? BANDS[0]
    : overallScore >= 40 ? BANDS[1]
    : BANDS[2];

  // ── Loading / error screens ──────────────────────────────────────────────────

  if (loadingAssessment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner label="Loading profile & assessment…" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <header className="relative border-b border-slate-800 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-indigo-500/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <User2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Student Profile</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your profile and generate a real skill profile from scored responses
              </p>
            </div>
          </div>
          {overallScore != null && (
            <div className="flex items-center gap-3 glass-panel rounded-2xl px-4 py-3">
              <div className="relative">
                <ScoreRing score={overallScore} colorClass={overallBand?.colorClass ?? 'sky'} size={56} stroke={6} />
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${overallBand?.textColor ?? 'text-sky-400'}`}>
                  {overallScore}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Overall Score</p>
                <p className={`text-sm font-bold ${overallBand?.textColor ?? 'text-sky-400'}`}>
                  {overallBand?.label ?? 'Not assessed'}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Notification Banners ─────────────────────────────────────────────── */}
      {error     && <Banner type="error"   message={error}      onDismiss={() => setError(null)} />}
      {successMsg && <Banner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />}

      {/* ── Profile Form ─────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-sky-400" />
          <h2 className="text-base font-bold text-white">Profile Details</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="block text-xs font-medium text-slate-400">Full Name</label>
            <input
              id="profile-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Aditya Sharma"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white
                placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors"
            />
          </div>

          {/* Degree / Branch */}
          <div className="space-y-1.5">
            <label htmlFor="profile-degree" className="block text-xs font-medium text-slate-400">Degree / Branch</label>
            <input
              id="profile-degree"
              required
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              placeholder="e.g. B.Tech CSE (Data Science)"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white
                placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors"
            />
          </div>

          {/* Semester */}
          <div className="space-y-1.5">
            <label htmlFor="profile-semester" className="block text-xs font-medium text-slate-400">Semester</label>
            <select
              id="profile-semester"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors appearance-none cursor-pointer"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Target Career */}
          <div className="space-y-1.5">
            <label htmlFor="profile-career" className="block text-xs font-medium text-slate-400">Target Career / Role</label>
            <select
              id="profile-career"
              value={form.targetCareerId}
              onChange={(e) => setForm({ ...form, targetCareerId: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Select a career…</option>
              {allCareers.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between">
            {student && (
              <p className="text-xs text-slate-500">
                Student ID: <span className="font-mono text-slate-400">{student.id}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={savingProfile}
              id="save-profile-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-2.5
                text-xs font-bold text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Current Skill Scores ─────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Current Skill Scores</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {skillProfile?.all?.length ?? 0} skills tracked
          </span>
        </div>
        {(!skillProfile?.all?.length) ? (
          <EmptyState title="No skill data yet" message="Submit the assessment below to generate your skill profile." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
            {skillProfile.all.map((s) => {
              const band = s.score >= 70 ? 'strong' : s.score >= 40 ? 'average' : 'weak';
              return <SkillBar key={s.skillId} {...s} band={band} />;
            })}
          </div>
        )}
      </Card>

      {/* ── Skill Profile Bands ──────────────────────────────────────────────── */}
      <section id="skill-profile-section">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white">Skill Profile</h2>
          {assessmentResult && (
            <span className="ml-auto text-xs text-slate-500 font-mono">
              Last scored: {new Date(assessmentResult.answeredAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BANDS.map((band) => (
            <BandCard key={band.key} band={band} skills={skillProfile?.[band.key]} />
          ))}
        </div>
      </section>

      {/* ── Assessment Form ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-bold text-white">Skill Assessment</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">
              {questionsBySkill.size} skills · {totalQuestions} questions · 3 difficulty levels
            </span>
            {totalQuestions > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className={`text-xs font-mono font-bold ${progressPct === 100 ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {progressPct}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Difficulty legend */}
        <div className="flex items-center gap-4 mb-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Beginner (1×)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Intermediate (1.5×)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Advanced (2×)</span>
          <span className="text-slate-500">Weighted scoring</span>
        </div>

        <form onSubmit={handleSubmitAssessment} className="space-y-4">
          {Array.from(questionsBySkill.entries()).map(([skillId, qs]) => (
            <SkillGroup
              key={skillId}
              skillId={skillId}
              skillName={skillById.get(skillId)?.name ?? skillId}
              questions={qs}
              answers={answers}
              onAnswer={handleAnswer}
              isComplete={completedSkills.has(skillId)}
            />
          ))}

          {/* Submit strip */}
          <div className="sticky bottom-4 glass-panel rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {answeredCount < totalQuestions
                ? <span><span className="text-white font-bold">{answeredCount}/{totalQuestions}</span> questions answered — complete all to submit</span>
                : <span className="text-emerald-400 font-bold">✓ All questions answered! Ready to submit.</span>
              }
            </div>
            <button
              type="submit"
              disabled={submitting || answeredCount < totalQuestions}
              id="submit-assessment-btn"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5
                text-sm font-bold text-slate-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_28px_rgba(16,185,129,0.4)]"
            >
              <BadgeCheck className="w-4 h-4" />
              {submitting ? 'Scoring…' : 'Submit Assessment'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
