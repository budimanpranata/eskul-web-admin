import { useState } from 'react';

import { Badge, Button, Pagination, Select, TableShell } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useDecideRelation, useParentRelations, type ParentRelation } from './api';

const PAGE_SIZE = 20;

export function ParentRelationsPage() {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useParentRelations({
    status,
    page,
    pageSize: PAGE_SIZE,
  });
  const decide = useDecideRelation();

  function act(rel: ParentRelation, decision: 'APPROVED' | 'REJECTED') {
    let reason: string | undefined;
    if (decision === 'REJECTED') {
      const r = prompt(`Alasan penolakan untuk ${rel.parent.fullName} → ${rel.student.fullName} (opsional):`);
      if (r === null) return; // batal
      reason = r.trim() || undefined;
    } else if (!confirm(`Setujui: ${rel.parent.fullName} sebagai wali ${rel.student.fullName}?`)) {
      return;
    }
    decide.mutate(
      { id: rel.id, decision, reason },
      {
        onSuccess: () =>
          toast.success(decision === 'APPROVED' ? 'Relasi disetujui.' : 'Relasi ditolak.'),
        onError: (e) => toast.error(apiErrorMessage(e)),
      },
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Persetujuan Relasi Orang Tua–Siswa
        </h1>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="max-w-[12rem]"
        >
          <option value="PENDING">Menunggu (PENDING)</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <>
          <TableShell
            head={
              <>
                <th className="px-3 py-2">Orang Tua</th>
                <th className="px-3 py-2">No. HP</th>
                <th className="px-3 py-2">Siswa diklaim</th>
                <th className="px-3 py-2">Diajukan</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </>
            }
          >
            {data.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {data.data.map((r) => (
              <tr key={r.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {r.parent.fullName}
                    {r.suspicious && (
                      <span
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                        title="Nomor HP ini mengajukan relasi ke >5 siswa berbeda dalam 24 jam"
                      >
                        ⚠ SUSPICIOUS
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.parent.relationType} · {r.parent.email ?? '-'}
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.parent.phoneNumber ?? '-'}</td>
                <td className="px-3 py-2">
                  {r.student.fullName}
                  <div className="text-xs text-slate-500">
                    {r.student.classGrade} · {r.student.nis}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">
                  {new Date(r.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td className="px-3 py-2">
                  {r.approvalStatus === 'APPROVED' ? (
                    <Badge active />
                  ) : r.approvalStatus === 'REJECTED' ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Ditolak
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Menunggu
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    {r.approvalStatus === 'PENDING' ? (
                      <>
                        <Button variant="ghost" onClick={() => act(r, 'APPROVED')}>
                          Setujui
                        </Button>
                        <Button variant="ghost" onClick={() => act(r, 'REJECTED')}>
                          Tolak
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">selesai</span>
                    )}
                  </div>
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
    </section>
  );
}
