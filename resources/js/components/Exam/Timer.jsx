import React from 'react';
import { useTimer } from '../../hooks/useTimer';

export default function Timer({ onExpire }) {
  const { formatTime, isCritical } = useTimer(onExpire);

  const containerClass = isCritical
    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-800/40 dark:text-rose-400 font-bold animate-pulse'
    : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-800/40 dark:text-indigo-400';

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold shadow-sm transition-all ${containerClass}`}>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Time Remaining:</span>
      <span className="font-mono text-base font-bold">{formatTime()}</span>
    </div>
  );
}
