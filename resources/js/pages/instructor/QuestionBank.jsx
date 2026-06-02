import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

export default function QuestionBank() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Modal and Form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [type, setType] = useState('MCQ');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState('');

  // MCQ specific options state
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('0');

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  const fetchExamAndQuestions = async () => {
    try {
      setLoading(true);
      const examRes = await axios.get(`/api/exams/${examId}`);
      setExam(examRes.data);
      const questionsRes = await axios.get(`/api/exams/${examId}/questions`);
      setQuestions(questionsRes.data);
    } catch (error) {
      toast.error('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setType('MCQ');
    setCategory('General');
    setContent('');
    setDifficulty('medium');
    setMarks(1);
    setExplanation('');
    setOptions(['', '', '', '']);
    setCorrectAnswer('0');
    setModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setType(q.type);
    setCategory(q.category || 'General');
    setContent(q.content);
    setDifficulty(q.difficulty);
    setMarks(q.marks);
    setExplanation(q.explanation || '');
    setOptions(q.options || ['', '', '', '']);
    setCorrectAnswer(q.correct_answer || '0');
    setModalOpen(true);
  };

  const handleOptionChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      type,
      category,
      content,
      difficulty,
      marks,
      explanation,
      options: type === 'MCQ' ? options.filter(Boolean) : null,
      correct_answer: type === 'SA' ? null : correctAnswer
    };

    try {
      if (editingQuestion) {
        await axios.put(`/api/exams/${examId}/questions/${editingQuestion.id}`, payload);
        toast.success('Question updated.');
      } else {
        await axios.post(`/api/exams/${examId}/questions`, payload);
        toast.success('Question added to bank.');
      }
      setModalOpen(false);
      fetchExamAndQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error occurred while saving question.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await axios.delete(`/api/exams/${examId}/questions/${id}`);
      toast.success('Question deleted.');
      fetchExamAndQuestions();
    } catch (error) {
      toast.error('Failed to delete question.');
    }
  };

  if (loading || !exam) {
    return <LoadingSkeleton count={3} height="h-24" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Question Bank</h1>
          <p className="text-slate-400 text-sm">Exam Title: <span className="font-bold text-indigo-600 dark:text-indigo-400">{exam.title}</span></p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/exams/${examId}/import`}
            className="border border-slate-350 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm"
          >
            Import CSV
          </Link>
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm flex items-center gap-2"
          >
            Add Question
          </button>
        </div>
      </div>

      <DataTable
        headers={['Type', 'Content / Question Body', 'Category', 'Marks', 'Difficulty', 'Actions']}
        items={questions}
        isLoading={loading}
        renderRow={(q, idx) => (
          <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
            <td className="px-6 py-4">
              <Badge variant={q.type === 'MCQ' ? 'info' : q.type === 'TF' ? 'warning' : 'neutral'}>
                {q.type}
              </Badge>
            </td>
            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 max-w-lg truncate">
              {q.content}
            </td>
            <td className="px-6 py-4 text-slate-500 text-sm">{q.category || 'General'}</td>
            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-sm">{q.marks} pts</td>
            <td className="px-6 py-4">
              <Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'}>
                {q.difficulty.toUpperCase()}
              </Badge>
            </td>
            <td className="px-6 py-4 space-x-2 text-xs font-semibold">
              <button onClick={() => handleOpenEdit(q)} className="text-indigo-600 hover:underline">
                Edit
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => handleDelete(q.id)} className="text-rose-600 hover:underline">
                Delete
              </button>
            </td>
          </tr>
        )}
      />

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingQuestion ? 'Edit Question' : 'Add Question'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setCorrectAnswer(e.target.value === 'TF' ? 'true' : '0');
                }}
                className="w-full px-4 py-2 border rounded-xl text-sm bg-transparent"
              >
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="TF">True / False</option>
                <option value="SA">Short Answer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Question Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none min-h-[80px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl text-sm bg-transparent"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Marks</label>
              <input
                type="number"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          {/* MCQ Options Config */}
          {type === 'MCQ' && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Options List</label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-slate-400">{String.fromCharCode(65 + i)}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 px-4 py-1.5 border rounded-xl text-sm focus:outline-none"
                    placeholder={`Option ${i + 1}`}
                    required
                  />
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={correctAnswer === String(i)}
                    onChange={() => setCorrectAnswer(String(i))}
                  />
                  <span className="text-[10px] text-slate-400">Correct</span>
                </div>
              ))}
            </div>
          )}

          {/* True / False Option Config */}
          {type === 'TF' && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Correct Answer</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="radio"
                    name="correct_tf"
                    checked={correctAnswer === 'true'}
                    onChange={() => setCorrectAnswer('true')}
                  />
                  True
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="radio"
                    name="correct_tf"
                    checked={correctAnswer === 'false'}
                    onChange={() => setCorrectAnswer('false')}
                  />
                  False
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Explanation (optional)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none min-h-[60px]"
              placeholder="Detailed answer reasoning..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm mt-4"
          >
            Save Question
          </button>
        </form>
      </Modal>
    </div>
  );
}
