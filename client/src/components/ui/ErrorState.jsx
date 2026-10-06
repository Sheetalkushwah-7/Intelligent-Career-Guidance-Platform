import React from 'react';

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="glass-panel max-w-md w-full mx-auto p-6 rounded-2xl border-rose-500/30 text-center space-y-3">
      <div className="text-rose-400 font-bold text-sm">{title}</div>
      {message && <p className="text-xs text-slate-300">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
        >
          Retry
        </button>
      )}
    </div>
  );
}
