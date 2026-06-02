import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function Register() {
  const [name, setName]                           = useState('');
  const [username, setUsername]                   = useState('');
  const [email, setEmail]                         = useState('');
  const [password, setPassword]                   = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole]                           = useState('student');
  const { register } = useAuth();
  const toast        = useToast();
  const navigate     = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !email || !password || !passwordConfirmation) {
      toast.error('All fields are required.');
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const result = await register(name, username, email, password, passwordConfirmation, role);
    setSubmitting(false);
    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white text-center">Create Account</h2>
        <p className="mt-2 text-sm text-slate-400 text-center">Get started with our online exam platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="John Doe" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} placeholder="johndoe" autoComplete="username" required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="john@example.com" required />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Account Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all">
            <option value="student">Student / Examinee</option>
            <option value="instructor">Instructor / Teacher</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className={inputCls} placeholder="••••••••" required />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-2xl shadow-lg shadow-indigo-500/10 focus:outline-none transition-all flex items-center justify-center disabled:opacity-50">
          {submitting
            ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : 'Create Account'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Login here</Link>
        </p>
      </div>
    </div>
  );
}
