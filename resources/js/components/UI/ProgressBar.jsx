import React from 'react';

export default function ProgressBar({ value, max = 100, color = 'bg-indigo-600' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-300 rounded-full`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
