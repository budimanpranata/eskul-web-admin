import { useMemo, useState } from 'react';

import { Badge, Button, Pagination, Select, TableShell, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { ExtracurricularListItem } from '@/lib/types';
import { useExtracurriculars, useToggleEkskulActive } from './api';
import { EkskulDetailModal } from './EkskulDetailModal';
import { EkskulFormModal } from './EkskulFormModal';

const PAGE_SIZE = 20;

export function ExtracurricularsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<ExtracurricularListItem | null | 'new'>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search, category, isActive: status }),
    [page, search, category, status],
  );
  const { data, isLoading, isError, error } = useExtracurriculars(params);
  const toggle = useToggleEkskulActive();

  const categories = useMemo(() => {
    const s = new Set<string>();
    data?.data.forEach((x) => x.category && s.add(x.category));
    return [...s].sort();
  }, [data]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Data Master — Ekstrakurikuler & Jadwal
        </h1>
        <Button onClick={() => setEditing('new')}>+ Tambah Ekskul</Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput
          placeholder="Cari nama ekskul…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="max-w-[12rem]"
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="max-w-[10rem]"
        >
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <>
          <TableShell
            head={
              <>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2">Pembina</th>
                <th className="px-3 py-2">Anggota</th>
                <th className="px-3 py-2">Jadwal</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </>
            }
          >
            {data.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {data.data.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2">{e.name}</td>
                <td className="px-3 py-2">{e.category ?? '-'}</td>
                <td className="px-3 py-2">{e.defaultCoachName ?? '-'}</td>
                <td className="px-3 py-2">
                  {e.memberCount}
                  {e.maxCapacity ? ` / ${e.maxCapacity}` : ''}
                </td>
                <td className="px-3 py-2">{e.scheduleCount}</td>
                <td className="px-3 py-2">
                  <Badge active={e.isActive} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setDetailId(e.id)}>
                      Jadwal & Anggota
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(e)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        toggle.mutate(
                          { id: e.id, active: !e.isActive },
                          {
                            onSuccess: () =>
                              toast.success(e.isActive ? 'Ekskul dinonaktifkan.' : 'Ekskul diaktifkan.'),
                            onError: (err) => toast.error(apiErrorMessage(err)),
                          },
                        )
                      }
                    >
                      {e.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
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

      {editing && (
        <EkskulFormModal ekskul={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {detailId && <EkskulDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </section>
  );
}
