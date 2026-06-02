import React from 'react';

export default function LoadingSkeleton({ count = 3, height = 'h-20' }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`w-full ${height} bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse`}
        ></div>
      ))}
    </div>
  );
}
