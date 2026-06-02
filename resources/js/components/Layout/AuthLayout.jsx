import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
            <span className="text-2xl font-black tracking-tight text-white">
              EXAM<span className="text-indigo-400">CORE</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white/10 backdrop-blur-lg px-6 py-8 shadow-2xl rounded-3xl border border-white/20 sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
