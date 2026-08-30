import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Toaster } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const NAV: { to: string; label: string; end?: boolean; superOnly?: boolean }[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/analytics', label: 'Analitik Sekolah' },
  { to: '/students', label: 'Siswa' },
  { to: '/coaches', label: 'Guru Pembina' },
  { to: '/extracurriculars', label: 'Ekskul & Jadwal' },
  { to: '/parent-relations', label: 'Persetujuan Relasi Ortu' },
  { to: '/reports', label: 'Laporan' },
  { to: '/security', label: 'Keamanan (MFA)' },
  // Audit Log: hanya untuk ADMIN_SUPER (backend menegakkan 403 juga).
  { to: '/audit-logs', label: 'Audit Log', superOnly: true },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* abaikan — tetap bersihkan sesi lokal */
    }
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-full bg-slate-100 dark:bg-slate-950">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 px-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          Admin Ekskul SD
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.filter((item) => !item.superOnly || user?.role === 'ADMIN_SUPER').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-slate-800 text-white dark:bg-slate-700'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
          <div className="px-2 text-slate-600 dark:text-slate-300">{user?.fullName ?? 'Admin'}</div>
          <button
            onClick={logout}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <Toaster />
    </div>
  );
}
