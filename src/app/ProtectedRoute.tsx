import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';

/**
 * Guard rute untuk area admin.
 * FASE 0: hanya cek keberadaan token di store. Validasi role ADMIN + refresh
 * token + redirect MFA ditambahkan di Fase 1.1 / 4.2.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  // FASE 0: bypass sementara agar UI bisa ditinjau tanpa backend auth.
  const BYPASS_AUTH = import.meta.env.DEV;

  if (!isAuthenticated && !BYPASS_AUTH) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
