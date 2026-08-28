/**
 * Halaman Login Web Admin.
 * FASE 0: kerangka form (tanpa submit nyata). Integrasi POST /api/v1/auth/login
 * + guard MFA admin dikerjakan di Fase 1.1 / 4.2.
 */
export function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <form className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Masuk — Admin Ekskul SD
        </h1>
        <p className="mt-1 text-sm text-slate-500">Kerangka Fase 0 — belum berfungsi.</p>

        <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Email / No. HP
          <input
            type="text"
            disabled
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
          <input
            type="password"
            disabled
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <button
          type="button"
          disabled
          className="mt-5 w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white opacity-60"
        >
          Masuk
        </button>
      </form>
    </div>
  );
}
