import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Paginated, Student } from '@/lib/types';

export interface StudentListParams {
  page: number;
  pageSize: number;
  search?: string;
  classGrade?: string;
  isActive?: string;
}

export interface StudentInput {
  nis: string;
  fullName: string;
  classGrade: string;
  gender?: 'L' | 'P';
  dateOfBirth?: string;
}

const KEY = 'students';

export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Student>>('/admin/students', {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          search: params.search || undefined,
          classGrade: params.classGrade || undefined,
          isActive: params.isActive || undefined,
        },
      });
      return data;
    },
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StudentInput) => api.post('/admin/students', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StudentInput> }) =>
      api.put(`/admin/students/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useToggleStudentActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? api.post(`/admin/students/${id}/reactivate`) : api.delete(`/admin/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useImportStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post<{
        created: number;
        skipped: number;
        errors: { row: number; message: string }[];
      }>('/admin/students/import', fd);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
