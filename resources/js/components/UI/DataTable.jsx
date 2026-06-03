import React from 'react';

export default function DataTable({
  headers,
  items,
  renderRow,
  isLoading,
  emptyMessage = 'No data found',
  currentPage,
  totalPages,
  onPageChange,
  total,
}) {
  const showPagination = totalPages && totalPages > 1 && typeof onPageChange === 'function';

  // Build a compact page-number window around the current page
  const pageNumbers = () => {
    const pages = [];
    const delta = 1;
    const start = Math.max(1, currentPage - delta);
    const end   = Math.min(totalPages, currentPage + delta);
    if (start > 1) { pages.push(1); if (start > 2) pages.push('…'); }
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages) { if (end < totalPages - 1) pages.push('…'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <span className="text-xs text-slate-400">
            Page <span className="font-semibold text-slate-600 dark:text-slate-300">{currentPage}</span> of {totalPages}
            {typeof total === 'number' && <> &nbsp;·&nbsp; {total} total</>}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>

            {pageNumbers().map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className="px-2 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`h-8 w-8 text-xs font-bold rounded-lg border transition-colors ${
                    p === currentPage
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
