import React, { useState, useEffect } from 'react';
import StatCard from '../../components/Charts/StatCard';
import BarChart from '../../components/Charts/BarChart';
import DataTable from '../../components/UI/DataTable';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import axios from 'axios';
import { fmtDate } from '../../utils/date';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load admin stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  // Map backend stats to visual dashboard charts
  const statusChartData = stats.exams_by_status.map((item) => ({
    label: item.status.toUpperCase(),
    value: item.count
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">System-wide analytics and audit activities overview.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          trend="+8%"
          color="indigo"
        />
        <StatCard
          title="Total Exams"
          value={stats.total_exams}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
          trend="+12%"
          color="emerald"
        />
        <StatCard
          title="Live Sessions"
          value={stats.active_sessions}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          trend="Real-time"
          color="rose"
        />
        <StatCard
          title="Overall Pass Rate"
          value={`${stats.pass_rate}%`}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          trend="Avg"
          color="amber"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {statusChartData.length > 0 ? (
            <BarChart data={statusChartData} />
          ) : (
            <div className="bg-white dark:bg-slate-900 border p-6 rounded-3xl text-center text-slate-400">
              No exam stats data available
            </div>
          )}
        </div>

        {/* Recent logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Recent Audit Logs</h3>
          </div>
          <DataTable
            headers={['Action', 'Performed By', 'Timestamp']}
            items={stats.recent_activity || []}
            renderRow={(log, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                  {log.action.replace(/[._]/g, ' ')}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                  {log.user ? log.user.name : 'System'}
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  {fmtDate(log.created_at)}
                </td>
              </tr>
            )}
            emptyMessage="No recent audit activities registered"
          />
        </div>
      </div>
    </div>
  );
}
