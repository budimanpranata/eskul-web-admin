import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

import { Button } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import { mfaEnable, mfaSetup, type MfaSetup } from './api';
import { RecoveryCodes } from './RecoveryCodes';

export function MfaSetupPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const mfaSetupRequired = useAuthStore((s) => s.mfaSetupRequired);

  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  useEffect(() => {
    mfaSetup()
      .then(setSetup)
      .catch((e) => setLoadErr(apiErrorMessage(e)));
  }, []);

  async function onEnable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await mfaEnable(code.trim());
      // Sesi baru (tanpa flag pending) menggantikan yang lama.
      setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user as never,
        mfaSetupRequired: false,
      });
      setRecoveryCodes(res.recoveryCodes);
      toast.success('MFA aktif.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Kode tidak valid.'));
    } finally {
      setBusy(false);
    }
  }

  if (recoveryCodes) {
    return (
      <div className="mx-auto max-w-lg space-y-5 py-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">MFA aktif</h1>
        <RecoveryCodes codes={recoveryCodes} />
        <Button onClick={() => navigate('/', { replace: true })}>
          Saya sudah menyimpan — lanjutkan
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Aktifkan Verifikasi Dua Langkah
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mfaSetupRequired
            ? 'Akun admin wajib mengaktifkan MFA sebelum mengakses fitur lain.'
            : 'Tambahkan lapisan keamanan kedua untuk akun admin Anda.'}
        </p>
      </div>

      {loadErr && <p className="text-sm text-red-600">{loadErr}</p>}

      {setup && (
        <>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>
              Pindai QR ini dengan Google Authenticator / Authy:
              <div className="mt-2 inline-block rounded-lg bg-white p-3">
                <QRCodeSVG value={setup.otpauthUrl} size={168} />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Atau masukkan kunci manual:{' '}
                <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{setup.secret}</code>
              </div>
            </li>
            <li>Masukkan kode 6 digit yang muncul untuk mengonfirmasi:</li>
          </ol>

          <form onSubmit={onEnable} className="flex items-end gap-3">
            <label className="block text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Kode</span>
              <input
                autoFocus
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <Button type="submit" disabled={busy || code.trim().length < 6}>
              {busy ? 'Memverifikasi…' : 'Aktifkan'}
            </Button>
          </form>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
