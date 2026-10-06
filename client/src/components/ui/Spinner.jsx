import React from 'react';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-slate-400 py-16">
      <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-mono">{label}</p>
    </div>
  );
}
