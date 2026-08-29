import { useMemo, useState } from 'react';

import { Button, Field, Pagination, Select, TableShell, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useExtracurriculars } from '@/features/extracurriculars/api';
import {
  useExportStatus,
  useRecentExports,
  useReportPreview,
  useRequestExport,
  type ReportExport,
  type ReportFilters,
} from './api';

const PAGE_SIZE = 25;

function fmtBytes(n: number | null): string {
  if (!n) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function StatusPill({ e }: { e: ReportExport }) {
  const map: Record<string, string> = {
    PENDING: 'bg-slate-200 text-slate-600',
    PROCESSING: 'bg-amber-100 text-amber-800',
    READY: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[e.status]}`}>
      {e.status === 'PENDING' || e.status === 'PROCESSING' ? 'Diproses…' : e.status}
    </span>
  );
}

export function ReportsPage() {
  const [draft, setDraft] = useState<ReportFilters>({});
  const [applied, setApplied] = useState<ReportFilters | null>(null);
  const [page, setPage] = useState(1);
  const [activeExportId, setActiveExportId] = useState<string | null>(null);

  const ekskuls = useExtracurriculars({ page: 1, pageSize: 200 });
  const preview = useReportPreview(applied ?? {}, page, PAGE_SIZE, applied !== null);
  const requestExport = useRequestExport();
  const activeExport = useExportStatus(activeExportId);
  const recent = useRecentExports();

  const meta = preview.data?.meta;
  const rangeLabel = useMemo(
    () => (meta ? `${meta.dateFrom} s/d ${meta.dateTo}` : null),
    [meta],
  );

  function applyFilters() {
    setPage(1);
    setApplied({ ...draft });
  }

  function startExport(format: 'pdf' | 'xlsx') {
    requestExport.mutate(
      { ...(applied ?? draft), format },
      {
        onSuccess: (e) => {
          setActiveExportId(e.id);
          toast.info(`Export ${format.toUpperCase()} diproses di latar belakang…`);
          void recent.refetch();
        },
        onError: (err) => toast.error(apiErrorMessage(err)),
      },
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Laporan Kehadiran & Perkembangan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pratinjau data lalu export sebagai <strong>PDF</strong> (format rapor per siswa) atau{' '}
          <strong>Excel</strong> (data mentah tabular). Export berjalan asinkron — aman untuk ratusan siswa.
        </p>
      </div>

      {/* ---- Filter ---- */}
      <div className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Kelas">
          <TextInput
            placeholder="mis. 4A (kosong = semua)"
            value={draft.classGrade ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, classGrade: e.target.value || undefined }))}
          />
        </Field>
        <Field label="Ekstrakurikuler">
          <Select
            value={draft.extracurricularId ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, extracurricularId: e.target.value || undefined }))}
          >
            <option value="">Semua ekskul</option>
            {ekskuls.data?.data.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dari tanggal">
          <TextInput
            type="date"
            value={draft.dateFrom ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value || undefined }))}
          />
        </Field>
        <Field label="Sampai tanggal">
          <TextInput
            type="date"
            value={draft.dateTo ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value || undefined }))}
          />
        </Field>
        <div className="flex items-end">
          <Button onClick={applyFilters} className="w-full">
            Tampilkan Pratinjau
          </Button>
        </div>
      </div>

      {/* ---- Export actions ---- */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          disabled={requestExport.isPending}
          onClick={() => startExport('pdf')}
        >
          Export PDF (rapor)
        </Button>
        <Button
          variant="secondary"
          disabled={requestExport.isPending}
          onClick={() => startExport('xlsx')}
        >
          Export Excel (data mentah)
        </Button>

        {activeExport.data && (
          <div className="flex items-center gap-2 text-sm">
            <StatusPill e={activeExport.data} />
            {activeExport.data.status === 'READY' && activeExport.data.downloadUrl && (
              <a
                href={activeExport.data.downloadUrl}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
              >
                Unduh {activeExport.data.format.toUpperCase()} ({fmtBytes(activeExport.data.fileSize)})
              </a>
            )}
            {activeExport.data.status === 'FAILED' && (
              <span className="text-red-600">{activeExport.data.errorMessage ?? 'Export gagal.'}</span>
            )}
          </div>
        )}
      </div>

      {/* ---- Preview table ---- */}
      {applied === null ? (
        <p className="text-sm text-slate-500">
          Setel filter lalu klik <em>Tampilkan Pratinjau</em> untuk melihat data sebelum export.
        </p>
      ) : preview.isLoading ? (
        <p className="text-sm text-slate-500">Memuat pratinjau…</p>
      ) : preview.isError ? (
        <p className="text-sm text-red-600">{apiErrorMessage(preview.error)}</p>
      ) : (
        <div>
          {rangeLabel && (
            <p className="mb-2 text-xs text-slate-500">
              Rentang tanggal efektif: <strong>{rangeLabel}</strong> · {meta?.total ?? 0} baris
            </p>
          )}
          <TableShell
            head={
              <>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Ekstrakurikuler</th>
                <th className="px-3 py-2">Pembina</th>
                <th className="px-3 py-2 text-right">Hadir/Sesi</th>
                <th className="px-3 py-2 text-right">% Hadir</th>
                <th className="px-3 py-2 text-right">I / S / A</th>
                <th className="px-3 py-2 text-right">Keaktifan</th>
              </>
            }
          >
            {preview.data && preview.data.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Tidak ada data untuk filter ini.
                </td>
              </tr>
            )}
            {preview.data?.data.map((r) => (
              <tr
                key={`${r.studentId}-${r.extracurricularId}`}
                className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <td className="px-3 py-2">
                  {r.studentName}
                  <div className="text-xs text-slate-500">
                    {r.classGrade} · {r.nis}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {r.extracurricularName}
                  <div className="text-xs text-slate-500">{r.category ?? '-'}</div>
                </td>
                <td className="px-3 py-2 text-xs">{r.coachName ?? '-'}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.present}/{r.recordedSessions || r.totalSessions}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.attendancePct}%</td>
                <td className="px-3 py-2 text-right tabular-nums text-xs">
                  {r.izin} / {r.sakit} / {r.alpa}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.avgActiveness == null ? '-' : r.avgActiveness.toFixed(1)}
                </td>
              </tr>
            ))}
          </TableShell>
          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPage={setPage}
            />
          )}
        </div>
      )}

      {/* ---- Recent exports ---- */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Riwayat Export</h2>
        <TableShell
          head={
            <>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Format</th>
              <th className="px-3 py-2">Filter</th>
              <th className="px-3 py-2 text-right">Baris</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Berkas</th>
            </>
          }
        >
          {recent.data && recent.data.data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                Belum ada export.
              </td>
            </tr>
          )}
          {recent.data?.data.map((e) => (
            <tr key={e.id} className="align-top">
              <td className="px-3 py-2 text-xs">{new Date(e.createdAt).toLocaleString('id-ID')}</td>
              <td className="px-3 py-2 text-xs uppercase">{e.format}</td>
              <td className="px-3 py-2 text-xs text-slate-500">
                {[
                  e.filters.classGrade && `kelas ${e.filters.classGrade}`,
                  e.filters.extracurricularId && '1 ekskul',
                  e.filters.dateFrom && `${e.filters.dateFrom}→${e.filters.dateTo}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'semua'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{e.rowCount ?? '-'}</td>
              <td className="px-3 py-2">
                <StatusPill e={e} />
                {e.status === 'FAILED' && e.errorMessage && (
                  <div className="text-xs text-red-600">{e.errorMessage}</div>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                {e.status === 'READY' && e.downloadUrl ? (
                  <a
                    href={e.downloadUrl}
                    className="text-xs font-medium text-slate-700 underline hover:text-slate-900 dark:text-slate-300"
                  >
                    Unduh ({fmtBytes(e.fileSize)})
                  </a>
                ) : e.status === 'READY' ? (
                  <span className="text-xs text-slate-400">tautan kedaluwarsa</span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </section>
  );
}
