interface PagePlaceholderProps {
  title: string;
  description: string;
}

/**
 * Komponen placeholder untuk halaman yang belum diimplementasikan (Fase 0).
 * Diganti dengan konten nyata pada fase masing-masing.
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
        Kerangka halaman — konten diisi pada fase terkait.
      </div>
    </section>
  );
}
