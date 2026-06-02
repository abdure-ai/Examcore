import React from 'react';

export default function QuestionCard({ question, number, onAnswer, onToggleFlag }) {
  const handleSelectMCQ = (index) => {
    onAnswer(question.id, String(index));
  };

  const handleSelectTF = (value) => {
    onAnswer(question.id, value);
  };

  const handleChangeSA = (e) => {
    onAnswer(question.id, e.target.value);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header (Question number, marks, and flag button) */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl flex items-center justify-center text-sm">
            {number}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Value: {question.marks} {question.marks === 1 ? 'Point' : 'Points'}
          </span>
        </div>
        <button
          onClick={() => onToggleFlag(question.id, !question.is_flagged)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            question.is_flagged
              ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-500/10 dark:border-amber-800/40 dark:text-amber-400'
              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <svg className="h-4 w-4" fill={none => 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {question.is_flagged ? 'Flagged' : 'Flag for Review'}
        </button>
      </div>

      {/* Body (Question content) */}
      <div className="text-slate-800 dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
        {question.content}
      </div>

      {/* Inputs (Type based MCQ, TF, SA) */}
      <div className="mt-2">
        {question.type === 'MCQ' && (
          <div className="grid grid-cols-1 gap-3">
            {question.options &&
              question.options.map((option, idx) => {
                const isSelected = question.saved_answer === String(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectMCQ(idx)}
                    className={`text-left w-full px-5 py-4 rounded-2xl border text-sm font-medium transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full border text-xs font-bold flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                );
              })}
          </div>
        )}

        {question.type === 'TF' && (
          <div className="flex gap-4">
            {['true', 'false'].map((value) => {
              const isSelected = question.saved_answer === value;
              const label = value === 'true' ? 'True' : 'False';
              return (
                <button
                  key={value}
                  onClick={() => handleSelectTF(value)}
                  className={`flex-1 text-center py-4 rounded-2xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'SA' && (
          <textarea
            value={question.saved_answer || ''}
            onChange={handleChangeSA}
            placeholder="Type your answer here..."
            className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-200 dark:border-slate-850 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800 dark:text-slate-200"
          ></textarea>
        )}
      </div>
    </div>
  );
}
