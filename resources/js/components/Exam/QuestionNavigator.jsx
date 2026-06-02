import React from 'react';

export default function QuestionNavigator({ questions, currentIndex, onSelect, onSubmit }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col gap-6 h-full">
      <div>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
          Questions Navigator
        </h4>
        <p className="text-xs text-slate-400">Click any number to jump to question</p>
      </div>

      {/* Grid of buttons */}
      <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = q.saved_answer !== undefined && q.saved_answer !== null && q.saved_answer !== '';
          const isFlagged = q.is_flagged;

          let btnClass = 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800';

          if (isCurrent) {
            btnClass = 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10';
          } else if (isFlagged) {
            btnClass = 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10';
          } else if (isAnswered) {
            btnClass = 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10';
          }

          return (
            <button
              key={q.id}
              onClick={() => onSelect(idx)}
              className={`h-9 w-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${btnClass}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="h-3.5 w-3.5 bg-emerald-500 rounded-md"></span>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="h-3.5 w-3.5 bg-amber-500 rounded-md"></span>
          <span>Flagged for Review</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="h-3.5 w-3.5 border border-slate-300 dark:border-slate-700 rounded-md"></span>
          <span>Not Answered</span>
        </div>
      </div>

      {/* Finish Button */}
      <button
        onClick={onSubmit}
        className="w-full mt-auto bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-lg shadow-rose-500/15 focus:outline-none transition-all flex items-center justify-center gap-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Submit Examination
      </button>
    </div>
  );
}
