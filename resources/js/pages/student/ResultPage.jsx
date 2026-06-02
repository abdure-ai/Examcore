import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Badge from '../../components/UI/Badge';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';
import { fmtDate } from '../../utils/date';

export default function ResultPage() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/results/${resultId}`);
      setResult(response.data.result);
    } catch (error) {
      toast.error('Failed to load result sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      // Trigger a window open/download to the API route
      window.open(`/api/certificates/${resultId}/download`, '_blank');
      toast.success('Certificate download initialized.');
    } catch (error) {
      toast.error('Failed to download certificate.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !result) {
    return <LoadingSkeleton count={2} height="h-40" />;
  }

  const isGraded = result.graded_at !== null;

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight text-center">Exam Performance</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">{result.exam?.title}</h2>
          <p className="text-xs text-slate-400">Attempted on: {fmtDate(result.created_at)}</p>
        </div>

        {/* Big Score Display */}
        <div className="py-6 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall score</span>
          <div className="text-5xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
            {result.percentage}%
          </div>
          <div className="text-xs text-slate-450 font-semibold">
            {result.total_marks} / {result.max_marks} Total Points Earned
          </div>
        </div>

        {/* Pass/Fail Status Card */}
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 ${
          result.passed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-800/40 dark:text-emerald-400'
            : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-800/40 dark:text-rose-400'
        }`}>
          {result.passed ? (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              <span>Congratulations! You Passed the Exam.</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              <span>You did not meet the passing score ({result.exam?.passing_score}%).</span>
            </>
          )}
        </div>

        {/* Certificate Section if passed */}
        {result.passed && isGraded && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Certificate of Completion</h3>
              <p className="text-xs text-slate-400">A digital certificate is ready for download.</p>
            </div>
            <button
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow shadow-emerald-600/15 focus:outline-none transition-all flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {downloading ? 'Downloading...' : 'Print / Download Certificate PDF'}
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 flex gap-4">
          <Link
            to="/dashboard"
            className="flex-1 px-4 py-2.5 border rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to={`/results/${result.id}/review`}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-600/10 transition-all"
          >
            Review Answers
          </Link>
        </div>
      </div>
    </div>
  );
}
