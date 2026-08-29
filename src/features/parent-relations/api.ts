import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Paginated } from '@/lib/types';

export interface ParentRelation {
  id: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt: string | null;
  suspicious: boolean;
  parent: {
    relationType: string;
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
  };
  student: { id: string; nis: string; fullName: string; classGrade: string };
}

const KEY = 'parent-relations';

export function useParentRelations(params: { status: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<ParentRelation>>('/admin/parent-relations', {
        params,
      });
      return data;
    },
  });
}

export function useDecideRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: 'APPROVED' | 'REJECTED';
      reason?: string;
    }) => api.put(`/admin/parent-relations/${id}/approve`, { decision, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
