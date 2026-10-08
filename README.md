# eskul-web-admin

Web Admin Sekolah untuk **Ekosistem Presensi & Perkembangan Ekstrakurikuler SD**.

Stack: **React 19 · Vite 8 · TypeScript · React Router · Zustand · TanStack Query · Tailwind CSS v4 · recharts** (analitik).

Referensi arsitektur: `../system-design-ekosistem-ekskul-sd.md` (bagian 5.3 — Alur Dashboard Admin).

> **Status: Fase 1.2 + 2.2 + 2.4 + 3.1 + 3.2 + 4.1 + 4.2 + multi-tenant (beyond-plan).**
> Login nyata + CRUD Data Master (Siswa/Pembina/Ekskul) + cetak/rotasi kartu QR +
> Persetujuan Relasi Ortu–Siswa + halaman Laporan + Dashboard Analitik + halaman Audit
> Log (`ADMIN_SUPER`) + **login 2 langkah & halaman Keamanan/MFA** (4.2: setup TOTP +
> QR, kode pemulihan, setup wajib bila `MFA_SETUP_REQUIRED`) + **halaman Kelola
> Sekolah** (`ADMIN_SUPER` — daftarkan sekolah baru + admin pertamanya; setiap sekolah
> terisolasi penuh dari sekolah lain, lihat `backend/MULTI-TENANT.md`). Halaman
> dashboard utama masih placeholder.

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
│   │   ├── auth/               # ✅ LoginPage (login 2 langkah: password → kode MFA)
│   │   ├── security/           # ✅ SecurityPage + MfaSetupPage (TOTP + QR + recovery codes)  (Fase 4.2)
│   │   ├── students/           # ✅ tabel+filter+pagination, CRUD modal, import Excel  (1.2)
│   │   ├── coaches/            # ✅ CRUD guru pembina (buat akun + password awal)      (1.2)
│   │   ├── extracurriculars/   # ✅ CRUD ekskul + modal detail: jadwal & anggota      (1.2)
│   │   ├── dashboard/          # KPI cards                  (Fase 1 lanjutan)
│   │   ├── analytics/          # ✅ dashboard analitik (recharts, lazy-load)  (Fase 3.2)
│   │   ├── parent-relations/   # ✅ approval relasi ortu    (Fase 2.4)
│   │   ├── reports/            # ✅ pratinjau + export PDF/Excel async + riwayat  (Fase 3.1)
│   │   ├── audit-logs/         # ✅ review audit log (ADMIN_SUPER, read-only)  (Fase 4.1)
│   │   └── schools/            # ✅ Kelola Sekolah (ADMIN_SUPER) — daftar/suspend/resume/+admin  (beyond-plan)
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

Login dengan akun seed: `admin@eskul.test` / `Admin#12345` (role `ADMIN`) atau
`superadmin@eskul.test` / `Super#12345` (role `ADMIN_SUPER` — plus menu **Audit Log**).
`ProtectedRoute` menuntut sesi nyata + role admin (`ADMIN` atau `ADMIN_SUPER`).

Bila backend `MFA_ENFORCE_ADMIN=true`, login admin pertama kali dialihkan ke
`/security/mfa-setup` (wajib aktifkan MFA sebelum halaman lain terbuka).

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

### Fase 2.2 (bagian web)
- [x] Halaman `/students/qr-print` (tanpa sidebar): grid kartu = foto/avatar + nama +
      kelas + **QR dari `qr_token`** (`qrcode.react`), NIS kecil & samar; tombol Cetak →
      `window.print()` (`@media print` grid `break-inside-avoid`)
- [x] Aksi baris "Rotasi QR" (konfirmasi) → `POST /admin/students/:id/rotate-qr`
- [x] `tsc -b` + `vite build` + `oxlint` bersih

