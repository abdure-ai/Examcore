import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/UI/Badge';
import DataTable from '../../components/UI/DataTable';
import { useToast } from '../../hooks/useToast';
import axios from '../../api/axios';
import { fmtDate, fmtDateOnly, parseDate } from '../../utils/date';

function examStatus(exam) {
  const now = new Date();
  const start = parseDate(exam.start_at);
  const end = parseDate(exam.end_at);
  if (exam.status !== 'published') return 'unavailable';
  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'active';
}

export default function StudentExams() {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/exams', { params: { page: currentPage, search } });
        setExams(res.data.data);
        setTotalPages(res.data.last_page);
      } catch {
        toast.error('Failed to load exams.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [currentPage, search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">My Exams</h1>
          <p className="text-slate-400 text-sm">Examinations assigned to you.</p>
        </div>
        <div className="max-w-xs w-full">
          <input
            type="text"
            placeholder="Search exams…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          />
        </div>
      </div>

      <DataTable
        headers={['Exam', 'Duration', 'Window', 'Status', 'Action']}
        items={exams}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="No exams have been assigned to you yet."
        renderRow={(exam) => {
          const status = examStatus(exam);
          return (
            <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
              <td className="px-6 py-4">
                <p className="font-bold text-slate-800 dark:text-slate-200">{exam.title}</p>
                {exam.description && (
                  <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{exam.description}</p>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {exam.duration_minutes} mins
              </td>
              <td className="px-6 py-4 text-xs text-slate-400 leading-relaxed whitespace-nowrap">
                <span>From: {fmtDate(exam.start_at)}</span>
                <br />
                <span>Until: {fmtDate(exam.end_at)}</span>
              </td>
              <td className="px-6 py-4">
                {status === 'active' && <Badge variant="success">ACTIVE</Badge>}
                {status === 'upcoming' && <Badge variant="warning">UPCOMING</Badge>}
                {status === 'closed' && <Badge variant="neutral">CLOSED</Badge>}
                {status === 'unavailable' && <Badge variant="neutral">UNAVAILABLE</Badge>}
              </td>
              <td className="px-6 py-4">
                {status === 'active' && (
                  <Link
                    to={`/exams/${exam.id}/lobby`}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm shadow-indigo-600/10 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Enter Lobby
                  </Link>
                )}
                {status === 'upcoming' && (
                  <span className="text-xs text-slate-400 italic">Opens {fmtDateOnly(exam.start_at)}</span>
                )}
                {status === 'closed' && (
                  <Link to="/results" className="text-xs text-indigo-500 hover:underline font-semibold">
                    View Results
                  </Link>
                )}
                {status === 'unavailable' && (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}
