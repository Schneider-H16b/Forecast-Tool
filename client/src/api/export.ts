import { API_BASE } from './client';

export type ExportFormat = 'csv' | 'json';

export async function exportOrders(format: ExportFormat = 'csv', params?: { from?: string; to?: string; statuses?: string[] }) {
  const q = new URLSearchParams();
  q.set('format', format);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.statuses && params.statuses.length) q.set('statuses', params.statuses.join(','));

  const url = `${API_BASE}/api/export/orders?${q.toString()}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Return the blob so the caller can download it
  return await res.blob();
}

export async function downloadExportedOrders(format: ExportFormat = 'csv', params?: { from?: string; to?: string; statuses?: string[] }) {
  const blob = await exportOrders(format, params);
  const fileExt = format === 'json' ? 'json' : 'csv';
  const fileName = `orders-${new Date().toISOString().slice(0, 10)}.${fileExt}`;

  // Create a temporary download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
