import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/analytics', label: 'Analitik Sekolah' },
  { to: '/students', label: 'Siswa' },
  { to: '/coaches', label: 'Guru Pembina' },
  { to: '/extracurriculars', label: 'Ekskul & Jadwal' },
  { to: '/parent-relations', label: 'Persetujuan Relasi Ortu' },
  { to: '/reports', label: 'Laporan' },
  { to: '/audit-logs', label: 'Audit Log' },
];

/**
 * Shell layout web admin: sidebar navigasi + area konten.
 * FASE 0: struktur visual dasar. Header user / logout diisi di Fase 1.1.
 */
export function AdminLayout() {
  return (
    <div className="flex min-h-full bg-slate-100 dark:bg-slate-950">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 px-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          Admin Ekskul SD
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
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
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
