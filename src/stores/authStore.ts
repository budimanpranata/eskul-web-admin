import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN_SUPER' | 'ADMIN' | 'PEMBINA' | 'ORANGTUA';

export interface AuthUser {
  id: string;
  fullName: string;
  role: UserRole;
}

/** Role yang boleh masuk Web Admin (ADMIN_SUPER = ADMIN + akses audit log). */
export const isAdminRole = (role?: UserRole): boolean =>
  role === 'ADMIN' || role === 'ADMIN_SUPER';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: () => boolean;
  setSession: (p: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  clearSession: () => void;
}

/**
 * Client state autentikasi (Zustand + persist).
 *
 * Catatan keamanan: menyimpan token di localStorage adalah kompromi dev.
 * Peninjauan httpOnly cookie vs storage dijadwalkan di Fase 4.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: () => Boolean(get().accessToken),
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'eskul-admin-auth' },
  ),
);
