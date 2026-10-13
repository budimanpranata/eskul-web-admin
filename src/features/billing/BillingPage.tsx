import { useMemo, useState } from 'react';

import { Button, Field, Modal, Pagination, Select, TableShell, TextInput } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useExtracurriculars } from '@/features/extracurriculars/api';
import {
  useBillingReport,
  useCancelInvoice,
  useGenerateInvoices,
  useInvoiceDetail,
  useInvoices,
  usePaymentQueue,
  useVerifyPayment,
  type GenerateInvoicesInput,
  type InvoiceStatus,
  type InvoiceSummary,
  type PaymentQueueRow,
} from './api';

const PAGE_SIZE = 20;

function formatIDR(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: 'Belum Bayar',
  PENDING_VERIFICATION: 'Menunggu Verifikasi',
  PAID: 'Lunas',
  CANCELLED: 'Dibatalkan',
};

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  UNPAID: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function StatusPill({ status }: { status: InvoiceStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>;
}

const TABS = ['Tagihan', 'Validasi Pembayaran', 'Laporan'] as const;
type Tab = (typeof TABS)[number];

export function BillingPage() {
  const [tab, setTab] = useState<Tab>('Tagihan');

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Tagihan Ekskul</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate tagihan per siswa, validasi pembayaran (transfer/cash), dan pantau siswa yang sudah/belum bayar.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t
                ? 'border-b-2 border-slate-800 text-slate-900 dark:border-slate-300 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Tagihan' && <InvoicesTab />}
      {tab === 'Validasi Pembayaran' && <PaymentsTab />}
      {tab === 'Laporan' && <ReportTab />}
    </section>
  );
}

// ================= TAB: Tagihan =================

function InvoicesTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [period, setPeriod] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [search, setSearch] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [detail, setDetail] = useState<InvoiceSummary | null>(null);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, status: status || undefined, period: period || undefined, classGrade: classGrade || undefined, search: search || undefined }),
    [page, status, period, classGrade, search],
  );
  const { data, isLoading, isError, error } = useInvoices(params);
  const cancel = useCancelInvoice();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TextInput
            placeholder="Cari nama/NIS siswa…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <TextInput
            placeholder="Periode (mis. 2026-10)"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPage(1);
            }}
            className="max-w-[10rem]"
          />
          <TextInput
            placeholder="Kelas"
            value={classGrade}
            onChange={(e) => {
              setClassGrade(e.target.value);
              setPage(1);
            }}
            className="max-w-[8rem]"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="max-w-[12rem]"
          >
            <option value="">Semua status</option>
            {(Object.keys(STATUS_LABEL) as InvoiceStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => setShowGenerate(true)}>+ Generate Tagihan</Button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <>
          <TableShell
            head={
              <>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Tagihan</th>
                <th className="px-3 py-2">Periode</th>
                <th className="px-3 py-2 text-right">Nominal</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </>
            }
          >
            {data.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  Tidak ada tagihan.
                </td>
              </tr>
            )}
            {data.data.map((inv) => (
              <tr key={inv.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2">
                  {inv.student.fullName}
                  <div className="text-xs text-slate-500">
                    {inv.student.classGrade} · {inv.student.nis}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {inv.title}
                  {inv.extracurricular && <div className="text-xs text-slate-500">{inv.extracurricular.name}</div>}
                </td>
                <td className="px-3 py-2 text-xs">{inv.period}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatIDR(inv.amount)}</td>
                <td className="px-3 py-2">
                  <StatusPill status={inv.status} />
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => setDetail(inv)}>
                      Detail
                    </Button>
                    {inv.status === 'UNPAID' && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          cancel.mutate(inv.id, {
                            onSuccess: () => toast.success('Tagihan dibatalkan.'),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          })
                        }
                      >
                        Batalkan
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </TableShell>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}

      {showGenerate && <GenerateInvoicesModal onClose={() => setShowGenerate(false)} />}
      {detail && <InvoiceDetailModal invoiceId={detail.id} onClose={() => setDetail(null)} />}
    </div>
  );
}

