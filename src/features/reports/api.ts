import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Paginated } from '@/lib/types';

export interface ReportFilters {
  classGrade?: string;
  extracurricularId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AttendanceReportRow {
  studentId: string;
  nis: string;
  studentName: string;
  classGrade: string;
  extracurricularId: string;
  extracurricularName: string;
  category: string | null;
  coachName: string | null;
  totalSessions: number;
  recordedSessions: number;
  present: number;
  izin: number;
  sakit: number;
  alpa: number;
  attendancePct: number;
  avgActiveness: number | null;
  notes: string[];
}

export type ExportStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface ReportExport {
  id: string;
  format: 'pdf' | 'xlsx';
  reportType: string;
  filters: ReportFilters;
  status: ExportStatus;
  fileName: string | null;
  fileSize: number | null;
  rowCount: number | null;
  errorMessage: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
  requestedBy?: { fullName: string };
  downloadUrl: string | null;
  downloadExpiresAt: string | null;
}

type PreviewMeta = Paginated<AttendanceReportRow>['meta'] & { dateFrom: string; dateTo: string };

function cleanParams(f: ReportFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.classGrade) p.classGrade = f.classGrade;
  if (f.extracurricularId) p.extracurricularId = f.extracurricularId;
  if (f.dateFrom) p.dateFrom = f.dateFrom;
  if (f.dateTo) p.dateTo = f.dateTo;
  return p;
}

export function useReportPreview(filters: ReportFilters, page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: ['report-preview', filters, page, pageSize],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ data: AttendanceReportRow[]; meta: PreviewMeta }>(
        '/admin/reports/attendance/preview',
        { params: { ...cleanParams(filters), page, pageSize } },
      );
      return data;
    },
  });
}

export function useRequestExport() {
  return useMutation({
    mutationFn: async (args: ReportFilters & { format: 'pdf' | 'xlsx' }) => {
      const { format, ...filters } = args;
      const { data } = await api.get<ReportExport>('/admin/reports/attendance', {
        params: { ...cleanParams(filters), format },
      });
      return data;
    },
  });
}

/** Polling status export; berhenti begitu READY/FAILED. */
export function useExportStatus(id: string | null) {
  return useQuery({
    queryKey: ['report-export', id],
    enabled: Boolean(id),
    refetchInterval: (q) => {
      const s = (q.state.data as ReportExport | undefined)?.status;
      return s === 'READY' || s === 'FAILED' ? false : 1500;
    },
    queryFn: async () => {
      const { data } = await api.get<ReportExport>(`/admin/reports/exports/${id}`);
      return data;
    },
  });
}

export function useRecentExports() {
  return useQuery({
    queryKey: ['report-exports'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ReportExport>>('/admin/reports/exports', {
        params: { page: 1, pageSize: 10 },
      });
      return data;
    },
    refetchInterval: 4000,
  });
}
