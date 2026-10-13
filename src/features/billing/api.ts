import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Paginated } from '@/lib/types';

const KEY = 'billing';

export interface InvoiceStudent {
  id: string;
  nis: string;
  fullName: string;
  classGrade: string;
}

export type InvoiceStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'TRANSFER' | 'CASH';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LatestPayment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  submittedAt: string;
  verifiedAt: string | null;
}

export interface InvoiceSummary {
  id: string;
  period: string;
  title: string;
  amount: number;
  dueDate: string | null;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  student: InvoiceStudent;
  extracurricular: { id: string; name: string } | null;
  latestPayment: LatestPayment | null;
}

export interface InvoicePaymentDetail {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  note: string | null;
  hasProof: boolean;
  proofUrl: string | null;
  submittedAt: string;
  submittedByName: string;
  verifiedAt: string | null;
  verifiedByName: string | null;
  rejectionReason: string | null;
}

export interface InvoiceDetail extends InvoiceSummary {
  payments: InvoicePaymentDetail[];
}

export interface PaymentQueueRow {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  note: string | null;
  hasProof: boolean;
  proofUrl: string | null;
  submittedAt: string;
  submittedByName: string;
  invoice: { id: string; title: string; period: string; student: InvoiceStudent };
}

export interface BillingReportSummary {
  totalInvoices: number;
  totalAmount: number;
  unpaid: { count: number; amount: number };
  pendingVerification: { count: number; amount: number };
  paid: { count: number; amount: number };
  cancelled: { count: number; amount: number };
}

export interface InvoiceListParams {
  page: number;
  pageSize: number;
  status?: string;
  period?: string;
  classGrade?: string;
  extracurricularId?: string;
  search?: string;
}

export interface GenerateInvoicesInput {
  period: string;
  title: string;
  amount: number;
  extracurricularId?: string;
  classGrade?: string;
  dueDate?: string;
  notes?: string;
}

function clean(p: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') out[k] = String(v);
  return out;
}

export function useInvoices(params: InvoiceListParams) {
  return useQuery({
    queryKey: [KEY, 'invoices', params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<InvoiceSummary>>('/admin/billing/invoices', {
        params: clean(params as unknown as Record<string, unknown>),
      });
      return data;
    },
  });
}

export function useGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateInvoicesInput) => api.post('/admin/billing/invoices/generate', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useInvoiceDetail(id: string | null) {
  return useQuery({
    queryKey: [KEY, 'invoice', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<InvoiceDetail>(`/admin/billing/invoices/${id}`);
      return data;
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/billing/invoices/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function usePaymentQueue(status: string) {
  return useQuery({
    queryKey: [KEY, 'payments', status],
    queryFn: async () => {
      const { data } = await api.get<Paginated<PaymentQueueRow>>('/admin/billing/payments', {
        params: clean({ status, page: 1, pageSize: 50 }),
      });
      return data;
    },
    refetchInterval: 15_000,
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      api.put(`/admin/billing/payments/${id}/verify`, { decision, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export interface BillingReportParams {
  page: number;
  pageSize: number;
  period?: string;
  extracurricularId?: string;
  classGrade?: string;
}

export function useBillingReport(params: BillingReportParams, enabled: boolean) {
  return useQuery({
    queryKey: [KEY, 'report', params],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ summary: BillingReportSummary; rows: InvoiceSummary[]; meta: Paginated<unknown>['meta'] }>(
        '/admin/billing/report',
        { params: clean(params as unknown as Record<string, unknown>) },
      );
      return data;
    },
  });
}
