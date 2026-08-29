import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Badge,
  Button,
  Field,
  Modal,
  Pagination,
  Select,
  TableShell,
  TextInput,
} from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { Student } from '@/lib/types';
import {
  useCreateStudent,
  useImportStudents,
  useRotateQr,
  useStudents,
  useToggleStudentActive,
  useUpdateStudent,
  type StudentInput,
} from './api';

const PAGE_SIZE = 20;

export function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Student | null | 'new'>(null);
  const [importing, setImporting] = useState(false);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search, classGrade, isActive: status }),
    [page, search, classGrade, status],
  );
  const { data, isLoading, isError, error } = useStudents(params);
  const toggle = useToggleStudentActive();
  const rotateQr = useRotateQr();
  const navigate = useNavigate();

  function openPrint() {
    const qs = new URLSearchParams();
    if (classGrade) qs.set('classGrade', classGrade);
    if (search) qs.set('search', search);
    navigate(`/students/qr-print?${qs.toString()}`);
  }

  const classes = useMemo(() => {
    const s = new Set<string>();
    data?.data.forEach((x) => s.add(x.classGrade));
    return [...s].sort();
  }, [data]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Data Master — Siswa</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openPrint}>
            Cetak Kartu QR
          </Button>
          <Button variant="secondary" onClick={() => setImporting(true)}>
            Import Excel
          </Button>
          <Button onClick={() => setEditing('new')}>+ Tambah Siswa</Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <TextInput
          placeholder="Cari NIS / nama…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={classGrade}
          onChange={(e) => {
            setClassGrade(e.target.value);
            setPage(1);
          }}
          className="max-w-[10rem]"
        >
          <option value="">Semua kelas</option>
          {classes.map((c) => (
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
                <th className="px-3 py-2">NIS</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Kelas</th>
                <th className="px-3 py-2">JK</th>
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
            {data.data.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2 font-mono text-xs">{s.nis}</td>
                <td className="px-3 py-2">{s.fullName}</td>
                <td className="px-3 py-2">{s.classGrade}</td>
                <td className="px-3 py-2">{s.gender ?? '-'}</td>
                <td className="px-3 py-2">
                  <Badge active={s.isActive} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setEditing(s)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (!confirm(`Rotasi QR untuk ${s.fullName}? Kartu QR lama akan tidak berlaku.`))
                          return;
                        rotateQr.mutate(s.id, {
                          onSuccess: () => toast.success('QR token dirotasi. Cetak kartu baru.'),
                          onError: (e) => toast.error(apiErrorMessage(e)),
                        });
                      }}
                    >
                      Rotasi QR
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        toggle.mutate(
                          { id: s.id, active: !s.isActive },
                          {
                            onSuccess: () =>
                              toast.success(s.isActive ? 'Siswa dinonaktifkan.' : 'Siswa diaktifkan.'),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          },
                        )
                      }
                    >
                      {s.isActive ? 'Nonaktifkan' : 'Aktifkan'}
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
        <StudentFormModal
          student={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {importing && <ImportStudentsModal onClose={() => setImporting(false)} />}
    </section>
  );
}

/* ---------------- Form modal ---------------- */
function StudentFormModal({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const isEdit = Boolean(student);
  const create = useCreateStudent();
  const update = useUpdateStudent();
  const [form, setForm] = useState<StudentInput>({
    nis: student?.nis ?? '',
    fullName: student?.fullName ?? '',
    classGrade: student?.classGrade ?? '',
    gender: student?.gender ?? undefined,
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.slice(0, 10) : undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nis.trim()) e.nis = 'NIS wajib diisi.';
    if (!form.fullName.trim()) e.fullName = 'Nama wajib diisi.';
    if (!form.classGrade.trim()) e.classGrade = 'Kelas wajib diisi.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    const payload: StudentInput = {
      ...form,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
    };
    try {
      if (isEdit && student) await update.mutateAsync({ id: student.id, input: payload });
      else await create.mutateAsync(payload);
      toast.success(isEdit ? 'Siswa diperbarui.' : 'Siswa ditambahkan.');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Modal open title={isEdit ? 'Edit Siswa' : 'Tambah Siswa'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="NIS" error={errors.nis}>
          <TextInput value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} />
        </Field>
        <Field label="Nama Lengkap" error={errors.fullName}>
          <TextInput
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kelas" error={errors.classGrade}>
            <TextInput
              value={form.classGrade}
              placeholder="mis. 4A"
              onChange={(e) => setForm({ ...form, classGrade: e.target.value })}
            />
          </Field>
          <Field label="Jenis Kelamin">
            <Select
              value={form.gender ?? ''}
              onChange={(e) =>
                setForm({ ...form, gender: (e.target.value || undefined) as 'L' | 'P' | undefined })
              }
            >
              <option value="">-</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </Select>
          </Field>
        </div>
        <Field label="Tanggal Lahir">
          <TextInput
            type="date"
            value={form.dateOfBirth ?? ''}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value || undefined })}
          />
        </Field>
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

/* ---------------- Import modal ---------------- */
function ImportStudentsModal({ onClose }: { onClose: () => void }) {
  const imp = useImportStudents();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof imp.mutateAsync>> | null>(null);

  async function run() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Pilih file .xlsx dulu.');
      return;
    }
    try {
      const r = await imp.mutateAsync(file);
      setResult(r);
      toast.success(`Import selesai: ${r.created} dibuat, ${r.skipped} dilewati.`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Modal open title="Import Siswa dari Excel" onClose={onClose} wide>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Format <code>.xlsx</code>. Baris pertama = header. Kolom minimal: <b>nis</b>, <b>nama</b>,{' '}
        <b>kelas</b>. Opsional: <b>gender</b> (L/P), <b>tanggal_lahir</b> (YYYY-MM-DD).
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xlsm"
        className="mt-3 block w-full text-sm"
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
        <Button onClick={run} disabled={imp.isPending}>
          {imp.isPending ? 'Mengunggah…' : 'Unggah & Import'}
        </Button>
      </div>

      {result && (
        <div className="mt-4 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
          <p>
            <b>{result.created}</b> siswa dibuat, <b>{result.skipped}</b> dilewati.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-amber-700 dark:text-amber-400">
              {result.errors.slice(0, 50).map((e, i) => (
                <li key={i}>
                  {e.row > 0 ? `Baris ${e.row}: ` : ''}
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
