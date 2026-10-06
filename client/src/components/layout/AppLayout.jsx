import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {children}
          </main>
          <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>B.Tech CSE (Data Science) Capstone • Intelligent Career Guidance Platform</span>
              <span className="font-mono text-[11px] text-slate-600">
                PriorityQueue • Kahn's DAG • 0/1 Knapsack DP • AST Diagnoser
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
