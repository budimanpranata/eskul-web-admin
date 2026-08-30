import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { mfaDisable, mfaRegenerate, useMfaStatus } from './api';
import { RecoveryCodes } from './RecoveryCodes';

export function SecurityPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useMfaStatus();
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function doDisable() {
    const code = prompt('Masukkan kode MFA / kode pemulihan untuk menonaktifkan:');
    if (!code) return;
    setBusy(true);
    try {
      await mfaDisable(code.trim());
      toast.success('MFA dinonaktifkan.');
      await qc.invalidateQueries({ queryKey: ['mfa-status'] });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function doRegenerate() {
    const code = prompt('Masukkan kode MFA / kode pemulihan untuk membuat ulang:');
    if (!code) return;
    setBusy(true);
    try {
      const res = await mfaRegenerate(code.trim());
      setNewCodes(res.recoveryCodes);
      await qc.invalidateQueries({ queryKey: ['mfa-status'] });
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Keamanan Akun</h1>
        <p className="mt-1 text-sm text-slate-500">Verifikasi dua langkah (MFA) berbasis TOTP.</p>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Status MFA</div>
              <div className="text-xs text-slate-500">
                {data.enabled
                  ? `Aktif sejak ${data.enabledAt ? new Date(data.enabledAt).toLocaleString('id-ID') : '-'} · ${data.recoveryCodesRemaining} kode pemulihan tersisa`
                  : data.enforced
                    ? 'Belum aktif — wajib diaktifkan.'
                    : 'Belum aktif.'}
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                data.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {data.enabled ? 'AKTIF' : 'NONAKTIF'}
            </span>
          </div>

          {!data.enabled ? (
            <Button onClick={() => navigate('/security/mfa-setup')}>Aktifkan MFA</Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={busy} onClick={doRegenerate}>
                Buat ulang kode pemulihan
              </Button>
              <Button variant="danger" disabled={busy} onClick={doDisable}>
                Nonaktifkan MFA
              </Button>
            </div>
          )}
        </div>
      )}

      {newCodes && <RecoveryCodes codes={newCodes} />}
    </section>
  );
}
