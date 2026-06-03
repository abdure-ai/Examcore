import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from '../../api/axios';

export default function AssignExam() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const toast      = useToast();

  const [exam, setExam]         = useState(null);
  const [students, setStudents] = useState([]);
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds]     = useState([]);

  useEffect(() => { fetchData(); }, [examId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examRes, studentsRes, groupsRes] = await Promise.all([
        axios.get(`/api/exams/${examId}`),
        axios.get('/api/users', { params: { role: 'student', per_page: 1000 } }),
        axios.get('/api/groups', { params: { per_page: 1000, with_student_ids: true } }),
      ]);
      setExam(examRes.data);
      setStudents(studentsRes.data.data || []);
      setGroups(groupsRes.data.data || []);
      // Pre-select current assignments (now returned by show endpoint)
      setSelectedStudentIds((examRes.data.assigned_students || []).map((s) => s.id));
      setSelectedGroupIds((examRes.data.assigned_groups || []).map((g) => g.id));
    } catch {
      toast.error('Failed to load assignment data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id) =>
    setSelectedStudentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleGroup = (id) =>
    setSelectedGroupIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/api/exams/${examId}/assign`, {
        student_ids: selectedStudentIds,
        group_ids: selectedGroupIds,
      });
      toast.success('Exam assignments updated.');
      navigate('/exams');
    } catch {
      toast.error('Failed to save assignments.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // How many distinct students will actually gain access (direct + via groups)
  const reachCount = useMemo(() => {
    const ids = new Set(selectedStudentIds);
    groups.filter((g) => selectedGroupIds.includes(g.id))
      .forEach((g) => (g.students || []).forEach((s) => ids.add(s.id)));
    return ids.size;
  }, [selectedStudentIds, selectedGroupIds, groups]);

  if (loading || !exam) return <LoadingSkeleton count={2} height="h-32" />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Assign Exam</h1>
          <p className="text-slate-400 text-sm">
            Assigning: <span className="font-bold text-indigo-600 dark:text-indigo-400">{exam.title}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Selected</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {selectedGroupIds.length} group{selectedGroupIds.length !== 1 ? 's' : ''} ·&nbsp;
            {selectedStudentIds.length} direct student{selectedStudentIds.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Groups */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Class Cohorts (Groups)</h3>
            <p className="text-xs text-slate-400">All students in selected groups get access. Empty groups grant access to no one.</p>
          </div>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
            {groups.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No groups created yet.</p>
            )}
            {groups.map((group) => {
              const isChecked = selectedGroupIds.includes(group.id);
              const empty = (group.students_count ?? 0) === 0;
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
                    <input type="checkbox" checked={isChecked} onChange={() => toggleGroup(group.id)} className="rounded" />
                    <span>{group.name}</span>
                  </div>
                  {empty ? (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                      no students
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">{group.students_count} students</span>
                  )}
                </label>
              );
            })}
          </div>
          {selectedGroupIds.some((id) => (groups.find((g) => g.id === id)?.students_count ?? 0) === 0) && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              You selected an empty group. Add students to it first, or assign them directly →
            </p>
          )}
        </div>

        {/* Individual students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Individual Students</h3>
              <p className="text-xs text-slate-400">Select specific students to assign directly.</p>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap mt-1">{students.length} total</span>
          </div>

          {/* search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search students…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
            {filteredStudents.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                {studentSearch ? 'No students match your search.' : 'No students found.'}
              </p>
            )}
            {filteredStudents.map((student) => {
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
                  <input type="checkbox" checked={isChecked} onChange={() => toggleStudent(student.id)} className="rounded" />
                  <div className="text-left min-w-0">
                    <p className="font-semibold truncate">{student.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="lg:col-span-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 flex-wrap">
          <p className="text-sm text-slate-500">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{reachCount}</span> student{reachCount !== 1 ? 's' : ''} will have access in total
          </p>
          <div className="flex gap-3">
            <Link to="/exams" className="px-4 py-2 border rounded-xl font-semibold text-sm">Cancel</Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Assignments'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
