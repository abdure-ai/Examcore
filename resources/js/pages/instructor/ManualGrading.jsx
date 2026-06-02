import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Badge from '../../components/UI/Badge';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

export default function ManualGrading() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Graded state holds temporary marks/is_correct for inputs
  const [gradingState, setGradingState] = useState({});

  useEffect(() => {
    fetchResultDetails();
  }, [resultId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/results/${resultId}`);
      setResult(response.data.result);
      setAnswers(response.data.answers || []);

      // Populate grading inputs from existing data
      const initialGrading = {};
      response.data.answers?.forEach((ans) => {
        if (ans.question.type === 'SA') {
          initialGrading[ans.id] = {
            marks_awarded: ans.marks_awarded || 0,
            is_correct: ans.is_correct ?? false,
          };
        }
      });
      setGradingState(initialGrading);
    } catch (error) {
      toast.error('Failed to load result attempt details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGradingChange = (answerId, field, value) => {
    setGradingState((prev) => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value
      }
    }));
  };

  const handleGradeSubmit = async (answerId) => {
    const payload = gradingState[answerId];
    try {
      await axios.post(`/api/answers/${answerId}/grade`, payload);
      toast.success('Question graded successfully.');
      fetchResultDetails(); // reload to get new totals
    } catch (error) {
      toast.error('Failed to save grade.');
    }
  };

  if (loading || !result) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Grade Review & Assessment</h1>
          <p className="text-slate-400 text-sm">
            Examinee: <span className="font-bold text-slate-800 dark:text-slate-200">{result.user?.name}</span> ({result.user?.email})
          </p>
        </div>
        <Link
          to="/results"
          className="border border-slate-350 dark:border-slate-800 font-semibold py-2 px-4 rounded-xl text-sm"
        >
          Back to list
        </Link>
      </div>

      {/* Attempt Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Exam Title</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{result.exam?.title}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Attempt Details</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Attempt #{result.session?.attempt_number}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">IP & Security Flags</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {result.session?.tab_switches} Tab Switches detected
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Current Score</p>
          <p className="text-lg font-black text-slate-800 dark:text-slate-200">
            {result.total_marks} / {result.max_marks} ({result.percentage}%)
          </p>
          <Badge variant={result.passed ? 'success' : 'danger'}>
            {result.passed ? 'PASSED' : 'FAILED'}
          </Badge>
        </div>
      </div>

      {/* Answers list */}
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Answer sheet responses</h3>
        
        {answers.map((ans, index) => {
          const q = ans.question;
          const isSA = q.type === 'SA';

          return (
            <div
              key={ans.id}
              className={`border rounded-3xl p-6 shadow-sm bg-white dark:bg-slate-900 ${
                isSA && ans.is_correct === null
                  ? 'border-amber-400 dark:border-amber-700/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <Badge variant={q.type === 'MCQ' ? 'info' : q.type === 'TF' ? 'warning' : 'neutral'}>
                    {q.type}
                  </Badge>
                </div>
                <div>
                  {isSA ? (
                    <Badge variant={ans.is_correct === null ? 'warning' : ans.is_correct ? 'success' : 'danger'}>
                      {ans.is_correct === null ? 'PENDING MANUAL REVIEW' : `GRADED: ${ans.marks_awarded}/${q.marks} PTS`}
                    </Badge>
                  ) : (
                    <Badge variant={ans.is_correct ? 'success' : 'danger'}>
                      {ans.is_correct ? `CORRECT: +${q.marks} PTS` : 'INCORRECT: +0 PTS'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <div className="text-slate-800 dark:text-slate-200 font-medium mb-4">{q.content}</div>

              {/* Student's answer */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 text-sm mb-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Student Answer:</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {ans.answer === null || ans.answer === '' ? (
                    <span className="text-rose-500 italic">No answer submitted</span>
                  ) : (
                    ans.answer
                  )}
                </p>
              </div>

              {/* Correct answer (MCQ/TF) */}
              {!isSA && (
                <div className="text-xs text-slate-500">
                  Correct Option Key: <span className="font-bold text-emerald-500">{q.correct_answer}</span>
                </div>
              )}

              {/* Manual short answer grading inputs */}
              {isSA && gradingState[ans.id] && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">Award Marks (Max: {q.marks})</label>
                      <input
                        type="number"
                        min="0"
                        max={q.marks}
                        value={gradingState[ans.id].marks_awarded}
                        onChange={(e) => handleGradingChange(ans.id, 'marks_awarded', Number(e.target.value))}
                        className="w-24 px-3 py-1 border rounded-lg text-sm bg-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">Mark Result</label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <input
                            type="radio"
                            checked={gradingState[ans.id].is_correct === true}
                            onChange={() => handleGradingChange(ans.id, 'is_correct', true)}
                          />
                          Correct
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <input
                            type="radio"
                            checked={gradingState[ans.id].is_correct === false}
                            onChange={() => handleGradingChange(ans.id, 'is_correct', false)}
                          />
                          Incorrect
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGradeSubmit(ans.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-4 rounded-xl text-xs shadow"
                  >
                    Apply Grade
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
