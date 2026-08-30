import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/authStore';

/**
 * Klien HTTP terpusat untuk backend eskul.
 * - Menyisipkan `Authorization: Bearer <accessToken>` dari authStore.
 * - Pada 401, mencoba `POST /auth/refresh` sekali; bila gagal → bersihkan sesi.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) {
    clearSession();
    return null;
  }
  try {
    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
    return data.accessToken as string;
  } catch {
    clearSession();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    // Kebijakan MFA (Fase 4.2): admin belum setup MFA → arahkan ke halaman setup.
    if (
      status === 403 &&
      (error.response?.data as { error?: string } | undefined)?.error === 'MFA_SETUP_REQUIRED'
    ) {
      useAuthStore.setState({ mfaSetupRequired: true });
      if (!window.location.pathname.startsWith('/security/mfa-setup')) {
        window.location.assign('/security/mfa-setup');
      }
      return Promise.reject(error);
    }

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing ??= runRefresh().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Ekstrak pesan error backend.
 * - HttpException biasa: `{ message: string | string[] }`
 * - Error validasi: `{ error: 'VALIDATION_ERROR', details: [{ field, message }] }`
 */
export function apiErrorMessage(err: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data?.error === 'VALIDATION_ERROR' && Array.isArray(data.details)) {
      return data.details
        .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
        .join('\n');
    }
    const m = data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return fallback;
}