### Fase 2.4 (bagian web)
- [x] Halaman "Persetujuan Relasi": tabel relasi (ortu + relationType + email, no HP,
      siswa diklaim + kelas + NIS, tgl); filter status PENDING/APPROVED/REJECTED
- [x] Tombol Setujui / Tolak per baris → `PUT /admin/parent-relations/:id/approve`
      (`{ decision, reason? }`); Tolak menampilkan prompt alasan opsional
- [x] Badge kuning **⚠ SUSPICIOUS** bila `row.suspicious` (dari backend)
- [x] `tsc -b` + `vite build` + `oxlint` bersih

### Fase 3.1 (bagian web)
- [x] Halaman "Laporan": filter (kelas, ekskul, rentang tanggal) → **pratinjau tabel**
      sebelum export (`GET /admin/reports/attendance/preview`, dengan pagination + rentang efektif)
- [x] Tombol **Export PDF (rapor)** / **Export Excel (data mentah)** → `GET /admin/reports/attendance?format=…`
      (202), lalu **polling** `GET /admin/reports/exports/:id` sampai `READY`/`FAILED` dengan indikator status
- [x] Unduh via `downloadUrl` ber-signature dari backend; tabel **Riwayat Export** (auto-refresh)
      menampilkan status + tautan unduh / "tautan kedaluwarsa"
- [x] `tsc -b` + `vite build` + `oxlint` bersih

### Fase 3.2 (bagian web)
- [x] Halaman "Dashboard Analitik Sekolah" konsumsi `GET /admin/analytics/overview`:
      baris KPI + grafik batang partisipasi per jenis ekskul + grafik garis tren
      kehadiran 8 minggu (recharts) + tabel top-5 kehadiran terendah per ekskul
- [x] Tombol **Segarkan** (`?fresh=1`) + info "data per … · dari cache / baru dihitung"
- [x] `recharts` di-`lazy()` → chunk `AnalyticsPage-*.js` terpisah (bundle utama tetap ~440 kB)
- [x] `tsc -b` + `vite build` + `oxlint` bersih

### Fase 4.1 (bagian web)
- [x] Halaman "Audit Log" (`/audit-logs`): tabel waktu / user / action / entity / IP /
      hasil (ok · error N) + modal detail (metadata JSON pretty-print)
- [x] Filter: free-text `q` (action / metadata JSONB / nama-email user), action &
      entity type (dari `GET /admin/audit-logs/facets`), user ID, rentang tanggal; pagination
- [x] Read-only + sub-permission: menu & halaman hanya untuk `role === 'ADMIN_SUPER'`
      (pesan jelas untuk `ADMIN` biasa; backend tetap 403). `AuthUser.role` + `isAdminRole()`
      diperluas ke `ADMIN_SUPER` di `authStore` / `LoginPage` / `ProtectedRoute`
- [x] `tsc -b` + `vite build` + `oxlint` bersih

### Fase 4.2 (bagian web)
- [x] `LoginPage` 2 tahap: submit password → bila `mfaRequired`, tampil input kode →
      `POST /auth/login/mfa`; bila `mfaSetupRequired` → redirect `/security/mfa-setup`
- [x] `MfaSetupPage` (`/security/mfa-setup`, tanpa sidebar): `POST /auth/mfa/setup` →
      **QR** (`qrcode.react` dari `otpauthUrl`) + kunci manual → input kode → `enable` →
      simpan sesi baru + tampilkan **10 kode pemulihan** (tombol salin) → lanjut ke dashboard
- [x] `SecurityPage` (`/security`, menu "Keamanan (MFA)"): status MFA + tombol aktifkan /
      nonaktifkan (prompt kode) / buat ulang kode pemulihan
- [x] `ProtectedRoute` `allowMfaPending` + `authStore.mfaSetupRequired`; interceptor axios
      menangani 403 `MFA_SETUP_REQUIRED` → arahkan ke halaman setup
- [x] `tsc -b` + `vite build` + `oxlint` bersih
