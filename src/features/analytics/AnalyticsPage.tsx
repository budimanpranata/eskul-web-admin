import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button, TableShell } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api';
import { useAnalyticsOverview } from './api';

const AXIS = '#94a3b8';
const GRID = 'rgba(148,163,184,0.25)';
const BAR = '#2F6FB0';
const LINE = '#1E6F5C';

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
      {children}
    </div>
  );
}

export function AnalyticsPage() {
  const [fresh, setFresh] = useState(false);
  const { data, isLoading, isError, error, isFetching, refetch } = useAnalyticsOverview(fresh);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Dashboard Analitik Sekolah
        </h1>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {data && (
            <span>
              Data per {new Date(data.generatedAt).toLocaleString('id-ID')}
              {data.cached ? ' · dari cache' : ' · baru dihitung'}
            </span>
          )}
          <Button
            variant="secondary"
            disabled={isFetching}
            onClick={() => {
              setFresh(true);
              void refetch();
            }}
          >
            {isFetching ? 'Menyegarkan…' : 'Segarkan'}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat analitik…</p>}
      {isError && <p className="text-sm text-red-600">{apiErrorMessage(error)}</p>}

      {data && (
        <>
          <p className="text-xs text-slate-500">
            Periode analisis: {data.range.from} s/d {data.range.to} ({data.range.weeks} minggu terakhir)
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Siswa aktif" value={data.kpi.activeStudents} />
            <Kpi
              label="Ikut ekskul"
              value={data.kpi.studentsInAnyExtracurricular}
              sub={`${data.kpi.activeExtracurriculars} ekskul aktif`}
            />
            <Kpi label="Rata-rata kehadiran" value={`${data.kpi.avgAttendancePctWindow}%`} sub="8 minggu" />
            <Kpi label="Relasi ortu pending" value={data.kpi.pendingParentRelations} />
            <Kpi
              label="Ekskul dgn sesi"
              value={data.attendanceTrend.reduce((a, w) => a + w.sessions, 0)}
              sub="total sesi 8 minggu"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Partisipasi siswa per jenis ekstrakurikuler">
              {data.participationByCategory.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data keanggotaan.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.participationByCategory} margin={{ left: -12, right: 8 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="category" stroke={AXIS} fontSize={11} tickLine={false} />
                    <YAxis stroke={AXIS} fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      formatter={(v: number, n) => [v, n === 'memberships' ? 'Keanggotaan' : 'Siswa unik']}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="memberships" fill={BAR} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel title="Tren kehadiran rata-rata sekolah (8 minggu)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.attendanceTrend} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" stroke={AXIS} fontSize={11} tickLine={false} />
                  <YAxis
                    stroke={AXIS}
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 100]}
                    unit="%"
                    width={44}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, 'Kehadiran']}
                    labelFormatter={(l) => `Minggu ${l}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgAttendancePct"
                    stroke={LINE}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <Panel title="Top-5 siswa dengan kehadiran terendah per ekskul (tindak lanjut BK / wali kelas)">
            {data.lowAttendanceByExtracurricular.length === 0 ? (
              <p className="text-sm text-slate-500">
                Belum ada sesi presensi dalam periode ini.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.lowAttendanceByExtracurricular.map((ek) => (
                  <div key={ek.extracurricularId}>
                    <h3 className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {ek.extracurricularName}
                    </h3>
                    <TableShell
                      head={
                        <>
                          <th className="px-3 py-2">Siswa</th>
                          <th className="px-3 py-2 text-right">Hadir/Sesi</th>
                          <th className="px-3 py-2 text-right">% Hadir</th>
                        </>
                      }
                    >
                      {ek.students.map((s) => (
                        <tr key={s.studentId}>
                          <td className="px-3 py-2">
                            {s.fullName}
                            <div className="text-xs text-slate-500">
                              {s.classGrade} · {s.nis}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {s.present}/{s.recordedSessions}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-medium tabular-nums ${
                              s.attendancePct < 50 ? 'text-red-600' : 'text-amber-600'
                            }`}
                          >
                            {s.attendancePct}%
                          </td>
                        </tr>
                      ))}
                    </TableShell>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </section>
  );
}
