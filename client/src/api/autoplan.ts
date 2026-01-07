import { API_BASE } from './client';

export async function runAutoPlan(params: { startDate: string; endDate: string; includeProduction?: boolean; includeMontage?: boolean; overwriteExisting?: boolean }) {
  const res = await fetch(`${API_BASE}/api/autoplan/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
