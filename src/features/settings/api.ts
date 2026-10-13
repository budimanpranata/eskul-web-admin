import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface Branding {
  appName: string;
  logoUrl: string | null;
}

const KEY = 'branding';

/** Publik — bisa dipanggil sebelum login (dipakai juga oleh LoginPage). */
export function useBranding() {
  return useQuery({
    queryKey: [KEY],
    queryFn: async () => {
      const { data } = await api.get<Branding>('/settings/branding');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appName, logo }: { appName?: string; logo?: File }) => {
      const form = new FormData();
      if (appName !== undefined) form.append('appName', appName);
      if (logo) form.append('logo', logo);
      const { data } = await api.put<Branding>('/admin/settings/branding', form);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
