import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import Badge from '../../components/UI/Badge';
import { useToast } from '../../hooks/useToast';
import axios from '../../api/axios';

export default function ExamLobby() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const toast      = useToast();

  const [exam,        setExam]        = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [starting,    setStarting]    = useState(false);
  const [agreed,      setAgreed]      = useState(false);
  const [passcode,    setPasscode]    = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [examRes, sessionRes] = await Promise.all([
          axios.get(`/api/exams/${examId}`),
          axios.get(`/api/exams/${examId}/session/current`),
        ]);
        setExam(examRes.data);
        setSessionInfo(sessionRes.data);

        // Auto-redirect if there is already an in-progress session
        if (sessionRes.data.session?.status === 'in_progress') {
          navigate(`/sessions/${sessionRes.data.session.id}/take`, { replace: true });
        }
      } catch {
        toast.error('Failed to load exam details.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [examId]);

  const handleStart = async () => {
    if (!agreed) {
      toast.warning('Please agree to the exam rules first.');
      return;
    }
    if (exam?.has_passcode && !passcode.trim()) {
      setPasscodeError('Please enter the exam passcode.');
      return;
    }
    setPasscodeError('');
    setStarting(true);
    try {
      const res = await axios.post(`/api/exams/${examId}/session/start`, {
        passcode: passcode.trim() || undefined,
      });
      navigate(`/sessions/${res.data.session.id}/take`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start exam session.';
      if (err.response?.status === 403 && msg.toLowerCase().includes('passcode')) {
        setPasscodeError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading || !exam) return <LoadingSkeleton count={2} height="h-40" />;

  const { session, attempt_count, can_attempt } = sessionInfo ?? {};
  const lastStatus   = session?.status;
  const attemptsLeft = exam.max_attempts - (attempt_count ?? 0);
  const hasResult    = !!session?.result;

  const statusBadge = () => {
    if (lastStatus === 'submitted') return <Badge variant="warning">SUBMITTED — GRADING</Badge>;
    if (lastStatus === 'graded')    return <Badge variant="success">GRADED</Badge>;
    if (lastStatus === 'expired')   return <Badge variant="danger">EXPIRED</Badge>;
    return null;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Examination Lobby</h1>
        <p className="text-slate-400 text-sm">Verify the exam specifications and rules before beginning.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">

        {/* Exam title + last attempt badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">{exam.title}</h2>
            <p className="text-slate-500 text-sm">{exam.description || 'No description provided.'}</p>
          </div>
          {statusBadge()}
        </div>

        {/* Previous attempt result banner */}
        {hasResult && (
          <div className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${session.result.passed ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/40' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/40'}`}>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Last attempt score:&nbsp;
                <span className={session.result.passed ? 'text-emerald-600' : 'text-rose-600'}>
                  {session.result.percentage}% — {session.result.passed ? 'PASSED' : 'FAILED'}
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Attempt {attempt_count} of {exam.max_attempts}</p>
            </div>
            <Link
              to={`/results/${session.result.id}/summary`}
              className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Full Results →
            </Link>
          </div>
        )}

        {/* No attempts left */}
        {!can_attempt && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 text-center text-sm text-slate-500">
            You have used all {exam.max_attempts} attempt{exam.max_attempts > 1 ? 's' : ''} for this exam.
          </div>
        )}

        {/* Specs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-slate-800/80">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Duration</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{exam.duration_minutes} min</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Passing score</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{exam.passing_score}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Attempts left</p>
            <p className={`text-sm font-semibold ${attemptsLeft === 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {attemptsLeft} of {exam.max_attempts}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold">Questions</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{exam.questions_count ?? '—'}</p>
          </div>
        </div>

        {/* Anti-cheat guidelines */}
        <div className="space-y-3 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/60 dark:border-rose-900/30 p-5 rounded-2xl">
          <h3 className="font-bold text-sm text-rose-500 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Anti-Cheat & Security Rules
          </h3>
          <ul className="list-disc pl-5 text-xs text-slate-500 space-y-1">
            <li><strong>Answers auto-save</strong> as you go — safe to resume if disconnected.</li>
            <li><strong>Fullscreen mode</strong> is enforced. Exiting fires a cheat alert.</li>
            <li><strong>Tab switching</strong> is logged automatically.</li>
            <li><strong>Timer runs server-side.</strong> Logging out does not pause it.</li>
            <li><strong>Auto-submit</strong> occurs when the countdown reaches zero.</li>
          </ul>
        </div>

        {/* Passcode gate */}
        {can_attempt && exam?.has_passcode && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              This exam requires a passcode
            </div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setPasscodeError(''); }}
              placeholder="Enter exam passcode…"
              className="w-full px-4 py-2.5 border border-amber-300 dark:border-amber-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 font-mono tracking-widest bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
            {passcodeError && (
              <p className="text-xs text-rose-500 font-semibold">{passcodeError}</p>
            )}
          </div>
        )}

        {/* Agreement + controls */}
        {can_attempt && (
          <>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="rounded mt-1 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-500 leading-relaxed">
                I have read and agree to all examination rules. I understand that bypassing security features will flag my session.
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Link to="/dashboard" className="px-4 py-2.5 text-sm font-semibold border rounded-xl">
                Back
              </Link>
              <button
                onClick={handleStart}
                disabled={starting || !agreed}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm disabled:opacity-50"
              >
                {starting ? 'Initializing…' : attempt_count > 0 ? 'Start New Attempt' : 'Enter Fullscreen & Start Exam'}
              </button>
            </div>
          </>
        )}

        {!can_attempt && (
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <Link to="/dashboard" className="px-4 py-2.5 text-sm font-semibold border rounded-xl">
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
