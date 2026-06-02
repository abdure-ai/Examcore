import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import { useToast } from '../../hooks/useToast';
import axios from '../../api/axios';

export default function Groups() {
  const toast = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Create / edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Assign-students modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignGroup, setAssignGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [assigning, setAssigning] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/groups', { params: { page: currentPage, search } });
      setGroups(res.data.data);
      setTotalPages(res.data.last_page);
    } catch {
      toast.error('Failed to load groups.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // ── Form modal ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingGroup(null);
    setName('');
    setDescription('');
    setFormOpen(true);
  };

  const openEdit = (group) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description ?? '');
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingGroup) {
        await axios.put(`/api/groups/${editingGroup.id}`, { name, description });
        toast.success('Group updated.');
      } else {
        await axios.post('/api/groups', { name, description });
        toast.success('Group created.');
      }
      setFormOpen(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this group? Students will be unlinked.')) return;
    try {
      await axios.delete(`/api/groups/${id}`);
      toast.success('Group deleted.');
      fetchGroups();
    } catch {
      toast.error('Failed to delete group.');
    }
  };

  // ── Assign-students modal ─────────────────────────────────────────────────

  const openAssign = async (group) => {
    setAssignGroup(group);
    setAssignOpen(true);
    try {
      const [studentsRes, groupRes] = await Promise.all([
        axios.get('/api/users', { params: { role: 'student', per_page: 200 } }),
        axios.get(`/api/groups/${group.id}`),
      ]);
      setStudents(studentsRes.data.data);
      setSelectedIds(new Set(groupRes.data.students.map((s) => s.id)));
    } catch {
      toast.error('Failed to load students.');
    }
  };

  const toggleStudent = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await axios.post(`/api/groups/${assignGroup.id}/assign`, {
        student_ids: [...selectedIds],
      });
      toast.success('Students updated.');
      setAssignOpen(false);
      fetchGroups();
    } catch {
      toast.error('Failed to assign students.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Groups</h1>
          <p className="text-slate-400 text-sm">Organise students into cohorts and assign exams in bulk.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Group
        </button>
      </div>

      {/* Search */}
      <div className="max-w-xs">
        <input
          type="text"
          placeholder="Search groups…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
        />
      </div>

      {/* Table */}
      <DataTable
        headers={['Group Name', 'Description', 'Students', 'Actions']}
        items={groups}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        renderRow={(group) => (
          <tr key={group.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{group.name}</td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm max-w-xs truncate">
              {group.description || <span className="italic text-slate-300">—</span>}
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {group.students_count ?? 0}
              </span>
            </td>
            <td className="px-6 py-4 text-xs font-semibold space-x-2">
              <button onClick={() => openAssign(group)} className="text-indigo-600 hover:underline">
                Manage Students
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => openEdit(group)} className="text-amber-600 hover:underline">
                Edit
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => handleDelete(group.id)} className="text-rose-600 hover:underline">
                Delete
              </button>
            </td>
          </tr>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingGroup ? 'Edit Group' : 'New Group'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Optional description…"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm"
          >
            {saving ? 'Saving…' : editingGroup ? 'Update Group' : 'Create Group'}
          </button>
        </form>
      </Modal>

      {/* Assign Students Modal */}
      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title={`Students — ${assignGroup?.name ?? ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Check the students you want in this group. Unchecking removes them.
          </p>
          <div className="max-h-72 overflow-y-auto space-y-1 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
            {students.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No students found.</p>
            ) : (
              students.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{s.email}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-slate-400">{selectedIds.size} selected</span>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl text-sm"
            >
              {assigning ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
