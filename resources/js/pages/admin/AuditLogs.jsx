import React, { useState, useEffect } from 'react';
import DataTable from '../../components/UI/DataTable';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';
import { fmtDate } from '../../utils/date';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/audit-logs', {
        params: {
          page: currentPage,
          search: search || undefined,
          action: actionFilter || undefined
        }
      });
      setLogs(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Audit Logs</h1>
        <p className="text-slate-400 text-sm">Immutable history of system-wide changes, authentication events, and student exam activity.</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search by user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
          />
          <button type="submit" className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-semibold">
            Search
          </button>
        </form>

        <input
          type="text"
          placeholder="Filter by action (e.g. login)..."
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border rounded-xl bg-transparent text-sm focus:outline-none w-64"
        />
      </div>

      {/* Logs Table */}
      <DataTable
        headers={['Action', 'Performed By', 'IP Address', 'User Agent', 'Timestamp']}
        items={logs}
        isLoading={loading}
        renderRow={(log) => (
          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-xs">
            <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
              {log.action.replace(/[._]/g, ' ').toUpperCase()}
            </td>
            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
              {log.user ? `${log.user.name} (${log.user.email})` : 'System / Guest'}
            </td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{log.ip_address || 'N/A'}</td>
            <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={log.user_agent}>
              {log.user_agent || 'N/A'}
            </td>
            <td className="px-6 py-4 text-slate-400 font-semibold">
              {fmtDate(log.created_at)}
            </td>
          </tr>
        )}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-4 py-2 border rounded-xl disabled:opacity-40 text-xs font-bold"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-4 py-2 border rounded-xl disabled:opacity-40 text-xs font-bold"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
