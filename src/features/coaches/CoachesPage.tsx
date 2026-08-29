import { useMemo, useState } from 'react';

import { Badge, Button, Field, Modal, Pagination, Select, TableShell, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { Coach } from '@/lib/types';
import {
  useCoaches,
  useCreateCoach,
  useToggleCoachActive,
  useUpdateCoach,
  type CreateCoachInput,
} from './api';

const PAGE_SIZE = 20;

export function CoachesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Coach | null | 'new'>(null);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search, isActive: status }),
    [page, search, status],
  );
  const { data, isLoading, isError, error } = useCoaches(params);
  const toggle = useToggleCoachActive();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Data Master — Guru Pembina
        </h1>
        <Button onClick={() => setEditing('new')}>+ Tambah Pembina</Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput
          placeholder="Cari nama / email / no. pegawai…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
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
                <th className="px-3 py-2">No. Pegawai</th>
                <th className="px-3 py-2">Spesialisasi</th>
                <th className="px-3 py-2">Email</th>
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
            {data.data.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2">{c.user.fullName}</td>
                <td className="px-3 py-2 font-mono text-xs">{c.employeeNumber ?? '-'}</td>
                <td className="px-3 py-2">{c.specialization ?? '-'}</td>
                <td className="px-3 py-2">{c.user.email ?? '-'}</td>
                <td className="px-3 py-2">
                  <Badge active={c.user.isActive} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setEditing(c)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        toggle.mutate(
                          { id: c.id, active: !c.user.isActive },
                          {
                            onSuccess: () =>
                              toast.success(
                                c.user.isActive ? 'Pembina dinonaktifkan.' : 'Pembina diaktifkan.',
                              ),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          },
                        )
                      }
                    >
                      {c.user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
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
        <CoachFormModal coach={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}

function CoachFormModal({ coach, onClose }: { coach: Coach | null; onClose: () => void }) {
  const isEdit = Boolean(coach);
  const create = useCreateCoach();
  const update = useUpdateCoach();
  const [form, setForm] = useState<CreateCoachInput>({
    fullName: coach?.user.fullName ?? '',
    email: coach?.user.email ?? '',
    password: '',
    phoneNumber: coach?.user.phoneNumber ?? '',
    employeeNumber: coach?.employeeNumber ?? '',
    specialization: coach?.specialization ?? '',
    bio: coach?.bio ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Nama wajib diisi.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Email tidak valid.';
    if (!isEdit && form.password.length < 8) e.password = 'Password minimal 8 karakter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      if (isEdit && coach) {
        await update.mutateAsync({
          id: coach.id,
          input: {
            fullName: form.fullName,
            email: form.email,
            phoneNumber: form.phoneNumber || undefined,
            employeeNumber: form.employeeNumber || undefined,
            specialization: form.specialization || undefined,
            bio: form.bio || undefined,
          },
        });
      } else {
        await create.mutateAsync({
          ...form,
          phoneNumber: form.phoneNumber || undefined,
          employeeNumber: form.employeeNumber || undefined,
          specialization: form.specialization || undefined,
          bio: form.bio || undefined,
        });
      }
      toast.success(isEdit ? 'Pembina diperbarui.' : 'Pembina ditambahkan.');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Modal open title={isEdit ? 'Edit Pembina' : 'Tambah Pembina'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nama Lengkap" error={errors.fullName}>
          <TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email (untuk login)" error={errors.email}>
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="No. HP">
            <TextInput
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
          </Field>
        </div>
        {!isEdit && (
          <Field label="Password Awal" error={errors.password}>
            <TextInput
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="No. Pegawai">
            <TextInput
              value={form.employeeNumber}
              onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
            />
          </Field>
          <Field label="Spesialisasi">
            <TextInput
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
