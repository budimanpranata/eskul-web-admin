import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
  pending: boolean;
  enforced: boolean;
  recoveryCodesRemaining: number;
}

export interface MfaSetup {
  secret: string;
  otpauthUrl: string;
  issuer: string;
  account: string;
}

export interface MfaEnableResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; fullName: string; role: string };
  recoveryCodes: string[];
}

export function useMfaStatus(enabled = true) {
  return useQuery({
    queryKey: ['mfa-status'],
    enabled,
    queryFn: async () => (await api.get<MfaStatus>('/auth/mfa/status')).data,
  });
}

export const mfaSetup = () => api.post<MfaSetup>('/auth/mfa/setup').then((r) => r.data);
export const mfaEnable = (code: string) =>
  api.post<MfaEnableResult>('/auth/mfa/enable', { code }).then((r) => r.data);
export const mfaDisable = (code: string) => api.post('/auth/mfa/disable', { code });
export const mfaRegenerate = (code: string) =>
  api.post<{ recoveryCodes: string[] }>('/auth/mfa/recovery-codes', { code }).then((r) => r.data);
