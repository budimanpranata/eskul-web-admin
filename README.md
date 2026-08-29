# eskul-web-admin

Web Admin Sekolah untuk **Ekosistem Presensi & Perkembangan Ekstrakurikuler SD**.

Stack: **React 19 · Vite 8 · TypeScript · React Router · Zustand · TanStack Query · Tailwind CSS v4**.

Referensi arsitektur: `../system-design-ekosistem-ekskul-sd.md` (bagian 5.3 — Alur Dashboard Admin).

> **Status: Fase 1.2.** Login nyata + halaman CRUD Data Master (Siswa, Guru Pembina,
> Ekskul + Jadwal + Anggota) sudah berfungsi terhadap backend. Halaman lain
> (dashboard, analitik, relasi ortu, laporan, audit log) masih placeholder.

## Struktur folder

```
web-admin/
├── src/
│   ├── app/
│   │   ├── router.tsx          # definisi rute (react-router, createBrowserRouter)
│   │   ├── queryClient.ts      # instance TanStack Query
│   │   └── ProtectedRoute.tsx  # guard area admin
│   ├── components/
│   │   ├── layout/AdminLayout.tsx  # shell sidebar + user + logout + <Toaster/>
│   │   ├── ui.tsx                  # Button/Field/Modal/Pagination/TableShell/Badge/Toaster
│   │   └── PagePlaceholder.tsx
│   ├── features/
│   │   ├── auth/               # ✅ LoginPage (POST /auth/login, cek role ADMIN)
│   │   ├── students/           # ✅ tabel+filter+pagination, CRUD modal, import Excel  (1.2)
│   │   ├── coaches/            # ✅ CRUD guru pembina (buat akun + password awal)      (1.2)
│   │   ├── extracurriculars/   # ✅ CRUD ekskul + modal detail: jadwal & anggota      (1.2)
│   │   ├── dashboard/          # KPI cards                  (Fase 1 lanjutan)
│   │   ├── analytics/          # dashboard analitik         (Fase 3.2)
│   │   ├── parent-relations/   # approval relasi ortu       (Fase 2.4)
│   │   ├── reports/            # export PDF/Excel           (Fase 3.1)
│   │   └── audit-logs/         # review audit log           (Fase 4.1)
│   │       └── <feature>/api.ts  # hook TanStack Query per entitas
│   ├── lib/
│   │   ├── api.ts             # axios + interceptor Bearer + auto-refresh saat 401
│   │   ├── toast.ts           # store notifikasi ringan
│   │   └── types.ts          # tipe response backend
│   ├── stores/authStore.ts   # Zustand persist — accessToken/refreshToken/user
│   └── main.tsx              # Query + Router provider
├── vite.config.ts            # alias @/* , port 5273, proxy /api → localhost:3100
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

Buka <http://localhost:5273>. Request ke `/api/*` otomatis di-proxy ke backend
di `http://localhost:3100` (jalankan `eskul-backend` di terminal terpisah, plus
`docker compose up -d postgres redis` + `prisma migrate deploy` + `db:seed`).

Login dengan akun admin hasil seed: `admin@eskul.test` / `Admin#12345`.
`ProtectedRoute` kini menuntut sesi nyata + role `ADMIN` (tidak ada lagi bypass dev).

## Skrip npm

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Dev server (port 5273) |
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

## Definition of Done

### Fase 0.1
- [x] `npm run dev` menjalankan SPA tanpa error
- [x] Routing (react-router) mencakup seluruh menu dari dokumen desain bagian 5.3
- [x] State management ditentukan (Zustand + TanStack Query) beserta alasannya
- [x] Tailwind aktif untuk styling

### Fase 1.2 (bagian web)
- [x] Halaman Siswa/Pembina/Ekskul: tabel + pagination + search + filter
      (kelas untuk siswa, kategori untuk ekskul), form create/edit dengan
      validasi client-side, nonaktif/aktifkan
- [x] Import siswa massal dari `.xlsx` dengan ringkasan hasil (dibuat/dilewati/error)
- [x] Modal detail ekskul: kelola jadwal (+deteksi bentrok dari backend) & anggota
      (cari siswa, daftarkan/keluarkan, cek kapasitas dari backend)
- [x] `tsc -b` + `vite build` + `oxlint` bersih
- [x] Alur web → proxy → backend → Postgres/Redis diverifikasi (login admin nyata)
