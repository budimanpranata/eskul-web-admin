import { useMemo, useState } from 'react';

import { Badge, Button, Field, Modal, Pagination, Select, TableShell, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import type { School } from '@/lib/types';
import {
  useAddSchoolAdmin,
  useCreateSchool,
  useSchools,
  useToggleSchoolActive,
  type AddSchoolAdminInput,
  type CreateSchoolInput,
} from './api';

const PAGE_SIZE = 20;

/**
 * Pendaftaran & pengelolaan sekolah (tenant) — khusus ADMIN_SUPER. Setiap
 * sekolah di sini terisolasi penuh: admin satu sekolah tidak bisa melihat
 * siswa / ekskul / menu data sekolah lain (ditegakkan di backend lewat
 * `school_id`, lihat MULTI-TENANT.md).
 */
export function SchoolsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [addingAdminTo, setAddingAdminTo] = useState<School | null>(null);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search, isActive: status }),
    [page, search, status],
  );
  const { data, isLoading, isError, error } = useSchools(params);
  const toggle = useToggleSchoolActive();

  if (role !== 'ADMIN_SUPER') {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Halaman Kelola Sekolah hanya untuk akun <strong>ADMIN_SUPER</strong>.
      </p>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Kelola Sekolah</h1>
          <p className="mt-1 text-sm text-slate-500">
            Daftarkan sekolah baru + admin pertamanya. Setiap sekolah terisolasi penuh dari sekolah lain.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ Daftarkan Sekolah</Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput
          placeholder="Cari kode / nama sekolah…"
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
          <option value="false">Disuspend</option>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <>
          <TableShell
            head={
              <>
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Nama Sekolah</th>
                <th className="px-3 py-2 text-right">Admin</th>
                <th className="px-3 py-2 text-right">Siswa</th>
                <th className="px-3 py-2 text-right">Ekskul</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </>
            }
          >
            {data.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Belum ada sekolah terdaftar.
                </td>
              </tr>
            )}
            {data.data.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2 font-mono text-xs">{s.code}</td>
                <td className="px-3 py-2">{s.name}</td>
                <td className="px-3 py-2 text-right">{s.userCount}</td>
                <td className="px-3 py-2 text-right">{s.studentCount}</td>
                <td className="px-3 py-2 text-right">{s.extracurricularCount}</td>
                <td className="px-3 py-2">
                  <Badge active={s.isActive} labels={{ on: 'Aktif', off: 'Disuspend' }} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setAddingAdminTo(s)}>
                      + Admin
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        toggle.mutate(
                          { id: s.id, active: !s.isActive },
                          {
                            onSuccess: () =>
                              toast.success(s.isActive ? 'Sekolah disuspend.' : 'Sekolah diaktifkan kembali.'),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          },
                        )
                      }
                    >
                      {s.isActive ? 'Suspend' : 'Aktifkan'}
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

      {creating && <CreateSchoolModal onClose={() => setCreating(false)} />}
      {addingAdminTo && (
        <AddAdminModal school={addingAdminTo} onClose={() => setAddingAdminTo(null)} />
      )}
    </section>
  );
}

function CreateSchoolModal({ onClose }: { onClose: () => void }) {
  const create = useCreateSchool();
  const [form, setForm] = useState<CreateSchoolInput>({
    code: '',
    name: '',
    adminFullName: '',
    adminEmail: '',
    adminPhoneNumber: '',
    adminPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Kode sekolah wajib diisi.';
    if (!form.name.trim()) e.name = 'Nama sekolah wajib diisi.';
    if (!form.adminFullName.trim()) e.adminFullName = 'Nama admin wajib diisi.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.adminEmail)) e.adminEmail = 'Email tidak valid.';
    if (form.adminPassword.length < 8) e.adminPassword = 'Password minimal 8 karakter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await create.mutateAsync({ ...form, adminPhoneNumber: form.adminPhoneNumber || undefined });
      toast.success('Sekolah & admin pertamanya berhasil didaftarkan.');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Modal open title="Daftarkan Sekolah Baru" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kode Sekolah" error={errors.code}>
            <TextInput
              placeholder="mis. SD-MELATI-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label="Nama Sekolah" error={errors.name}>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <hr className="border-slate-200 dark:border-slate-800" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Admin pertama sekolah ini</p>
        <Field label="Nama Lengkap" error={errors.adminFullName}>
          <TextInput
            value={form.adminFullName}
            onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email (untuk login)" error={errors.adminEmail}>
            <TextInput
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            />
          </Field>
          <Field label="No. HP">
            <TextInput
              value={form.adminPhoneNumber}
              onChange={(e) => setForm({ ...form, adminPhoneNumber: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Password Awal" error={errors.adminPassword}>
          <TextInput
            type="text"
            value={form.adminPassword}
            onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Menyimpan…' : 'Daftarkan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddAdminModal({ school, onClose }: { school: School; onClose: () => void }) {
  const addAdmin = useAddSchoolAdmin();
  const [form, setForm] = useState<AddSchoolAdminInput>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Nama wajib diisi.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Email tidak valid.';
    if (form.password.length < 8) e.password = 'Password minimal 8 karakter.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await addAdmin.mutateAsync({
        id: school.id,
        input: { ...form, phoneNumber: form.phoneNumber || undefined },
      });
      toast.success(`Admin baru ditambahkan ke ${school.name}.`);
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Modal open title={`Tambah Admin — ${school.name}`} onClose={onClose}>
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
        <Field label="Password Awal" error={errors.password}>
          <TextInput
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={addAdmin.isPending}>
            {addAdmin.isPending ? 'Menyimpan…' : 'Tambahkan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
