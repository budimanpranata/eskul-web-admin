import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Client state autentikasi (Zustand).
 * Menyimpan token & identitas ringkas user yang login.
 *
 * FASE 0: kerangka. Aksi login/logout diisi di Fase 1.1 (memanggil POST /auth/login).
 * Catatan keamanan: penyimpanan token final akan ditinjau di Fase 4 (httpOnly cookie
 * vs storage) — untuk sekarang persist ke localStorage sebagai placeholder dev.
 */
export interface AuthUser {
  id: string;
  fullName: string;
  role: 'ADMIN' | 'PEMBINA' | 'ORANGTUA';
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: () => boolean;
  setSession: (payload: { accessToken: string; user: AuthUser }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: () => Boolean(get().accessToken),
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
    }),
    { name: 'eskul-admin-auth' },
  ),
);
