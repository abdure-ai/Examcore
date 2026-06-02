import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, fetchUser, login, register, logout } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  return {
    user,
    role: user?.role || null,
    isAuthenticated,
    isLoading: isLoading && token && !user,
    login,
    register,
    logout,
    hasRole: (roles) => {
      if (!user) return false;
      const arrayRoles = Array.isArray(roles) ? roles : [roles];
      return arrayRoles.includes(user.role);
    }
  };
};
