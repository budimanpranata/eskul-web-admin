import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Paginated, School } from '@/lib/types';

const KEY = 'schools';

export interface SchoolListParams {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: string;
}

export interface CreateSchoolInput {
  code: string;
  name: string;
  adminFullName: string;
  adminEmail: string;
  adminPhoneNumber?: string;
  adminPassword: string;
}

export interface AddSchoolAdminInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export function useSchools(params: SchoolListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<School>>('/admin/schools', {
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

export function useCreateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSchoolInput) => api.post('/admin/schools', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.put(`/admin/schools/${id}`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useToggleSchoolActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? api.post(`/admin/schools/${id}/resume`) : api.post(`/admin/schools/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAddSchoolAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddSchoolAdminInput }) =>
      api.post(`/admin/schools/${id}/admins`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
