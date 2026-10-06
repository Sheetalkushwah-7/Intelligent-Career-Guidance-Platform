import React, { useState, useEffect } from 'react';
import { LayoutDashboard, RefreshCw, Play } from 'lucide-react';
import { api } from '../api';
import { useStudent } from '../context/StudentContext';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';

export function Dashboard() {
  const { setActiveTab } = useStudent();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const student = data?.student;
  const topCareers = data?.topCareers || [];
  const submissions = data?.recentSubmissions || [];
  const revision = data?.revision;
  const masteryEntries = Object.entries(student?.conceptMastery || {});

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Live student snapshot from GET /api/student/dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && <Spinner label="Loading dashboard…" />}

      {!loading && error && (
        <ErrorState title="Dashboard unavailable" message={error} onRetry={loadDashboard} />
      )}

      {!loading && !error && student && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Card title="Student">
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Name</dt>
                  <dd className="text-slate-200 font-medium">{student.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Program</dt>
                  <dd className="text-slate-200">{student.degree}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Semester</dt>
                  <dd className="font-mono text-slate-200">{student.semester}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Target career</dt>
                  <dd className="text-sky-400 capitalize">
                    {(student.targetCareerId || '').replaceAll('_', ' ')}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card title="Top career matches">
              {topCareers.length === 0 ? (
                <EmptyState title="No career scores yet" message="Run career recommendations from Career Guidance." />
              ) : (
                <ul className="space-y-2">
                  {topCareers.map((career) => (
                    <li
                      key={career.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <span className="font-semibold text-white">{career.title}</span>
                      <span className="font-mono text-sky-400">
                        {career.compatibilityScore != null ? `${career.compatibilityScore}%` : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card title="Concept mastery">
              {masteryEntries.length === 0 ? (
                <EmptyState title="No mastery data" message="Complete practice to populate concept mastery." />
              ) : (
                <div className="space-y-3">
                  {masteryEntries.map(([concept, score]) => (
                    <div key={concept} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-200">{concept}</span>
                        <span className="font-mono text-sky-400">{score}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${Math.max(0, Math.min(100, Number(score) || 0))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <Card
              title="Revision"
              action={
                revision?.decayedCount != null ? (
                  <span className="text-xs font-mono text-amber-400">
                    {revision.decayedCount} at-risk
                  </span>
                ) : null
              }
            >
              {!revision?.decayRanking?.length ? (
                <EmptyState title="No revision ranking" message="Revision status will appear after skill history is available." />
              ) : (
                <div className="space-y-2">
                  {revision.decayRanking.map((skill) => (
                    <div
                      key={skill.skillId}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{skill.skillName}</div>
                        <p className="text-[11px] text-slate-400">
                          Inactive {skill.daysInactive} days
                        </p>
                      </div>
                      <div className="font-mono text-right">
                        Retention {skill.retentionPercent}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {revision?.revisionTasksQueue?.length > 0 && (
              <Card title="Revision queue">
                <div className="space-y-2">
                  {revision.revisionTasksQueue.map((item, idx) => (
                    <div
                      key={item.problem?.id || idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{item.problem?.title || 'Practice problem'}</span>
                        <p className="text-[11px] text-amber-300/80">{item.reason}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('practice')}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 flex-shrink-0"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Solve
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-12">
            <Card title="Recent submissions">
              {submissions.length === 0 ? (
                <EmptyState title="No submissions yet" message="Submit a solution from DSA Practice to see it here." />
              ) : (
                <ul className="space-y-2">
                  {submissions.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <span className="text-slate-200">{sub.problemTitle || sub.problemId}</span>
                      <span className="font-mono text-slate-400">{sub.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
