import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { isAdminRole, useAuthStore } from '@/stores/authStore';

/**
 * Guard area admin: butuh sesi aktif + role admin (ADMIN / ADMIN_SUPER).
 * Bila `mfaSetupRequired`, semua rute dialihkan ke `/security/mfa-setup`
 * kecuali rute yang men-set `allowMfaPending` (Fase 4.2).
 * (Backend juga menegakkan RBAC + kebijakan MFA di setiap endpoint.)
 */
export function ProtectedRoute({
  children,
  allowMfaPending = false,
}: {
  children: ReactNode;
  allowMfaPending?: boolean;
}) {
  const { accessToken, user, mfaSetupRequired } = useAuthStore();

  if (!accessToken) return <Navigate to="/login" replace />;
  if (user && !isAdminRole(user.role)) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-center text-slate-600 dark:text-slate-300">
        Akun ini bukan Administrator. Web Admin hanya untuk role ADMIN.
      </div>
    );
  }
  if (mfaSetupRequired && !allowMfaPending) {
    return <Navigate to="/security/mfa-setup" replace />;
  }
  return <>{children}</>;
}
