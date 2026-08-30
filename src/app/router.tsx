import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuditLogsPage } from '@/features/audit-logs/AuditLogsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { CoachesPage } from '@/features/coaches/CoachesPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ExtracurricularsPage } from '@/features/extracurriculars/ExtracurricularsPage';
import { ParentRelationsPage } from '@/features/parent-relations/ParentRelationsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { MfaSetupPage } from '@/features/security/MfaSetupPage';
import { SecurityPage } from '@/features/security/SecurityPage';
import { QrCardsPage } from '@/features/students/QrCardsPage';
import { StudentsPage } from '@/features/students/StudentsPage';
import { ProtectedRoute } from './ProtectedRoute';

// Halaman analitik memuat recharts — dipisah ke chunk sendiri agar bundle utama ringan.
// eslint-disable-next-line react/only-export-components
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Halaman cetak — tanpa sidebar agar bersih saat di-print.
    path: '/students/qr-print',
    element: (
      <ProtectedRoute>
        <div className="min-h-full bg-white p-6">
          <QrCardsPage />
        </div>
      </ProtectedRoute>
    ),
  },
  {
    // Setup MFA — tanpa sidebar; boleh diakses walau MFA masih "pending".
    path: '/security/mfa-setup',
    element: (
      <ProtectedRoute allowMfaPending>
        <div className="min-h-full bg-slate-100 px-6 dark:bg-slate-950">
          <MfaSetupPage />
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'coaches', element: <CoachesPage /> },
      { path: 'extracurriculars', element: <ExtracurricularsPage /> },
      { path: 'parent-relations', element: <ParentRelationsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'security', element: <SecurityPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
    ],
  },
]);
