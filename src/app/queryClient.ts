import { QueryClient } from '@tanstack/react-query';

/**
 * Instance TanStack Query global.
 * Server state (data dari API) dikelola di sini — bukan di Zustand.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
