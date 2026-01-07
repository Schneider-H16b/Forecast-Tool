import { API_BASE } from './client';

export async function fetchCapacity(kind: 'production'|'montage', date: string) {
  const q = new URLSearchParams();
  q.set('kind', kind);
  q.set('date', date);
  const res = await fetch(`${API_BASE}/api/capacity?${q.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { remainingMinutes: number };
}
