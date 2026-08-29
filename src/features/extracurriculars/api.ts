import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type {
  ExtracurricularDetail,
  ExtracurricularListItem,
  MemberItem,
  Paginated,
} from '@/lib/types';

const KEY = 'extracurriculars';

export interface EkskulListParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  isActive?: string;
}
export interface EkskulInput {
  name: string;
  category?: string;
  description?: string;
  defaultCoachId?: string;
  maxCapacity?: number;
}
export interface ScheduleInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
}

export function useExtracurriculars(params: EkskulListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ExtracurricularListItem>>('/admin/extracurriculars', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search || undefined,
          category: params.category || undefined,
          isActive: params.isActive || undefined,
        },
      });
      return data;
    },
  });
}

export function useExtracurricular(id: string | null) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ExtracurricularDetail>(`/admin/extracurriculars/${id}`);
      return data;
    },
  });
}

export function useEkskulMembers(id: string | null, page: number) {
  return useQuery({
    queryKey: [KEY, 'members', id, page],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Paginated<MemberItem>>(
        `/admin/extracurriculars/${id}/members`,
        { params: { page, pageSize: 50 } },
      );
      return data;
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCreateEkskul() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (input: EkskulInput) => api.post('/admin/extracurriculars', input),
    onSuccess: inv,
  });
}
export function useUpdateEkskul() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EkskulInput> }) =>
      api.put(`/admin/extracurriculars/${id}`, input),
    onSuccess: inv,
  });
}
export function useToggleEkskulActive() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active
        ? api.post(`/admin/extracurriculars/${id}/reactivate`)
        : api.delete(`/admin/extracurriculars/${id}`),
    onSuccess: inv,
  });
}
export function useAddSchedule() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ScheduleInput }) =>
      api.post(`/admin/extracurriculars/${id}/schedules`, input),
    onSuccess: inv,
  });
}
export function useRemoveSchedule() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, scheduleId }: { id: string; scheduleId: string }) =>
      api.delete(`/admin/extracurriculars/${id}/schedules/${scheduleId}`),
    onSuccess: inv,
  });
}
export function useAddMembers() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, studentIds }: { id: string; studentIds: string[] }) =>
      api.post(`/admin/extracurriculars/${id}/members`, { studentIds }),
    onSuccess: inv,
  });
}
export function useRemoveMember() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, studentId }: { id: string; studentId: string }) =>
      api.delete(`/admin/extracurriculars/${id}/members/${studentId}`),
    onSuccess: inv,
  });
}
