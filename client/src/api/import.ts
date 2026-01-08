import { API_BASE } from './client';

export async function importCsv(csvText: string, source?: string) {
  const res = await fetch(`${API_BASE}/api/import/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvText, source }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function importDualCsv(params: { headerCsvText?: string; positionsCsvText?: string; source?: string }) {
  const res = await fetch(`${API_BASE}/api/import/csv-dual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return await res.json();
}
