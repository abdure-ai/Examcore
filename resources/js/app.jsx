import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';
import { useAuthStore } from './store/authStore';

// Initialize Theme
const isDark = localStorage.getItem('theme') === 'dark' || 
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

if (isDark) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Render React App
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  // Fetch logged in user details if token exists
  const token = localStorage.getItem('auth_token');
  if (token) {
    useAuthStore.getState().fetchUser();
  }

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </React.StrictMode>
  );
}
