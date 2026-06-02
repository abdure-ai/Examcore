import { create } from 'zustand';

export const useUiStore = create((set) => ({
  darkMode: localStorage.getItem('theme') === 'dark',
  sidebarOpen: true,
  toasts: [],

  toggleDarkMode: () => set((state) => {
    const nextMode = !state.darkMode;
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    return { darkMode: nextMode };
  }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  addToast: (message, type = 'success') => set((state) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const duration = type === 'error' ? 6000 : 4000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
    return { toasts: [...state.toasts, { id, message, type }] };
  }),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}));
