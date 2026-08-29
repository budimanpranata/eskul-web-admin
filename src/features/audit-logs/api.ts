import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Paginated } from '@/lib/types';

export interface AuditLogRow {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditFilters {
  q?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function clean(f: AuditFilters): Record<string, string> {
  const p: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) if (v) p[k] = v;
  return p;
}

export function useAuditLogs(filters: AuditFilters, page: number, pageSize: number) {
  return useQuery({
    queryKey: ['audit-logs', filters, page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AuditLogRow>>('/admin/audit-logs', {
        params: { ...clean(filters), page, pageSize },
      });
      return data;
    },
  });
}

export function useAuditFacets() {
  return useQuery({
    queryKey: ['audit-facets'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await api.get<{ actions: string[]; entityTypes: string[] }>(
        '/admin/audit-logs/facets',
      );
      return data;
    },
  });
}
