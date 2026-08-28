import axios from 'axios';

/**
 * Klien HTTP terpusat untuk backend eskul.
 * Base URL default relatif ("/api/v1") → di-proxy oleh Vite ke backend saat dev
 * (lihat vite.config.ts), dan di-serve dari domain yang sama saat production.
 *
 * FASE 0: hanya instance dasar. Interceptor auth (inject Bearer token,
 * auto-refresh saat 401) ditambahkan di Fase 1.1.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15_000,
});
