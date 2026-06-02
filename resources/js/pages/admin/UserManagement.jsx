import React, { useState, useEffect, useRef } from 'react';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import Badge from '../../components/UI/Badge';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { useToast } from '../../hooks/useToast';
import axios from '../../api/axios';

export default function UserManagement() {
  const toast = useToast();

  // ── List state ──────────────────────────────────────────────────────────────
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  // ── Create / Edit modal ─────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName]             = useState('');
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [role, setRole]             = useState('student');
  const [saving, setSaving]         = useState(false);

  // ── Delete confirm ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Group assignment modal ──────────────────────────────────────────────────
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupUser, setGroupUser]           = useState(null);
  const [allGroups, setAllGroups]           = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState(new Set());
  const [savingGroups, setSavingGroups]     = useState(false);

  // ── Bulk import ─────────────────────────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const importRef = useRef(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users', {
        params: { page: currentPage, search: search || undefined, role: roleFilter || undefined },
      });
      setUsers(res.data.data);
      setTotalPages(res.data.last_page);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [currentPage, roleFilter]);

  // ── Create / Edit ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingUser(null); setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('student');
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setName(user.name); setUsername(user.username || ''); setEmail(user.email);
    setPassword(''); setRole(user.roles[0]?.name || 'student');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, {
          name, username, email, role, password: password || undefined,
        });
        toast.success('User updated.');
      } else {
        await axios.post('/api/users', { name, username, email, password, role });
        toast.success('User created.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving user.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active / Delete ──────────────────────────────────────────────────

  const handleToggleActive = async (user) => {
    try {
      const res = await axios.post(`/api/users/${user.id}/toggle-active`);
      toast.success(res.data.is_active ? 'User activated.' : 'User deactivated.');
      fetchUsers();
    } catch {
      toast.error('Failed to change status.');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/users/${deleteTarget.id}`);
      toast.success('User deleted.');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user.');
    }
  };

  // ── Group assignment ────────────────────────────────────────────────────────

  const openGroups = async (user) => {
    setGroupUser(user);
    setGroupModalOpen(true);
    try {
      const [groupsRes, userRes] = await Promise.all([
        axios.get('/api/groups', { params: { per_page: 200 } }),
        axios.get(`/api/users/${user.id}`),
      ]);
      setAllGroups(groupsRes.data.data || groupsRes.data);
      const ids = (userRes.data.groups || []).map((g) => g.id);
      setSelectedGroupIds(new Set(ids));
    } catch {
      toast.error('Failed to load groups.');
    }
  };

  const toggleGroup = (id) =>
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSaveGroups = async () => {
    setSavingGroups(true);
    try {
      await axios.put(`/api/users/${groupUser.id}/groups`, { group_ids: [...selectedGroupIds] });
      toast.success('Group memberships updated.');
      setGroupModalOpen(false);
    } catch {
      toast.error('Failed to update groups.');
    } finally {
      setSavingGroups(false);
    }
  };

  // ── Bulk import ─────────────────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    try {
      const res = await axios.get('/api/users/import/template', { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', 'users_template.csv');
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template.');
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setImporting(true);
    try {
      const res = await axios.post('/api/users/import', formData);
      toast.success(res.data.message);
      if (res.data.errors?.length) {
        res.data.errors.forEach((err) => toast.error(err));
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const roleBadge = (r) => {
    const v = r === 'super_admin' ? 'danger' : r === 'instructor' ? 'warning' : 'info';
    return <Badge variant={v}>{r?.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm">Manage credentials, roles, and group memberships.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            ↓ Template
          </button>
          <label className={`px-3 py-2 text-xs font-semibold border border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            {importing ? 'Importing…' : '↑ Import CSV'}
            <input ref={importRef} type="file" accept=".csv,.txt" onChange={handleImportFile} className="hidden" />
          </label>
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search name, username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setCurrentPage(1), fetchUsers())}
            className="flex-1 min-w-0 px-4 py-2 border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button onClick={() => { setCurrentPage(1); fetchUsers(); }} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-semibold">
            Search
          </button>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 border rounded-xl bg-transparent text-sm focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        headers={['Name', 'Username', 'Email', 'Role', 'Status', 'Actions']}
        items={users}
        isLoading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        renderRow={(user) => (
          <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
            <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{user.name}</td>
            <td className="px-6 py-4 font-mono text-sm text-indigo-600 dark:text-indigo-400">{user.username || '—'}</td>
            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{user.email}</td>
            <td className="px-6 py-4">{roleBadge(user.roles[0]?.name)}</td>
            <td className="px-6 py-4">
              <button onClick={() => handleToggleActive(user)}>
                <Badge variant={user.is_active ? 'success' : 'neutral'}>
                  {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </button>
            </td>
            <td className="px-6 py-4 text-xs font-semibold space-x-2 whitespace-nowrap">
              <button onClick={() => openEdit(user)} className="text-indigo-600 hover:underline">Edit</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => openGroups(user)} className="text-emerald-600 hover:underline">Groups</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => setDeleteTarget(user)} className="text-rose-600 hover:underline">Delete</button>
            </td>
          </tr>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Create User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none font-mono" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none bg-transparent">
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Password {editingUser && <span className="text-slate-300">(leave blank to keep current)</span>}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none" required={!editingUser} />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm mt-2 disabled:opacity-50">
            {saving ? 'Saving…' : editingUser ? 'Update User' : 'Create User'}
          </button>
        </form>
      </Modal>

      {/* Group Assignment Modal */}
      <Modal isOpen={groupModalOpen} onClose={() => setGroupModalOpen(false)} title={`Groups — ${groupUser?.name ?? ''}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Check the groups this user should belong to.</p>
          <div className="max-h-64 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-1">
            {allGroups.length === 0
              ? <p className="text-sm text-slate-400 text-center py-4">No groups found.</p>
              : allGroups.map((g) => (
                <label key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                  <input type="checkbox" checked={selectedGroupIds.has(g.id)} onChange={() => toggleGroup(g.id)} className="rounded" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{g.name}</span>
                </label>
              ))}
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-slate-400">{selectedGroupIds.size} selected</span>
            <button onClick={handleSaveGroups} disabled={savingGroups} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl text-sm disabled:opacity-50">
              {savingGroups ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        type="danger"
      />
    </div>
  );
}
