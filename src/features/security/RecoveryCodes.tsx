import { toast } from '@/lib/toast';

/** Daftar kode pemulihan MFA + tombol salin. Tampil sekali saja. */
export function RecoveryCodes({ codes }: { codes: string[] }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Simpan {codes.length} kode pemulihan ini di tempat aman. Tiap kode hanya bisa dipakai
        <strong> sekali</strong> dan tidak akan ditampilkan lagi.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((c) => (
          <span
            key={c}
            className="rounded bg-white px-2 py-1 text-center text-slate-800 dark:bg-slate-800 dark:text-slate-100"
          >
            {c}
          </span>
        ))}
      </div>
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(codes.join('\n'));
          toast.success('Kode pemulihan disalin.');
        }}
        className="mt-3 text-xs font-medium text-amber-800 underline dark:text-amber-200"
      >
        Salin semua
      </button>
    </div>
  );
}
