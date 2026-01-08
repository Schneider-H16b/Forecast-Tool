import { API_BASE } from './client';

export interface EmployeeCapacityDto {
  id: string;
  name: string;
  availableMin: number;
  bookedMin: number;
  role: string;
  color?: string;
}

export async function fetchCapacityDay(kind: 'production' | 'montage', date: string) {
  const q = new URLSearchParams();
  q.set('kind', kind);
  q.set('date', date);
  const res = await fetch(`${API_BASE}/api/capacity/day?${q.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { date: string; kind: string; employees: EmployeeCapacityDto[] };
}
