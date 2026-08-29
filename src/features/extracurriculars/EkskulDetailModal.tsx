import { useState } from 'react';

import { Button, Field, Modal, Select, TableShell, TextInput } from '@/components/ui';
import { api, apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { DAY_OPTIONS, type Student } from '@/lib/types';
import {
  useAddMembers,
  useAddSchedule,
  useEkskulMembers,
  useExtracurricular,
  useRemoveMember,
  useRemoveSchedule,
  type ScheduleInput,
} from './api';

export function EkskulDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: ekskul, isLoading } = useExtracurricular(id);
  const { data: members } = useEkskulMembers(id, 1);

  return (
    <Modal open title={ekskul ? `Kelola: ${ekskul.name}` : 'Memuat…'} onClose={onClose} wide>
      {isLoading || !ekskul ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : (
        <div className="space-y-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {ekskul.category ?? 'Tanpa kategori'} · Pembina: {ekskul.defaultCoachName ?? '-'} ·
            Kapasitas: {ekskul.maxCapacity ?? '∞'} · Anggota: {ekskul.memberCount}
          </div>

          <SchedulesSection ekskulId={id} schedules={ekskul.schedules} />
          <MembersSection ekskulId={id} memberIds={new Set(members?.data.map((m) => m.student.id))} />
        </div>
      )}
    </Modal>
  );
}

/* ---------------- Schedules ---------------- */
function SchedulesSection({
  ekskulId,
  schedules,
}: {
  ekskulId: string;
  schedules: { id: string; dayLabel: string; startTime: string; endTime: string; location: string | null; isActive: boolean }[];
}) {
  const add = useAddSchedule();
  const remove = useRemoveSchedule();
  const [form, setForm] = useState<ScheduleInput>({
    dayOfWeek: 1,
    startTime: '15:00',
    endTime: '16:30',
    location: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await add.mutateAsync({
        id: ekskulId,
        input: { ...form, location: form.location?.trim() || undefined },
      });
      toast.success('Jadwal ditambahkan.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Jadwal</h3>
      <TableShell
        head={
          <>
            <th className="px-3 py-2">Hari</th>
            <th className="px-3 py-2">Jam</th>
            <th className="px-3 py-2">Lokasi</th>
            <th className="px-3 py-2 text-right">Aksi</th>
          </>
        }
      >
        {schedules.filter((s) => s.isActive).length === 0 && (
          <tr>
            <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
              Belum ada jadwal.
            </td>
          </tr>
        )}
        {schedules
          .filter((s) => s.isActive)
          .map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-2">{s.dayLabel}</td>
              <td className="px-3 py-2">
                {s.startTime}–{s.endTime}
              </td>
              <td className="px-3 py-2">{s.location ?? '-'}</td>
              <td className="px-3 py-2 text-right">
                <Button
                  variant="ghost"
                  onClick={() =>
                    remove.mutate(
                      { id: ekskulId, scheduleId: s.id },
                      {
                        onSuccess: () => toast.success('Jadwal dihapus.'),
                        onError: (e) => toast.error(apiErrorMessage(e)),
                      },
                    )
                  }
                >
                  Hapus
                </Button>
              </td>
            </tr>
          ))}
      </TableShell>

      <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
        <Field label="Hari">
          <Select
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mulai">
          <TextInput
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
        </Field>
        <Field label="Selesai">
          <TextInput
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
        </Field>
        <Field label="Lokasi">
          <TextInput
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </Field>
        <Button type="submit" disabled={add.isPending}>
          + Tambah Jadwal
        </Button>
      </form>
    </div>
  );
}

/* ---------------- Members ---------------- */
function MembersSection({ ekskulId, memberIds }: { ekskulId: string; memberIds: Set<string> }) {
  const { data: members } = useEkskulMembers(ekskulId, 1);
  const addMembers = useAddMembers();
  const removeMember = useRemoveMember();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get('/admin/students', {
        params: { search: q.trim(), isActive: 'true', pageSize: 10 },
      });
      setResults(data.data);
    } finally {
      setSearching(false);
    }
  }

  async function enroll(studentId: string) {
    try {
      await addMembers.mutateAsync({ id: ekskulId, studentIds: [studentId] });
      toast.success('Siswa didaftarkan.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
        Anggota ({members?.meta.total ?? 0})
      </h3>
      <TableShell
        head={
          <>
            <th className="px-3 py-2">NIS</th>
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2">Kelas</th>
            <th className="px-3 py-2 text-right">Aksi</th>
          </>
        }
      >
        {(members?.data.length ?? 0) === 0 && (
          <tr>
            <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
              Belum ada anggota.
            </td>
          </tr>
        )}
        {members?.data.map((m) => (
          <tr key={m.membershipId}>
            <td className="px-3 py-2 font-mono text-xs">{m.student.nis}</td>
            <td className="px-3 py-2">{m.student.fullName}</td>
            <td className="px-3 py-2">{m.student.classGrade}</td>
            <td className="px-3 py-2 text-right">
              <Button
                variant="ghost"
                onClick={() =>
                  removeMember.mutate(
                    { id: ekskulId, studentId: m.student.id },
                    {
                      onSuccess: () => toast.success('Anggota dikeluarkan.'),
                      onError: (e) => toast.error(apiErrorMessage(e)),
                    },
                  )
                }
              >
                Keluarkan
              </Button>
            </td>
          </tr>
        ))}
      </TableShell>

      <div className="mt-3">
        <div className="flex gap-2">
          <TextInput
            placeholder="Cari siswa (NIS / nama) untuk didaftarkan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
          />
          <Button type="button" variant="secondary" onClick={search} disabled={searching}>
            Cari
          </Button>
        </div>
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-700">
            {results.map((s) => {
              const already = memberIds.has(s.id);
              return (
                <li key={s.id} className="flex items-center justify-between px-3 py-2">
                  <span>
                    {s.fullName} · <span className="text-slate-500">{s.classGrade}</span>{' '}
                    <span className="font-mono text-xs text-slate-400">{s.nis}</span>
                  </span>
                  <Button
                    variant="ghost"
                    disabled={already || addMembers.isPending}
                    onClick={() => enroll(s.id)}
                  >
                    {already ? 'Sudah anggota' : 'Daftarkan'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
