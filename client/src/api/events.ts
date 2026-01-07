import { API_BASE } from './client';

export interface PlanEventDto {
  id: string;
  kind: 'production'|'montage';
  order_id: string;
  start_date: string;
  end_date: string;
  total_minutes: number;
  travel_minutes: number;
  source?: string;
  employeeIds?: string[];
}

export async function fetchEventsInRange(params: { from: string; to: string; kind?: 'production'|'montage' }) {
  const q = new URLSearchParams();
  q.set('from', params.from);
  q.set('to', params.to);
  if (params.kind) q.set('kind', params.kind);
  const res = await fetch(`${API_BASE}/api/events?${q.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as PlanEventDto[];
}

export async function createPlanEvent(payload: { kind: 'production'|'montage'; orderId: string; startDate: string; endDate: string; totalMinutes: number; travelMinutes?: number; employeeIds?: string[] }) {
  const res = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deletePlanEvent(id: string) {
  const res = await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function updatePlanEvent(id: string, payload: { kind: 'production'|'montage'; orderId: string; startDate: string; endDate: string; totalMinutes: number; travelMinutes?: number; employeeIds?: string[] }) {
  const res = await fetch(`${API_BASE}/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
