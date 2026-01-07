import { API_BASE } from './client';

export interface OrderDto {
  id: string;
  ext_id?: string;
  customer?: string;
  status: string;
  forecast_date?: string;
  sum_total?: number;
  distance_km?: number;
  forecast_miss?: number;
  miss_days?: number;
}

export async function fetchOrders(params: { from: string; to: string; search?: string; statuses?: string[]; onlyDelayed?: boolean; onlyUnplanned?: boolean; sort?: string }) {
  const q = new URLSearchParams();
  q.set('from', params.from);
  q.set('to', params.to);
  if (params.search) q.set('search', params.search);
  if (params.statuses && params.statuses.length) q.set('statuses', params.statuses.join(','));
  if (params.onlyDelayed) q.set('onlyDelayed', '1');
  if (params.onlyUnplanned) q.set('onlyUnplanned', '1');
  if (params.sort) q.set('sort', params.sort);
  const res = await fetch(`${API_BASE}/api/orders?${q.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as OrderDto[];
}

export async function patchOrderMeta(orderId: string, patch: { distanceKm?: number; forecast_miss?: number; miss_days?: number }) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/meta`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
