import { QRCodeSVG } from 'qrcode.react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { useStudentsForPrint } from './api';

/**
 * Halaman cetak kartu QR siswa. QR di-render dari `qr_token` (bukan NIS).
 * NIS ditampilkan kecil & samar sesuai kebijakan privasi (DoD Fase 2.2).
 */
export function QrCardsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const classGrade = params.get('classGrade') ?? '';
  const search = params.get('search') ?? '';

  const { data: students, isLoading, isError, error } = useStudentsForPrint({ classGrade, search });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Cetak Kartu QR Siswa
          </h1>
          <p className="text-sm text-slate-500">
            {classGrade ? `Kelas ${classGrade}` : 'Semua kelas'}
            {search ? ` · pencarian "${search}"` : ''} · {students?.length ?? 0} kartu
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Kembali
          </Button>
          <Button onClick={() => window.print()}>Cetak</Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {students && students.length === 0 && (
        <p className="text-sm text-slate-500">Tidak ada siswa untuk kriteria ini.</p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 print:grid-cols-3">
        {students?.map((s) => (
          <div
            key={s.id}
            className="flex break-inside-avoid flex-col items-center gap-2 rounded-lg border border-slate-300 bg-white p-4 text-center"
          >
            {s.photoUrl ? (
              <img
                src={s.photoUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
                {s.fullName.charAt(0)}
              </div>
            )}
            <div className="font-semibold text-slate-800">{s.fullName}</div>
            <div className="text-sm text-slate-600">Kelas {s.classGrade}</div>
            <QRCodeSVG value={s.qrToken} size={132} className="my-1" />
            <div className="text-[10px] tracking-wide text-slate-400">NIS {s.nis}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
