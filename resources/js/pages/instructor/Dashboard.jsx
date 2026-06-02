import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/Charts/StatCard';
import DataTable from '../../components/UI/DataTable';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import Badge from '../../components/UI/Badge';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';
import { fmtDate } from '../../utils/date';

export default function InstructorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load instructor dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Instructor Portal</h1>
          <p className="text-slate-400 text-sm">Author exams, view scores, grade short answers, and track cohorts.</p>
        </div>
        <Link
          to="/exams"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm"
        >
          Manage Exams
        </Link>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Exams"
          value={stats.total_exams}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2"
          color="indigo"
        />
        <StatCard
          title="Total Questions"
          value={stats.total_questions}
          icon="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="emerald"
        />
        <StatCard
          title="Attempts Completed"
          value={stats.total_sessions}
          icon="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5a13.96 13.96 0 00-4.04-9.309M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="rose"
        />
        <StatCard
          title="Pending Grading"
          value={stats.pending_grading}
          icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          trend="Manual review"
          color="amber"
        />
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent exams */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">My Recent Exams</h3>
          <DataTable
            headers={['Title', 'Status', 'Start Date', 'Actions']}
            items={stats.recent_exams || []}
            renderRow={(exam) => (
              <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{exam.title}</td>
                <td className="px-6 py-4">
                  <Badge variant={exam.status === 'published' ? 'success' : 'neutral'}>
                    {exam.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                  {fmtDate(exam.start_at)}
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/exams/${exam.id}/questions`}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                  >
                    Question Bank
                  </Link>
                </td>
              </tr>
            )}
            emptyMessage="No exams authored yet"
          />
        </div>

        {/* Info panel / shortcuts */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Quick Actions</h3>
            <p className="text-xs text-slate-400">Shortcuts to manage your courses</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/results"
              className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-800 transition-colors"
            >
              <span className="p-2.5 bg-amber-500 text-white rounded-xl">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Grade Student Answers</p>
                <p className="text-[10px] text-slate-400">Review and grade Short Answers manually</p>
              </div>
            </Link>

            <Link
              to="/groups"
              className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-800 transition-colors"
            >
              <span className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Student Cohorts</p>
                <p className="text-[10px] text-slate-400">Manage student groups and class lists</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
