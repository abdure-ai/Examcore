import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DataTable from '../../components/UI/DataTable';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

export default function AssignExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selected state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const examRes = await axios.get(`/api/exams/${examId}`);
      setExam(examRes.data);

      // Load all students and cohorts
      const studentsRes = await axios.get('/api/users', { params: { role: 'student', paginate: 100 } });
      setStudents(studentsRes.data.data || []);

      const groupsRes = await axios.get('/api/groups', { params: { paginate: 100 } });
      setGroups(groupsRes.data.data || []);

      // Preset currently assigned
      setSelectedStudentIds(examRes.data.assigned_students?.map((s) => s.id) || []);
      setSelectedGroupIds(examRes.data.assigned_groups?.map((g) => g.id) || []);
    } catch (error) {
      toast.error('Failed to load assignments data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleToggleGroup = (id) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/api/exams/${examId}/assign`, {
        student_ids: selectedStudentIds,
        group_ids: selectedGroupIds
      });
      toast.success('Exam assignments updated successfully.');
      navigate('/exams');
    } catch (error) {
      toast.error('Failed to assign exam.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam) {
    return <LoadingSkeleton count={2} height="h-32" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Assign Exam</h1>
        <p className="text-slate-400 text-sm">Assign: <span className="font-bold text-indigo-600 dark:text-indigo-400">{exam.title}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort (Group) Assignment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Class Cohorts (Groups)</h3>
            <p className="text-xs text-slate-400">All students in selected groups will have access to the exam.</p>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {groups.map((group) => {
              const isChecked = selectedGroupIds.includes(group.id);
              return (
                <label
                  key={group.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border text-sm font-medium cursor-pointer transition-all ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleGroup(group.id)}
                      className="rounded"
                    />
                    <span>{group.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">({group.students_count} students)</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Individual Student Assignment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Individual Students</h3>
            <p className="text-xs text-slate-400">Select specific students to assign directly.</p>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {students.map((student) => {
              const isChecked = selectedStudentIds.includes(student.id);
              return (
                <label
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-sm font-medium cursor-pointer transition-all ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleStudent(student.id)}
                    className="rounded"
                  />
                  <div className="text-left">
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-[10px] text-slate-400">{student.email}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="lg:col-span-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Link
            to="/exams"
            className="px-4 py-2 border rounded-xl font-semibold text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm disabled:opacity-50"
          >
            {submitting ? 'Saving Assignments...' : 'Save Assignments'}
          </button>
        </div>
      </form>
    </div>
  );
}
