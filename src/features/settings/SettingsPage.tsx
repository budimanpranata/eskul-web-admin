import { useRef, useState } from 'react';

import { Button, Field, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import { useBranding, useUpdateBranding } from './api';

/**
 * Pengaturan tampilan aplikasi (nama + logo di layar login) — khusus
 * ADMIN_SUPER, berlaku platform-wide (bukan per-sekolah).
 */
export function SettingsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data: branding, isLoading } = useBranding();
  const update = useUpdateBranding();

  const [appName, setAppName] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (role !== 'ADMIN_SUPER') {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Halaman Pengaturan Tampilan hanya untuk akun <strong>ADMIN_SUPER</strong>.
      </p>
    );
  }

  const effectiveName = touchedName ? appName : (branding?.appName ?? '');
  const effectiveLogo = preview ?? branding?.logoUrl ?? '/logo-default.png';

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 2 MB.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onSave() {
    try {
      await update.mutateAsync({
        appName: touchedName ? appName : undefined,
        logo: file ?? undefined,
      });
      toast.success('Pengaturan tampilan disimpan.');
      setFile(null);
      setPreview(null);
      setTouchedName(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function onResetName() {
    try {
      await update.mutateAsync({ appName: '' });
      toast.success('Nama aplikasi dikembalikan ke default.');
      setTouchedName(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <section className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Pengaturan Tampilan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Nama aplikasi &amp; logo yang tampil di layar login (web admin &amp; mobile). Berlaku untuk
          semua sekolah. Kosongkan untuk pakai bawaan ("Eskul" + logo default).
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : (
        <div className="space-y-5 rounded-lg border border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src={effectiveLogo}
              alt="Logo aplikasi"
              className="h-20 w-20 rounded-lg border border-slate-200 object-contain p-1 dark:border-slate-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-default.png';
              }}
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={onPickFile}
                className="text-sm text-slate-600 dark:text-slate-300"
              />
              <p className="mt-1 text-xs text-slate-500">PNG/JPEG/WebP/SVG, maksimal 2 MB.</p>
            </div>
          </div>

          <Field label="Nama Aplikasi">
            <div className="flex gap-2">
              <TextInput
                placeholder="Eskul"
                value={effectiveName}
                onChange={(e) => {
                  setAppName(e.target.value);
                  setTouchedName(true);
                }}
              />
              {branding?.appName && branding.appName !== 'Eskul' && (
                <Button type="button" variant="secondary" onClick={onResetName} disabled={update.isPending}>
                  Reset
                </Button>
              )}
            </div>
          </Field>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={update.isPending || (!touchedName && !file)}>
              {update.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
