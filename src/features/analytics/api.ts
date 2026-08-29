import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface AnalyticsOverview {
  generatedAt: string;
  cached: boolean;
  range: { weeks: number; from: string; to: string };
  kpi: {
    activeStudents: number;
    activeExtracurriculars: number;
    studentsInAnyExtracurricular: number;
    avgAttendancePctWindow: number;
    pendingParentRelations: number;
  };
  participationByCategory: {
    category: string;
    extracurriculars: number;
    memberships: number;
    distinctStudents: number;
  }[];
  attendanceTrend: {
    weekStart: string;
    label: string;
    avgAttendancePct: number;
    sessions: number;
    records: number;
  }[];
  lowAttendanceByExtracurricular: {
    extracurricularId: string;
    extracurricularName: string;
    students: {
      studentId: string;
      nis: string;
      fullName: string;
      classGrade: string;
      recordedSessions: number;
      present: number;
      attendancePct: number;
    }[];
  }[];
}

export function useAnalyticsOverview(fresh: boolean) {
  return useQuery({
    queryKey: ['analytics-overview', fresh],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await api.get<AnalyticsOverview>('/admin/analytics/overview', {
        params: fresh ? { fresh: 1 } : {},
      });
      return data;
    },
  });
}
