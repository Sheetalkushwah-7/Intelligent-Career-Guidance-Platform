import React from 'react';

export function Card({ title, action, children, className = '' }) {
  return (
    <div className={`glass-panel rounded-2xl p-6 space-y-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
