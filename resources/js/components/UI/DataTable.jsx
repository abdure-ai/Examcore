import React from 'react';

export default function DataTable({ headers, items, renderRow, isLoading, emptyMessage = 'No data found' }) {
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
    </div>
  );
}
