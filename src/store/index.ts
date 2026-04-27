import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Family } from '../types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'auth-storage' }
  )
);

interface FamilyState {
  currentFamily: Family | null;
  setCurrentFamily: (family: Family | null) => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      currentFamily: null,
      setCurrentFamily: (family) => set({ currentFamily: family }),
    }),
    { name: 'family-storage' }
  )
);
