import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api, apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      if (data.user.role !== 'ADMIN') {
        setError('Akun ini bukan Administrator.');
        return;
      }
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal masuk.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <form
        onSubmit={onSubmit}
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
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
    </div>
  );
}
