import { create } from 'zustand';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_refresh_token', refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    const { refreshToken } = get();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (err) {
        console.error('Failed to log out from backend:', err);
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('auth_refresh_token');
      const userStr = localStorage.getItem('auth_user');
      if (token && refreshToken && userStr) {
        set({
          token,
          refreshToken,
          user: JSON.parse(userStr) as User,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Error restoring user auth state:', e);
      set({ isLoading: false });
    }
  },
}));