function GenerateInvoicesModal({ onClose }: { onClose: () => void }) {
  const ekskuls = useExtracurriculars({ page: 1, pageSize: 200 });
  const generate = useGenerateInvoices();
  const [form, setForm] = useState<GenerateInvoicesInput>({
    period: '',
    title: '',
    amount: 0,
    extracurricularId: '',
    classGrade: '',
    dueDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ created: number; skipped: number; totalMatched: number } | null>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.period.trim()) e.period = 'Periode wajib diisi.';
    if (!form.title.trim()) e.title = 'Judul tagihan wajib diisi.';
    if (!form.amount || form.amount <= 0) e.amount = 'Nominal harus lebih dari 0.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const res = await generate.mutateAsync({
        period: form.period,
        title: form.title,
        amount: Number(form.amount),
        extracurricularId: form.extracurricularId || undefined,
        classGrade: form.classGrade || undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
      });
      setResult(res as any);
      toast.success('Tagihan berhasil digenerate.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Modal open title="Generate Tagihan Massal" onClose={onClose}>
      {result ? (
        <div className="space-y-3 text-sm">
          <p>
            Dibuat: <strong>{result.created}</strong> tagihan baru. Dilewati (sudah ada): <strong>{result.skipped}</strong>. Total
            siswa cocok: <strong>{result.totalMatched}</strong>.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Tutup</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Periode (bebas, mis. 2026-10)" error={errors.period}>
              <TextInput value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </Field>
            <Field label="Nominal (Rp)" error={errors.amount}>
              <TextInput
                type="number"
                min={1}
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Judul Tagihan" error={errors.title}>
            <TextInput
              placeholder="mis. SPP Futsal Oktober 2026"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ekstrakurikuler (opsional — kosong = tagihan umum)">
              <Select
                value={form.extracurricularId}
                onChange={(e) => setForm({ ...form, extracurricularId: e.target.value })}
              >
                <option value="">Semua siswa (tagihan umum)</option>
                {ekskuls.data?.data.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Filter Kelas (opsional)">
              <TextInput
                placeholder="mis. 4A"
                value={form.classGrade}
                onChange={(e) => setForm({ ...form, classGrade: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Jatuh Tempo (opsional)">
            <TextInput type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          <p className="text-xs text-slate-500">
            Bila ekstrakurikuler dipilih: tagihan dibuat untuk anggota aktif ekskul tsb saja. Bila kosong: tagihan dibuat untuk
            semua siswa aktif (atau sesuai filter kelas). Siswa yang sudah punya tagihan periode &amp; ekskul yang sama akan
            dilewati otomatis — aman dijalankan berulang.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={generate.isPending}>
              {generate.isPending ? 'Memproses…' : 'Generate'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function InvoiceDetailModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const { data: loaded, isLoading, isError, error } = useInvoiceDetail(invoiceId);

  return (
    <Modal open title="Detail Tagihan" onClose={onClose} wide>
      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}
      {loaded && (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Siswa</span>
              <div>
                {loaded.student.fullName} ({loaded.student.classGrade} · {loaded.student.nis})
              </div>
            </div>
            <div>
              <span className="text-slate-500">Tagihan</span>
              <div>
                {loaded.title} — {formatIDR(loaded.amount)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Periode</span>
              <div>{loaded.period}</div>
            </div>
            <div>
              <span className="text-slate-500">Status</span>
              <div>
                <StatusPill status={loaded.status} />
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">Riwayat Pembayaran</h3>
            {loaded.payments.length === 0 ? (
              <p className="text-slate-500">Belum ada pengajuan pembayaran.</p>
            ) : (
              <ul className="space-y-2">
                {loaded.payments.map((p) => (
                  <li key={p.id} className="rounded-md border border-slate-200 p-2 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.method === 'TRANSFER' ? 'Transfer' : 'Tunai'}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : p.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Diajukan {p.submittedByName} · {new Date(p.submittedAt).toLocaleString('id-ID')}
                    </div>
                    {p.note && <div className="text-xs italic text-slate-500">"{p.note}"</div>}
                    {p.hasProof && p.proofUrl && (
                      <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                        Lihat bukti transfer
                      </a>
                    )}
                    {p.rejectionReason && <div className="text-xs text-red-600">Alasan tolak: {p.rejectionReason}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ================= TAB: Validasi Pembayaran =================

function PaymentsTab() {
  const [status, setStatus] = useState('PENDING');
  const { data, isLoading, isError, error } = usePaymentQueue(status);
  const verify = useVerifyPayment();
  const [rejecting, setRejecting] = useState<PaymentQueueRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[12rem]">
          <option value="PENDING">Menunggu Verifikasi</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <TableShell
          head={
            <>
              <th className="px-3 py-2">Siswa</th>
              <th className="px-3 py-2">Tagihan</th>
              <th className="px-3 py-2">Metode</th>
              <th className="px-3 py-2 text-right">Nominal</th>
              <th className="px-3 py-2">Diajukan</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </>
          }
        >
          {data.data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                Tidak ada pengajuan.
              </td>
            </tr>
          )}
          {data.data.map((p) => (
            <tr key={p.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="px-3 py-2">
                {p.invoice.student.fullName}
                <div className="text-xs text-slate-500">
                  {p.invoice.student.classGrade} · {p.invoice.student.nis}
                </div>
              </td>
              <td className="px-3 py-2">
                {p.invoice.title}
                <div className="text-xs text-slate-500">{p.invoice.period}</div>
              </td>
              <td className="px-3 py-2">
                {p.method === 'TRANSFER' ? 'Transfer' : 'Tunai'}
                {p.hasProof && p.proofUrl && (
                  <div>
                    <a href={p.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                      Lihat bukti
                    </a>
                  </div>
                )}
                {p.note && <div className="text-xs italic text-slate-500">"{p.note}"</div>}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatIDR(p.amount)}</td>
              <td className="px-3 py-2 text-xs">
                {p.submittedByName}
                <div className="text-slate-500">{new Date(p.submittedAt).toLocaleString('id-ID')}</div>
              </td>
              <td className="px-3 py-2 text-right">
                {p.status === 'PENDING' ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        verify.mutate(
                          { id: p.id, decision: 'APPROVED' },
                          {
                            onSuccess: () => toast.success('Pembayaran disetujui.'),
                            onError: (e) => toast.error(apiErrorMessage(e)),
                          },
                        )
                      }
                    >
                      Setujui
                    </Button>
                    <Button variant="danger" onClick={() => setRejecting(p)}>
                      Tolak
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{p.status}</span>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      {rejecting && (
        <RejectPaymentModal
          payment={rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) =>
            verify.mutate(
              { id: rejecting.id, decision: 'REJECTED', reason },
              {
                onSuccess: () => {
                  toast.success('Pembayaran ditolak.');
                  setRejecting(null);
                },
                onError: (e) => toast.error(apiErrorMessage(e)),
              },
            )
          }
        />
      )}
    </div>
  );
}

function RejectPaymentModal({
  payment,
  onClose,
  onConfirm,
}: {
  payment: PaymentQueueRow;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal open title={`Tolak Pembayaran — ${payment.invoice.student.fullName}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Alasan penolakan (opsional)">
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="mis. nominal tidak sesuai" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" onClick={() => onConfirm(reason)}>
            Tolak Pembayaran
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ================= TAB: Laporan =================

function ReportTab() {
  const ekskuls = useExtracurriculars({ page: 1, pageSize: 200 });
  const [draft, setDraft] = useState({ period: '', extracurricularId: '', classGrade: '' });
  const [applied, setApplied] = useState<typeof draft | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useBillingReport(
    { page, pageSize: PAGE_SIZE, ...(applied ?? {}) },
    applied !== null,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-4">
        <Field label="Periode">
          <TextInput
            placeholder="mis. 2026-10 (kosong = semua)"
            value={draft.period}
            onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value }))}
          />
        </Field>
        <Field label="Ekstrakurikuler">
          <Select
            value={draft.extracurricularId}
            onChange={(e) => setDraft((d) => ({ ...d, extracurricularId: e.target.value }))}
          >
            <option value="">Semua ekskul</option>
            {ekskuls.data?.data.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Kelas">
          <TextInput value={draft.classGrade} onChange={(e) => setDraft((d) => ({ ...d, classGrade: e.target.value }))} />
        </Field>
        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={() => {
              setPage(1);
              setApplied({ ...draft });
            }}
          >
            Tampilkan
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Belum Bayar" count={data.summary.unpaid.count} amount={data.summary.unpaid.amount} tone="slate" />
            <SummaryCard
              label="Menunggu Verifikasi"
              count={data.summary.pendingVerification.count}
              amount={data.summary.pendingVerification.amount}
              tone="amber"
            />
            <SummaryCard label="Lunas" count={data.summary.paid.count} amount={data.summary.paid.amount} tone="emerald" />
            <SummaryCard label="Dibatalkan" count={data.summary.cancelled.count} amount={data.summary.cancelled.amount} tone="red" />
          </div>

          <TableShell
            head={
              <>
                <th className="px-3 py-2">Siswa</th>
                <th className="px-3 py-2">Tagihan</th>
                <th className="px-3 py-2">Periode</th>
                <th className="px-3 py-2 text-right">Nominal</th>
                <th className="px-3 py-2">Status</th>
              </>
            }
          >
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  Tidak ada data untuk filter ini.
                </td>
              </tr>
            )}
            {data.rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-3 py-2">
                  {r.student.fullName}
                  <div className="text-xs text-slate-500">
                    {r.student.classGrade} · {r.student.nis}
                  </div>
                </td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2 text-xs">{r.period}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatIDR(r.amount)}</td>
                <td className="px-3 py-2">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
          </TableShell>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  amount,
  tone,
}: {
  label: string;
  count: number;
  amount: number;
  tone: 'slate' | 'amber' | 'emerald' | 'red';
}) {
  const toneCls: Record<string, string> = {
    slate: 'border-slate-200 dark:border-slate-700',
    amber: 'border-amber-300 dark:border-amber-700',
    emerald: 'border-emerald-300 dark:border-emerald-700',
    red: 'border-red-300 dark:border-red-700',
  };
  return (
    <div className={`rounded-lg border p-4 ${toneCls[tone]}`}>
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{count}</div>
      <div className="text-xs text-slate-500">{formatIDR(amount)}</div>
    </div>
  );
}
