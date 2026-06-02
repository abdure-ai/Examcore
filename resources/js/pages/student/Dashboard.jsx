import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/Charts/StatCard';
import DataTable from '../../components/UI/DataTable';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import Badge from '../../components/UI/Badge';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';
import { fmtDate, parseDate } from '../../utils/date';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const toast = useToast();

  useEffect(() => {
    fetchStatsAndExams();
  }, []);

  const fetchStatsAndExams = async () => {
    try {
      setLoading(true);
      const statsRes = await axios.get('/api/dashboard');
      setStats(statsRes.data);

      const examsRes = await axios.get('/api/exams');
      setExams(examsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load student dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  // Filter exams locally
  const now = new Date();
  const ongoingExams  = exams.filter((e) => e.status === 'published' && parseDate(e.start_at) <= now && parseDate(e.end_at) >= now);
  const upcomingExams = exams.filter((e) => parseDate(e.start_at) > now);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Student Dashboard</h1>
        <p className="text-slate-400 text-sm">Take scheduled examinations, view score reviews and print certs.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Exams"
          value={stats.ongoing_exams}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="indigo"
        />
        <StatCard
          title="Completed"
          value={stats.completed_exams}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="emerald"
        />
        <StatCard
          title="My Pass Rate"
          value={`${stats.pass_rate}%`}
          icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055"
          color="rose"
        />
        <StatCard
          title="Certificates"
          value={stats.certificates}
          icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          color="amber"
        />
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All accessible exams — unified card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">My Assigned Exams</h3>
            <span className="text-xs text-slate-400">{exams.length} exam{exams.length !== 1 ? 's' : ''} assigned</span>
          </div>

          {exams.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No exams have been assigned to you yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {exams.map((exam) => {
                const isOngoing  = ongoingExams.some((e) => e.id === exam.id);
                const isUpcoming = !isOngoing && parseDate(exam.start_at) > now;
                const isClosed   = !isOngoing && !isUpcoming;
                return (
                  <div
                    key={exam.id}
                    className={`flex flex-col gap-3 p-4 border rounded-2xl transition-all ${
                      isOngoing  ? 'border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/30 dark:bg-indigo-900/10'
                    : isUpcoming ? 'border-amber-200 dark:border-amber-800/40 bg-amber-50/20 dark:bg-amber-900/10'
                    :              'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug">{exam.title}</h4>
                      {isOngoing  && <Badge variant="success">ACTIVE</Badge>}
                      {isUpcoming && <Badge variant="warning">UPCOMING</Badge>}
                      {isClosed   && <Badge variant="neutral">CLOSED</Badge>}
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-0.5">
                      <p>Duration: {exam.duration_minutes} min &nbsp;·&nbsp; Pass: {exam.passing_score}%</p>
                      {isOngoing  && <p>Ends: {fmtDate(exam.end_at)}</p>}
                      {isUpcoming && <p>Starts: {fmtDate(exam.start_at)}</p>}
                      {isClosed   && <p>Ended: {fmtDate(exam.end_at)}</p>}
                    </div>
                    {isOngoing && (
                      <Link
                        to={`/exams/${exam.id}/lobby`}
                        className="mt-auto text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-4 rounded-xl text-xs shadow-sm shadow-indigo-600/10 transition-all"
                      >
                        Enter Lobby
                      </Link>
                    )}
                    {isUpcoming && (
                      <span className="mt-auto text-center text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        Opens {fmtDate(exam.start_at)}
                      </span>
                    )}
                    {isClosed && (
                      <Link
                        to="/results"
                        className="mt-auto text-center text-xs text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
                      >
                        View Results →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">My Completed Exam Results</h3>
          <DataTable
            headers={['Exam Title', 'Score', 'Result Status', 'Actions']}
            items={stats.recent_results || []}
            renderRow={(result) => (
              <tr key={result.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{result.exam?.title}</td>
                <td className="px-6 py-4 font-bold">{result.percentage}%</td>
                <td className="px-6 py-4">
                  <Badge variant={result.passed ? 'success' : 'danger'}>
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </td>
                <td className="px-6 py-4 space-x-2 text-xs font-semibold">
                  <Link to={`/results/${result.id}/summary`} className="text-indigo-600 hover:underline">
                    View Results
                  </Link>
                </td>
              </tr>
            )}
            emptyMessage="You have not completed any examinations yet."
          />
        </div>
      </div>
    </div>
  );
}
