import { useState } from 'react';

import { Button, Field, Modal, Select, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { ExtracurricularListItem } from '@/lib/types';
import { useCoaches } from '@/features/coaches/api';
import { useCreateEkskul, useUpdateEkskul, type EkskulInput } from './api';

export function EkskulFormModal({
  ekskul,
  onClose,
}: {
  ekskul: ExtracurricularListItem | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(ekskul);
  const create = useCreateEkskul();
  const update = useUpdateEkskul();
  const { data: coaches } = useCoaches({ page: 1, pageSize: 100, isActive: 'true' });

  const [form, setForm] = useState<EkskulInput>({
    name: ekskul?.name ?? '',
    category: ekskul?.category ?? '',
    description: ekskul?.description ?? '',
    defaultCoachId: ekskul?.defaultCoachId ?? '',
    maxCapacity: ekskul?.maxCapacity ?? undefined,
  });
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nama ekskul wajib diisi.');
      return;
    }
    const payload: EkskulInput = {
      name: form.name.trim(),
      category: form.category?.trim() || undefined,
      description: form.description?.trim() || undefined,
      defaultCoachId: form.defaultCoachId || undefined,
      maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined,
    };
    try {
      if (isEdit && ekskul) await update.mutateAsync({ id: ekskul.id, input: payload });
      else await create.mutateAsync(payload);
      toast.success(isEdit ? 'Ekskul diperbarui.' : 'Ekskul ditambahkan.');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const busy = create.isPending || update.isPending;

  return (
    <Modal open title={isEdit ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nama" error={error ?? undefined}>
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            <TextInput
              placeholder="OLAHRAGA / SENI / AKADEMIK"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          <Field label="Kapasitas Maks.">
            <TextInput
              type="number"
              min={1}
              value={form.maxCapacity ?? ''}
              onChange={(e) =>
                setForm({ ...form, maxCapacity: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </Field>
        </div>
        <Field label="Pembina Default">
          <Select
            value={form.defaultCoachId}
            onChange={(e) => setForm({ ...form, defaultCoachId: e.target.value })}
          >
            <option value="">- tidak ditentukan -</option>
            {coaches?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.user.fullName}
                {c.specialization ? ` (${c.specialization})` : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Deskripsi">
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
