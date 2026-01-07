import { useQuery } from '@tanstack/react-query';
import { fetchDashboardMetrics } from '../api/dashboard';

export function useDashboardMetrics(from: string, to: string) {
  return useQuery({
    queryKey: ['dashboard','metrics', from, to],
    queryFn: () => fetchDashboardMetrics(from, to),
    staleTime: 60_000,
  });
}
