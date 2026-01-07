import { API_BASE } from './client';

export interface OrderLineDto {
  id: string;
  order_id: string;
  sku?: string;
  qty: number;
  unit_price?: number;
  delivered_qty?: number;
  delivery_date?: string;
}

export interface OrderDetailDto {
  id: string;
  ext_id?: string;
  customer?: string;
  status: string;
  forecast_date?: string;
  sum_total?: number;
  distance_km?: number;
  forecast_miss?: number;
  miss_days?: number;
  lines: OrderLineDto[];
}

export interface OrderEventDto {
  id: string;
  kind: 'production'|'montage'|string;
  order_id: string;
  start_date: string;
  end_date: string;
  total_minutes: number;
  travel_minutes: number;
  source?: string;
  employeeIds?: string[];
}

export async function fetchOrderDetail(orderId: string): Promise<{ order: OrderDetailDto; events: OrderEventDto[] }>{
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
