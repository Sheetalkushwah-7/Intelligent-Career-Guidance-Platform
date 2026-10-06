import React from 'react';
import { Compass } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { navItems } from './navItems';

export function Navbar() {
  const { student, activeTab, setActiveTab } = useStudent();

  const initials = student?.name
    ? student.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    : '—';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              INTELLIGENT
              <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                DSA Core
              </span>
            </span>
            <p className="text-xs text-slate-400 hidden sm:block">Adaptive Career Guidance</p>
          </div>
        </div>

        <nav className="flex lg:hidden items-center gap-1 overflow-x-auto py-1 max-w-[50vw]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {student && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{student.name}</div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                <span>Target:</span>
                <span className="text-sky-400 capitalize">
                  {(student.targetCareerId || '').replaceAll('_', ' ')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400 hover:border-sky-500 transition-colors"
              title="Open dashboard"
            >
              {initials}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
