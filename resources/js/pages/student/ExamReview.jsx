import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Badge from '../../components/UI/Badge';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

export default function ExamReview() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchResultDetails();
  }, [resultId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/results/${resultId}`);
      setResult(response.data.result);
      setAnswers(response.data.answers || []);
    } catch (error) {
      toast.error('Failed to load exam review.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !result) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  // If review is disabled, display a banner
  if (answers.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="text-amber-500 font-bold text-lg">Review Disabled</div>
        <p className="text-slate-400 text-sm">
          The instructor has disabled detailed answer review for the exam: <strong>{result.exam?.title}</strong>.
        </p>
        <Link to="/dashboard" className="inline-block bg-indigo-650 text-white px-4 py-2 rounded-xl text-xs">
          Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Exam Review</h1>
          <p className="text-slate-400 text-sm">Reviewing attempt: <span className="font-bold text-indigo-600">{result.exam?.title}</span></p>
        </div>
        <Link
          to="/dashboard"
          className="border border-slate-350 dark:border-slate-800 font-semibold py-2 px-4 rounded-xl text-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Grading Status</p>
          <Badge variant={result.passed ? 'success' : 'danger'}>
            {result.passed ? 'PASSED' : 'FAILED'}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Percentage Score</p>
          <p className="text-lg font-black text-slate-800 dark:text-slate-200">{result.percentage}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Marks Earned</p>
          <p className="text-lg font-black text-slate-800 dark:text-slate-200">
            {result.total_marks} / {result.max_marks} Points
          </p>
        </div>
      </div>

      {/* Answers List */}
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Question Responses</h3>

        {answers.map((ans, idx) => {
          const q = ans.question;
          const isSA = q.type === 'SA';

          return (
            <div
              key={ans.id}
              className={`border rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-sm ${
                ans.is_correct ? 'border-emerald-250 dark:border-emerald-800/40' : 'border-rose-250 dark:border-rose-800/40'
              }`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                <span className="font-bold text-sm text-slate-700 dark:text-slate-350">
                  Question {idx + 1}
                </span>
                <Badge variant={ans.is_correct ? 'success' : 'danger'}>
                  {ans.is_correct ? `Correct (+${q.marks} pts)` : `Incorrect (+0 pts)`}
                </Badge>
              </div>

              {/* Question Body */}
              <div className="text-slate-800 dark:text-slate-200 font-medium mb-4">{q.content}</div>

              {/* Student Answer */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 text-sm mb-4">
                <p className="text-[10px] text-slate-450 uppercase tracking-wider font-bold mb-1">Your Answer:</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {ans.answer === null || ans.answer === '' ? (
                    <span className="text-rose-500 italic">No answer submitted</span>
                  ) : (
                    ans.answer
                  )}
                </p>
              </div>

              {/* Correct answer key for MCQ/TF */}
              {!isSA && !ans.is_correct && (
                <div className="text-xs text-slate-500 mb-2">
                  Correct Answer: <span className="font-bold text-emerald-500">{q.correct_answer}</span>
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="text-xs bg-slate-50/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500">
                  <span className="font-bold text-indigo-500">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
