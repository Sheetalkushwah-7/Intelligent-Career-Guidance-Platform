import React from 'react';
import { useStudent } from '../../context/StudentContext';
import { navItems } from './navItems';

export function Sidebar() {
  const { activeTab, setActiveTab } = useStudent();

  return (
    <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950/70">
      <div className="px-4 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
        Navigate
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
