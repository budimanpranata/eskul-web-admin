import { useState } from 'react';

import { Button, Field, Modal, Pagination, Select, TableShell, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useAuditFacets, useAuditLogs, type AuditFilters, type AuditLogRow } from './api';

const PAGE_SIZE = 30;

function OutcomeTag({ meta }: { meta: Record<string, unknown> | null }) {
  const o = meta?.outcome;
  if (o === 'error') {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        error{meta?.statusCode ? ` ${meta.statusCode}` : ''}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      ok
    </span>
  );
}

export function AuditLogsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [draft, setDraft] = useState<AuditFilters>({});
  const [applied, setApplied] = useState<AuditFilters>({});
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditLogRow | null>(null);

  const facets = useAuditFacets();
  const { data, isLoading, isError, error } = useAuditLogs(applied, page, PAGE_SIZE);

  if (role !== 'ADMIN_SUPER') {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Halaman Audit Log hanya untuk akun <strong>ADMIN_SUPER</strong>.
      </p>
    );
  }

  function apply() {
    setPage(1);
    setApplied({ ...draft });
  }
  function reset() {
    setDraft({});
    setApplied({});
    setPage(1);
  }
  const set = (k: keyof AuditFilters) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [k]: e.target.value || undefined }));

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Jejak akses data sensitif (siswa, ortu, laporan). Read-only.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Pencarian bebas (action / metadata / user)">
          <TextInput
            placeholder="mis. kelas 4A, EXPORT, nama admin…"
            value={draft.q ?? ''}
            onChange={set('q')}
          />
        </Field>
        <Field label="Action">
          <Select value={draft.action ?? ''} onChange={set('action')}>
            <option value="">Semua action</option>
            {facets.data?.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Entity type">
          <Select value={draft.entityType ?? ''} onChange={set('entityType')}>
            <option value="">Semua entity</option>
            {facets.data?.entityTypes.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="User ID (UUID)">
          <TextInput placeholder="opsional" value={draft.userId ?? ''} onChange={set('userId')} />
        </Field>
        <Field label="Dari tanggal">
          <TextInput type="date" value={draft.dateFrom ?? ''} onChange={set('dateFrom')} />
        </Field>
        <Field label="Sampai tanggal">
          <TextInput type="date" value={draft.dateTo ?? ''} onChange={set('dateTo')} />
        </Field>
        <div className="flex items-end gap-2">
          <Button onClick={apply}>Terapkan</Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <>
          <TableShell
            head={
              <>
                <th className="px-3 py-2">Waktu</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Entity</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Hasil</th>
                <th className="px-3 py-2 text-right">Detail</th>
              </>
            }
          >
            {data.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Tidak ada kejadian yang cocok.
                </td>
              </tr>
            )}
            {data.data.map((r) => (
              <tr key={r.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {new Date(r.createdAt).toLocaleString('id-ID')}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.userName ?? <span className="text-slate-400">sistem / anonim</span>}
                  {r.userEmail && <div className="text-slate-400">{r.userEmail}</div>}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {r.action}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.entityType}
                  {r.entityId && (
                    <div className="font-mono text-[11px] text-slate-400">
                      {r.entityId.slice(0, 8)}…
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.ipAddress ?? '-'}</td>
                <td className="px-3 py-2">
                  <OutcomeTag meta={r.metadata} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" onClick={() => setDetail(r)}>
                    Lihat
                  </Button>
                </td>
              </tr>
            ))}
          </TableShell>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPage={setPage}
          />
        </>
      )}

      <Modal open={detail !== null} title="Detail kejadian audit" onClose={() => setDetail(null)} wide>
        {detail && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Waktu</span>
                <div>{new Date(detail.createdAt).toLocaleString('id-ID')}</div>
              </div>
              <div>
                <span className="text-slate-500">Action</span>
                <div className="font-mono">{detail.action}</div>
              </div>
              <div>
                <span className="text-slate-500">User</span>
                <div>
                  {detail.userName ?? 'sistem / anonim'}{' '}
                  <span className="text-slate-400">{detail.userEmail ?? ''}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500">User ID</span>
                <div className="font-mono text-xs">{detail.userId ?? '-'}</div>
              </div>
              <div>
                <span className="text-slate-500">Entity</span>
                <div>
                  {detail.entityType} <span className="font-mono text-xs">{detail.entityId ?? ''}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500">IP</span>
                <div className="font-mono text-xs">{detail.ipAddress ?? '-'}</div>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Metadata</span>
              <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(detail.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
