import { Suspense, useState } from 'react';
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
  { to: '/billing', label: 'Tagihan Ekskul' },
  { to: '/security', label: 'Keamanan (MFA)' },
  // Audit Log & Kelola Sekolah: hanya untuk ADMIN_SUPER (backend menegakkan 403 juga).
  { to: '/audit-logs', label: 'Audit Log', superOnly: true },
  { to: '/schools', label: 'Kelola Sekolah', superOnly: true },
  { to: '/app-settings', label: 'Pengaturan Tampilan', superOnly: true },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  // Sidebar jadi drawer yang bisa dibuka/tutup di bawah breakpoint `lg`
  // (viewport HP/tablet) — di atas `lg` selalu tampil statis seperti semula.
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Backdrop — hanya muncul saat drawer terbuka di layar kecil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Admin Ekskul SD
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.filter((item) => !item.superOnly || user?.role === 'ADMIN_SUPER').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
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

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — hanya tampil di bawah breakpoint `lg`, menggantikan sidebar statis */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <HamburgerIcon />
          </button>
          <span className="font-semibold text-slate-800 dark:text-slate-100">Admin Ekskul SD</span>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-8">
          <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
