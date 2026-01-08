export async function fetchBiDashboard() {
  const res = await fetch('/api/bi/dashboard');
  if (!res.ok) throw new Error('BI fetch failed');
  return res.json();
}

export async function saveBiDashboard(payload: { widgets: any[]; layouts: Record<string, any> }) {
  const res = await fetch('/api/bi/dashboard', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('BI save failed');
  return res.json();
}
