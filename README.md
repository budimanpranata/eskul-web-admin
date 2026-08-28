# eskul-web-admin

Web Admin Sekolah untuk **Ekosistem Presensi & Perkembangan Ekstrakurikuler SD**.

Stack: **React 19 · Vite 8 · TypeScript · React Router · Zustand · TanStack Query · Tailwind CSS v4**.

Referensi arsitektur: `../system-design-ekosistem-ekskul-sd.md` (bagian 5.3 — Alur Dashboard Admin).

> **Status: Fase 0 (scaffolding).** Struktur, routing, styling, dan data layer sudah
> terpasang. Semua halaman masih placeholder — diisi pada fase masing-masing.

## Struktur folder

```
web-admin/
├── src/
│   ├── app/
│   │   ├── router.tsx          # definisi rute (react-router, createBrowserRouter)
│   │   ├── queryClient.ts      # instance TanStack Query
│   │   └── ProtectedRoute.tsx  # guard area admin
│   ├── components/
│   │   ├── layout/AdminLayout.tsx  # shell sidebar + konten
│   │   └── PagePlaceholder.tsx
│   ├── features/
│   │   ├── auth/               # LoginPage                 (Fase 1.1)
│   │   ├── dashboard/          # KPI cards                  (Fase 1)
│   │   ├── analytics/          # dashboard analitik         (Fase 3.2)
│   │   ├── students/           # CRUD siswa + import Excel  (Fase 1.2 / 2.2)
│   │   ├── coaches/            # CRUD guru pembina          (Fase 1.2)
│   │   ├── extracurriculars/   # CRUD ekskul & jadwal       (Fase 1.2)
│   │   ├── parent-relations/   # approval relasi ortu       (Fase 2.4)
│   │   ├── reports/            # export PDF/Excel           (Fase 3.1)
│   │   └── audit-logs/         # review audit log           (Fase 4.1)
│   ├── lib/api.ts              # axios instance ke backend
│   ├── stores/authStore.ts    # Zustand — client state auth
│   ├── index.css              # @import "tailwindcss"
│   └── main.tsx               # Query + Router provider
├── vite.config.ts             # alias @/* , proxy /api → localhost:3000, Tailwind plugin
└── .env.example
```

## Menjalankan secara lokal

### Prasyarat
- Node.js ≥ 22, npm ≥ 10

```bash
cp .env.example .env        # opsional; default sudah cukup untuk dev
npm install
npm run dev
```

Buka <http://localhost:5173>. Request ke `/api/*` otomatis di-proxy ke backend
di `http://localhost:3000` (jalankan `eskul-backend` di terminal terpisah).

> Saat `npm run dev`, `ProtectedRoute` sengaja mem-bypass auth (`import.meta.env.DEV`)
> supaya UI bisa ditinjau sebelum modul auth backend siap. Bypass ini dicabut di Fase 1.1.

## Skrip npm

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Type-check (`tsc -b`) + build produksi |
| `npm run preview` | Preview hasil build |
| `npm run lint` | oxlint |

## Keputusan: state management → **Zustand + TanStack Query**

Rencana kerja (prompt 0.1) meminta pemilihan antara Zustand dan Redux Toolkit
beserta alasannya.

**Pilihan: Zustand untuk _client/UI state_, TanStack Query untuk _server state_.**

Alasan:

1. **Mayoritas state di aplikasi ini adalah server state** (daftar siswa, ekskul,
   relasi pending, audit log) — bukan client state kompleks. Kebutuhan sebenarnya
   adalah caching, invalidasi, pagination, refetch, dan status loading/error per
   query. Itu domain **TanStack Query**, bukan Redux. Menaruh data server di Redux
   store berarti menulis ulang caching/invalidation secara manual.
2. **Sisa client state kecil dan lokal**: sesi auth (token + identitas user),
   preferensi filter tabel, state UI modal. **Zustand** menangani ini dengan
   boilerplate minimal (satu `create()`, tanpa provider, tanpa action types /
   reducers / thunks), plus middleware `persist` bawaan untuk menyimpan sesi.
3. **Ukuran bundle & kurva belajar** lebih ringan — relevan untuk aplikasi internal
   yang kemungkinan dikelola tim kecil / vendor lokal (sejalan dengan justifikasi
   tech stack di dokumen desain).
4. Redux Toolkit + RTK Query tetap pilihan valid bila nanti muncul kebutuhan state
   client yang sangat terstruktur (mis. editor kompleks dengan undo/redo). Untuk
   scope dashboard CRUD + laporan ini, kombinasi Zustand + TanStack Query lebih
   proporsional.

## Definition of Done (Fase 0.1)

- [x] `npm run dev` menjalankan SPA tanpa error
- [x] Routing (react-router) mencakup seluruh menu dari dokumen desain bagian 5.3
- [x] State management ditentukan (Zustand + TanStack Query) beserta alasannya
- [x] Tailwind aktif untuk styling
- [ ] Diverifikasi jalan setelah `npm install` (butuh jaringan untuk unduh dependency)
