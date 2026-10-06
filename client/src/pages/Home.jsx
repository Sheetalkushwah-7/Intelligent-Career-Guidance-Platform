import React from 'react';
import { 
  Compass, 
  Search, 
  Code2, 
  Sliders, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useStudent } from '../context/StudentContext';

export function Home() {
  const { student, setActiveTab } = useStudent();

  const primaryActions = [
    {
      id: 'careers',
      number: '01',
      title: 'Find Your Career',
      subtitle: 'Priority Queue (Max-Heap) Compatibility Ranking',
      description: 'Match your current skill vector against 6+ high-demand CS & Data Science career profiles with exact gap extraction.',
      icon: Compass,
      buttonText: 'Explore Career Fits',
      color: 'from-sky-500 to-blue-600',
      tag: 'Max-Heap O(N log K)'
    },
    {
      id: 'diagnosis',
      number: '02',
      title: 'Discover Your Weakness',
      subtitle: 'Root-Cause DSA Diagnostic Engine',
      description: 'Move beyond "Wrong Answer". Detect 18 root causes: nested quadratic loops, missing base cases, boundary failure, and hashmap omissions.',
      icon: Search,
      buttonText: 'Run Diagnostics',
      color: 'from-amber-500 to-orange-600',
      tag: 'Multi-Pattern AST'
    },
    {
      id: 'practice',
      number: '03',
      title: 'Get Your Next Best Problem',
      subtitle: 'Adaptive Problem Recommendation & IDE',
      description: 'Solve vetted coding challenges with sandboxed in-browser execution, edge cases, and automated AI Viva complexity checks.',
      icon: Code2,
      buttonText: 'Start DSA Practice',
      color: 'from-emerald-500 to-teal-600',
      tag: 'Sandboxed Runner'
    },
    {
      id: 'simulator',
      number: '04',
      title: 'Simulate Your Future',
      subtitle: 'Career Readiness What-If Simulator',
      description: 'Test hypothetical skill boosts (e.g. "What if SQL jumps from 40% to 80%?") with stack-based undo/redo and career unlock detection.',
      icon: Sliders,
      buttonText: 'Launch Simulator',
      color: 'from-purple-500 to-indigo-600',
      tag: 'Stack LIFO History'
    },
    {
      id: 'optimizer',
      number: '05',
      title: 'Build Your Optimal Plan',
      subtitle: '0/1 Knapsack Dynamic Programming Optimizer',
      description: 'Enter your available hours (e.g. "I have 30 hours") to mathematically maximize career impact within your constraint.',
      icon: Clock,
      buttonText: 'Optimize Time Budget',
      color: 'from-rose-500 to-pink-600',
      tag: '0/1 Knapsack DP'
    }
  ];

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/60 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            B.Tech CSE (Data Science) DSA Capstone Architecture
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Career Guidance & <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">DSA Diagnostics</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            A mathematically rigorous platform combining <strong>Priority Queues</strong>, <strong>Kahn's Topological Sort</strong>, <strong>0/1 Knapsack DP</strong>, and <strong>Adaptive AST Diagnostics</strong> to bridge student skill gaps and optimize career trajectories.
          </p>

          {/* Quick Metrics Bar */}
          {student && (
            <div className="pt-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Active Profile:</span>
                <span className="font-semibold text-white">{student.name}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span className="text-slate-400">Target Role:</span>
                <span className="font-semibold text-sky-400 capitalize">{student.targetCareerId.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-400">Skills Tracked:</span>
                <span className="font-semibold text-white">{Object.keys(student.skills).length} proficiencies</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The 5 Primary Flagship Actions */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Five Core Platform Actions
            <span className="text-xs font-normal text-slate-400">Choose your next step</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Engineered around real algorithmic computation — no hardcoded heuristics or superficial chat wrappers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {primaryActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => setActiveTab(action.id === 'diagnosis' ? 'practice' : action.id)}
                className="glass-panel-interactive rounded-2xl p-6 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                {/* Action Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-sky-400" />
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {action.tag}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-sky-400 tracking-wider">
                      STEP {action.number}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      {action.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    {action.buttonText}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    #{idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
