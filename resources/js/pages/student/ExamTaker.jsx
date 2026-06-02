import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useTimer } from '../../hooks/useTimer';
import { useToast } from '../../hooks/useToast';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';

export default function ExamTaker() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    activeSession, exam, questions,
    currentIndex, isLoading,
    fetchSession, setCurrentIndex,
    saveAnswer, flagQuestion, submitExam, resetSession,
  } = useExamStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg]   = useState('');
  const autoSubmittingRef = useRef(false);

  const { requestFullscreen } = useAntiCheat(
    !!activeSession && activeSession.status === 'in_progress'
  );

  useEffect(() => {
    fetchSession(sessionId);
    return () => resetSession(); // clean up when leaving the exam
  }, [sessionId]);

  useEffect(() => {
    if (activeSession?.status === 'in_progress') requestFullscreen();
  }, [activeSession]);

  // ── Submit helpers ────────────────────────────────────────────────────────

  const handleForceAutoSubmit = async () => {
    if (autoSubmittingRef.current) return; // already in progress — ignore duplicate fires
    autoSubmittingRef.current = true;
    toast.error('Time is up! Submitting your exam automatically...');
    try {
      const data = await submitExam(0);
      if (document.fullscreenElement) document.exitFullscreen();
      resetSession();
      const resultId = data?.result?.id;
      navigate(resultId ? `/results/${resultId}/summary` : '/dashboard');
    } catch {
      toast.error('Failed to auto-submit exam.');
      autoSubmittingRef.current = false; // allow retry on network failure
    }
  };

  const handleManualSubmit = () => {
    const unanswered = questions.filter(q => !q.saved_answer && q.saved_answer !== 0).length;
    setConfirmMsg(
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
        : 'Are you sure you want to submit your exam?'
    );
    setConfirmOpen(true);
  };

  const doSubmit = async () => {
    try {
      const data = await submitExam(0);
      if (document.fullscreenElement) document.exitFullscreen();
      resetSession();
      // Navigate to result if graded immediately, else dashboard
      const resultId = data?.result?.id;
      navigate(resultId ? `/results/${resultId}/summary` : '/dashboard');
    } catch {
      toast.error('Submission failed.');
    }
  };

  // Timer — runs always so it stays accurate
  const { formatTime, isCritical } = useTimer(handleForceAutoSubmit);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading || !activeSession || !exam) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <LoadingSkeleton count={3} height="h-32" />
      </div>
    );
  }

  const question      = questions[currentIndex];
  const isAnswered    = question?.saved_answer != null && question?.saved_answer !== '';
  const isFlagged     = !!question?.is_flagged;
  const answeredCount = questions.filter(q => q.saved_answer != null && q.saved_answer !== '').length;

  // ── Answer handlers ───────────────────────────────────────────────────────

  const handleMCQ = (idx)   => saveAnswer(question.id, String(idx));
  const handleTF  = (val)   => saveAnswer(question.id, val);
  const handleSA  = (e)     => saveAnswer(question.id, e.target.value);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans select-none">

      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm transition-colors"
          >
            ← Back
          </button>
          <span>Home</span>
          <span className="text-gray-400">›</span>
          <span className="font-medium text-gray-700">My exam</span>
        </div>
        <div
          className={`px-4 py-1.5 rounded border text-sm font-mono font-bold transition-all ${
            isCritical
              ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
              : 'bg-gray-50 border-gray-300 text-gray-700'
          }`}
        >
          Time left&nbsp;&nbsp;{formatTime()}
        </div>
      </div>

      {/* ── Exam title ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
        <h1 className="text-lg font-bold text-gray-800">{exam.title}</h1>
      </div>

      {/* ── 3-column workspace ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Question info panel */}
        <aside className="w-44 shrink-0 bg-white border-r border-gray-200 p-3 overflow-y-auto">
          <div
            className={`rounded border p-3 text-sm space-y-2 ${
              isFlagged
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="font-bold text-gray-800 text-sm">
              Question {currentIndex + 1}
            </div>
            <div className={`text-xs font-medium ${isAnswered ? 'text-green-600' : 'text-gray-500'}`}>
              {isAnswered ? 'Answer saved' : 'Not yet answered'}
            </div>
            <div className="text-xs text-gray-500">
              Marked out of {question?.marks ?? 1}.00
            </div>
            {question && (
              <button
                onClick={() => flagQuestion(question.id, !isFlagged)}
                className={`flex items-center gap-1.5 text-xs pt-0.5 ${
                  isFlagged
                    ? 'text-amber-600 font-semibold'
                    : 'text-blue-600 hover:underline'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill={isFlagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {isFlagged ? 'Remove flag' : 'Flag question'}
              </button>
            )}
          </div>
        </aside>

        {/* Center — Question content + navigation */}
        <main className="flex-1 overflow-y-auto p-6">
          {question ? (
            <div className="bg-white rounded border border-gray-200 p-6 shadow-sm">
              {/* Question text */}
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap mb-6">
                {question.content}
              </p>

              {/* MCQ */}
              {question.type === 'MCQ' && question.options && (
                <div className="space-y-1">
                  {question.options.map((opt, idx) => {
                    const letter   = String.fromCharCode(97 + idx);
                    const selected = question.saved_answer === String(idx);
                    return (
                      <label
                        key={idx}
                        className="flex items-start gap-3 cursor-pointer rounded px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`q_${question.id}`}
                          checked={selected}
                          onChange={() => handleMCQ(idx)}
                          className="mt-0.5 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-800">
                          <span className="font-medium">{letter}.&nbsp;&nbsp;</span>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* True / False */}
              {question.type === 'TF' && (
                <div className="space-y-1">
                  {[['true', 'True'], ['false', 'False']].map(([val, label], idx) => (
                    <label
                      key={val}
                      className="flex items-center gap-3 cursor-pointer rounded px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name={`q_${question.id}`}
                        checked={question.saved_answer === val}
                        onChange={() => handleTF(val)}
                        className="accent-blue-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-800">
                        <span className="font-medium">{idx === 0 ? 'a' : 'b'}.&nbsp;&nbsp;</span>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {question.type === 'SA' && (
                <textarea
                  value={question.saved_answer || ''}
                  onChange={handleSA}
                  placeholder="Type your answer here…"
                  rows={5}
                  className="w-full mt-2 p-3 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
                />
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-24">No question loaded.</div>
          )}

          {/* Prev / Next navigation */}
          <div className="flex justify-between items-center mt-5">
            <button
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous page
            </button>
            <span className="text-xs text-gray-400">
              {currentIndex + 1} / {questions.length}
            </span>
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 border border-gray-300 rounded bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next page →
            </button>
          </div>
        </main>

        {/* Right — Exam Overview */}
        <aside className="w-52 shrink-0 bg-white border-l border-gray-200 flex flex-col p-4 overflow-y-auto">
          <h3 className="font-bold text-sm text-gray-800 pb-3 border-b border-gray-200 mb-3">
            Exam Overview
          </h3>

          {/* Question grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {questions.map((q, idx) => {
              const isCur      = idx === currentIndex;
              const answered   = q.saved_answer != null && q.saved_answer !== '';
              const flagged    = !!q.is_flagged;

              let cls = 'h-7 w-7 rounded text-[11px] font-bold border flex items-center justify-center cursor-pointer transition-colors ';
              if (isCur)         cls += 'bg-gray-700 text-white border-gray-700';
              else if (flagged)  cls += 'bg-amber-400 text-white border-amber-400';
              else if (answered) cls += 'bg-blue-600 text-white border-blue-600';
              else               cls += 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50';

              return (
                <button key={q.id} onClick={() => setCurrentIndex(idx)} className={cls}>
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 bg-blue-600 rounded border border-blue-600 shrink-0" />
              Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 bg-amber-400 rounded border border-amber-400 shrink-0" />
              Flagged for review
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 bg-white rounded border border-gray-300 shrink-0" />
              Not answered
            </div>
          </div>

          {/* Progress count */}
          <p className="text-xs text-gray-500 border-t border-gray-100 pt-3 mb-4">
            {answeredCount} of {questions.length} answered
          </p>

          {/* Submit */}
          <button
            onClick={handleManualSubmit}
            className="mt-auto w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded transition-colors"
          >
            Submit all and finish
          </button>
        </aside>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
        title="Submit Examination"
        message={confirmMsg}
        type="danger"
      />
    </div>
  );
}
