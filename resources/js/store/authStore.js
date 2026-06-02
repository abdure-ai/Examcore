import { create } from 'zustand';
import axios from 'axios';

// Get initial token from localStorage
const initialToken = localStorage.getItem('auth_token') || null;
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export const useAuthStore = create((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: true,

  fetchUser: async () => {
    if (!localStorage.getItem('auth_token')) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      set({ isLoading: true });
      const response = await axios.get('/api/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, token: null, isLoading: false });
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await axios.post('/api/login', { username, password });
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  },

  register: async (name, username, email, password, password_confirmation, role = 'student') => {
    set({ isLoading: true });
    try {
      const response = await axios.post('/api/register', {
        name,
        username,
        email,
        password,
        password_confirmation,
        role,
      });
      const { token, user } = response.data;

      localStorage.setItem('auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  },

  logout: async () => {
    try {
      await axios.post('/api/logout');
    } catch (error) {
      // ignore
    } finally {
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
