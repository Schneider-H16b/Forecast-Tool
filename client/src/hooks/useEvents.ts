import { useQuery } from '@tanstack/react-query';
import { fetchEventsInRange, type PlanEventDto } from '../api/events';

function monthToRange(monthIso: string) {
  const d = new Date(monthIso + 'T00:00:00Z');
  const from = monthIso;
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const to = end.toISOString().slice(0, 10);
  return { from, to };
}

export function useEventsMonth(kind: 'production'|'montage'|'all', monthIso: string) {
  const { from, to } = monthToRange(monthIso);
  return useQuery<{ data: PlanEventDto[] }, Error, PlanEventDto[]>({
    queryKey: ['events','month', kind, monthIso],
    queryFn: async () => ({ data: await fetchEventsInRange({ from, to, kind: kind === 'all' ? undefined : kind }) }),
    select: (r)=>r.data,
  });
}
