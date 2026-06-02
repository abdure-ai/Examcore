import React from 'react';

export default function BarChart({ data }) {
  // data format: [{ label: string, value: number }]
  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Exam Results Analytics</h4>
        <p className="text-xs text-slate-400">Score distribution trends</p>
      </div>
      <div className="flex items-end justify-between h-48 pt-6 border-b border-slate-100 dark:border-slate-800/80 px-2 gap-2">
        {data.map((item, idx) => {
          const heightPercent = (item.value / maxVal) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.value}
              </div>
              <div
                className="w-full bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-t-lg transition-all duration-350"
                style={{ height: `${heightPercent}%`, minHeight: '4px' }}
              ></div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-tight truncate max-w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
