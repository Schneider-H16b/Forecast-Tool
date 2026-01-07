export const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getHealth(): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  return handle(res);
}
