import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';
import { fmtDate } from '../../utils/date';

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();

  // Modal & Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [passingScore, setPassingScore] = useState(70);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [status, setStatus] = useState('draft');
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [allowReview, setAllowReview] = useState(true);
  const [passcode, setPasscode] = useState('');

  useEffect(() => {
    fetchExams();
  }, [currentPage]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/exams', { params: { page: currentPage } });
      setExams(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      toast.error('Failed to load exams.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingExam(null);
    setTitle('');
    setDescription('');
    setDuration(60);
    setPassingScore(70);
    setStartAt('');
    setEndAt('');
    setMaxAttempts(1);
    setStatus('draft');
    setRandomizeQuestions(true);
    setRandomizeOptions(false);
    setAllowReview(true);
    setPasscode('');
    setModalOpen(true);
  };

  const handleOpenEdit = async (exam) => {
    // Fetch full exam details so the passcode (hidden from list) is pre-filled
    let full = exam;
    try {
      const res = await axios.get(`/api/exams/${exam.id}`);
      full = res.data;
    } catch { /* fall back to list data */ }

    setEditingExam(full);
    setTitle(full.title);
    setDescription(full.description || '');
    setDuration(full.duration_minutes);
    setPassingScore(full.passing_score);
    setStartAt(full.start_at ? full.start_at.substring(0, 16) : '');
    setEndAt(full.end_at ? full.end_at.substring(0, 16) : '');
    setMaxAttempts(full.max_attempts);
    setStatus(full.status);
    setRandomizeQuestions(full.settings?.randomize_questions ?? true);
    setRandomizeOptions(full.settings?.randomize_options ?? false);
    setAllowReview(full.settings?.allow_review ?? true);
    setPasscode(full.passcode ?? '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      duration_minutes: duration,
      passing_score: passingScore,
      start_at: startAt,
      end_at: endAt,
      max_attempts: maxAttempts,
      status,
      settings: {
        randomize_questions: randomizeQuestions,
        randomize_options: randomizeOptions,
        allow_review: allowReview,
      },
      // Only include passcode when editing if a value was typed;
      // omitting it leaves the existing passcode unchanged (backend uses 'sometimes').
      // When creating, always send it (null = no passcode).
      ...(editingExam
        ? (passcode !== '' ? { passcode: passcode } : {})
        : { passcode: passcode || null }),
    };

    try {
      if (editingExam) {
        await axios.put(`/api/exams/${editingExam.id}`, payload);
        toast.success('Exam details updated.');
      } else {
        await axios.post('/api/exams', payload);
        toast.success('New exam created.');
      }
      setModalOpen(false);
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving exam data.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam? All associated student records will be removed.')) return;
    try {
      await axios.delete(`/api/exams/${id}`);
      toast.success('Exam deleted.');
      fetchExams();
    } catch (error) {
      toast.error('Failed to delete exam.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Exams</h1>
          <p className="text-slate-400 text-sm">Author, edit, schedule, and assign assessment criteria.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Exam
        </button>
      </div>

      <DataTable
        headers={['Exam Title', 'Duration', 'Passing Mark', 'Window', 'Status', 'Actions']}
        items={exams}
        isLoading={loading}
        renderRow={(exam) => (
          <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">{exam.title}</p>
                {exam.has_passcode && (
                  <span title="Passcode protected" className="text-amber-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Slug: {exam.slug}</span>
            </td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{exam.duration_minutes} mins</td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{exam.passing_score}%</td>
            <td className="px-6 py-4 text-slate-400 text-xs leading-relaxed">
              Start: {fmtDate(exam.start_at)}
              <br />
              End: {fmtDate(exam.end_at)}
            </td>
            <td className="px-6 py-4">
              <Badge variant={exam.status === 'published' ? 'success' : 'neutral'}>
                {exam.status.toUpperCase()}
              </Badge>
            </td>
            <td className="px-6 py-4 text-xs font-semibold space-x-2">
              <button onClick={() => handleOpenEdit(exam)} className="text-indigo-600 hover:underline">
                Edit
              </button>
              <span className="text-slate-350">|</span>
              <Link to={`/exams/${exam.id}/questions`} className="text-emerald-600 hover:underline">
                Questions ({exam.questions_count})
              </Link>
              <span className="text-slate-350">|</span>
              <Link to={`/exams/${exam.id}/assign`} className="text-amber-600 hover:underline">
                Assign
              </Link>
              <span className="text-slate-350">|</span>
              <Link to={`/exams/${exam.id}/import`} className="text-sky-600 hover:underline">
                Import
              </Link>
              <span className="text-slate-350">|</span>
              <button onClick={() => handleDelete(exam.id)} className="text-rose-600 hover:underline">
                Delete
              </button>
            </td>
          </tr>
        )}
      />

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingExam ? 'Modify Exam' : 'Create Exam'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Passing score (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none animate-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Start Window</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">End Window</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Max Attempts</label>
              <input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none bg-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wide">Anti-Cheat / Rules Config</h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                />
                Randomize Question Order
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={randomizeOptions}
                  onChange={(e) => setRandomizeOptions(e.target.checked)}
                />
                Randomize Options (MCQ only)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={allowReview}
                  onChange={(e) => setAllowReview(e.target.checked)}
                />
                Allow Students to Review Answers After Submission
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Exam Passcode
              <span className="text-slate-300 font-normal normal-case ml-1">
                {editingExam
                  ? '(leave blank to keep current; type new value to change)'
                  : '(optional — leave blank for open access)'}
              </span>
            </label>
            {editingExam && editingExam.has_passcode && !passcode && (
              <p className="text-xs text-amber-600 mb-1.5 flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Passcode is currently set. Leave blank to keep it unchanged.
              </p>
            )}
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              maxLength={20}
              placeholder={editingExam?.has_passcode ? '••••••• (keep current)' : 'e.g. BIO2026'}
              className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none font-mono tracking-widest"
            />
            {passcode && (
              <p className="text-xs text-amber-500 mt-1">Students must enter this code before starting.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm mt-4"
          >
            Save Exam Details
          </button>
        </form>
      </Modal>
    </div>
  );
}
