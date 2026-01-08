import { useQuery } from '@tanstack/react-query';
import { fetchOrders, type OrderDto } from '../api/orders';

function monthToRange(monthIso?: string) {
  if (!monthIso) return { from: undefined as string|undefined, to: undefined as string|undefined };
  const d = new Date(monthIso + 'T00:00:00Z');
  const from = monthIso;
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const to = end.toISOString().slice(0, 10);
  return { from, to };
}

export function useOrdersList({ monthIso, search, statuses, onlyDelayed, onlyUnplanned, onlyWithPositions, sort }:{ monthIso?: string; search?: string; statuses?: string[]; onlyDelayed?: boolean; onlyUnplanned?: boolean; onlyWithPositions?: boolean; sort?: string }) {
  const { from, to } = monthToRange(monthIso);
  return useQuery<{ data: OrderDto[] }, Error, OrderDto[]>({
    queryKey: ['orders','list', { from, to, search, statuses, onlyDelayed, onlyUnplanned, onlyWithPositions, sort }],
    queryFn: async () => ({ data: await fetchOrders({ from, to, search, statuses, onlyDelayed, onlyUnplanned, onlyWithPositions, sort }) }),
    select: (res)=>res.data,
  });
}
