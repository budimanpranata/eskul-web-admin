import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Coach, Paginated } from '@/lib/types';

const KEY = 'coaches';

export interface CoachListParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: string;
}

export interface CreateCoachInput {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  employeeNumber?: string;
  specialization?: string;
  bio?: string;
}
export type UpdateCoachInput = Partial<Omit<CreateCoachInput, 'password'>>;

export function useCoaches(params: CoachListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Coach>>('/admin/coaches', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search || undefined,
          isActive: params.isActive || undefined,
        },
      });
      return data;
    },
  });
}

export function useCreateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCoachInput) => api.post('/admin/coaches', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCoachInput }) =>
      api.put(`/admin/coaches/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useToggleCoachActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? api.post(`/admin/coaches/${id}/reactivate`) : api.delete(`/admin/coaches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
