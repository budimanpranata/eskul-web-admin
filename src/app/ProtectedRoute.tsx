import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { isAdminRole, useAuthStore } from '@/stores/authStore';

/**
 * Guard area admin: butuh sesi aktif DAN role ADMIN.
 * (Backend juga menegakkan RBAC di setiap endpoint /admin/*.)
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) return <Navigate to="/login" replace />;
  if (user && !isAdminRole(user.role)) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-center text-slate-600 dark:text-slate-300">
        Akun ini bukan Administrator. Web Admin hanya untuk role ADMIN.
      </div>
    );
  }
  return <>{children}</>;
}
