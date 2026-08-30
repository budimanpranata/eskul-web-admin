import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, apiErrorMessage } from '@/lib/api';
import { isAdminRole, useAuthStore } from '@/stores/authStore';

const inputCls =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Langkah 2 (MFA)
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState('');

  function finish(data: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; fullName: string; role: string };
    mfaSetupRequired?: boolean;
  }) {
    if (!isAdminRole(data.user.role as never)) {
      setError('Akun ini bukan Administrator.');
      return;
    }
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user as never,
      mfaSetupRequired: Boolean(data.mfaSetupRequired),
    });
    navigate(data.mfaSetupRequired ? '/security/mfa-setup' : '/', { replace: true });
  }

  async function onSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      if (data.mfaRequired) {
        setMfaToken(data.mfaToken);
        setCode('');
      } else {
        finish(data);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal masuk.'));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/mfa', { mfaToken, code: code.trim() });
      finish(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Kode MFA tidak valid.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      {mfaToken === null ? (
        <form
          onSubmit={onSubmitPassword}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Masuk — Admin Ekskul SD
          </h1>
          <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email / No. HP
            <input
              type="text"
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </label>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !identifier || !password}
            className="mt-5 w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700"
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>
      ) : (
        <form
          onSubmit={onSubmitMfa}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Verifikasi dua langkah
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Masukkan kode 6 digit dari aplikasi authenticator Anda, atau salah satu kode pemulihan.
          </p>
          <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kode
            <input
              type="text"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${inputCls} tracking-widest`}
              placeholder="123456"
            />
          </label>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.trim().length < 6}
            className="mt-5 w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700"
          >
            {loading ? 'Memverifikasi…' : 'Verifikasi'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMfaToken(null);
              setError(null);
            }}
            className="mt-2 w-full text-xs text-slate-500 hover:text-slate-700"
          >
            ← kembali
          </button>
        </form>
      )}
    </div>
  );
}
