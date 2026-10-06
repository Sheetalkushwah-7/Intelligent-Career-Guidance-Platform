import React from 'react';

export function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center space-y-1">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  );
}
