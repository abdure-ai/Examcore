import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword]  = useState('');
  const { login }   = useAuth();
  const toast       = useToast();
  const navigate    = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);
    if (result.success) {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white text-center">Welcome Back</h2>
        <p className="mt-2 text-sm text-slate-400 text-center">Sign in to access your exam dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
            placeholder="your_username"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-indigo-500/10 focus:outline-none transition-all flex items-center justify-center disabled:opacity-50"
        >
          {submitting
            ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : 'Sign In'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
