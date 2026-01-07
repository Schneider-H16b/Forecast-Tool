import { useQuery } from '@tanstack/react-query';
import { fetchCapacity } from '../api/capacity';

function monthDays(monthIso: string) {
  const d = new Date(monthIso + 'T00:00:00Z');
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), i + 1));
    return date.toISOString().slice(0, 10);
  });
}

export function useCapacityMonth(kind: 'production'|'montage', monthIso: string) {
  const days = monthDays(monthIso);
  return useQuery<{ data: Record<string, number> }, Error, Record<string, number>>({
    queryKey: ['capacity','month', kind, monthIso],
    queryFn: async () => {
      const entries = await Promise.all(days.map(async (date) => {
        const res = await fetchCapacity(kind, date);
        return [date, res.remainingMinutes] as const;
      }));
      return { data: Object.fromEntries(entries) };
    },
    select: (r) => r.data,
  });
}
