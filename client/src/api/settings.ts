import { API_BASE } from './client';

export interface EmployeeDto {
  id: string;
  name: string;
  role: string;
  weeklyHours: number;
  daysMask: number;
  active: boolean;
  color?: string;
}

export async function fetchEmployees() {
  const res = await fetch(`${API_BASE}/api/settings/employees`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as EmployeeDto[];
}

export async function upsertEmployee(emp: Partial<EmployeeDto> & { id: string }) {
  const res = await fetch(`${API_BASE}/api/settings/employees/${emp.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emp),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export interface BlockerDto {
  id: string;
  employeeId: string;
  dateIso: string;
  overnight: boolean;
  reason?: string;
}

export async function fetchBlockers(params?: { employeeId?: string; dateIso?: string }) {
  const q = new URLSearchParams();
  if (params?.employeeId) q.set('employeeId', params.employeeId);
  if (params?.dateIso) q.set('dateIso', params.dateIso);
  const res = await fetch(`${API_BASE}/api/settings/blockers?${q.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as BlockerDto[];
}

export async function upsertBlocker(b: BlockerDto) {
  const res = await fetch(`${API_BASE}/api/settings/blockers/${b.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deleteBlocker(id: string) {
  const res = await fetch(`${API_BASE}/api/settings/blockers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export interface ItemDto {
  sku: string;
  name?: string;
  prodMinPerUnit?: number;
  montMinPerUnit?: number;
  active?: boolean;
}

export async function fetchItems() {
  const res = await fetch(`${API_BASE}/api/settings/items`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ItemDto[];
}

export async function upsertItem(item: ItemDto) {
  const res = await fetch(`${API_BASE}/api/settings/items/${item.sku}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchAppSetting<T = unknown>(key: string) {
  const res = await fetch(`${API_BASE}/api/settings/app/${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as { key: string; value: T };
  return json.value;
}

export async function setAppSetting(key: string, value: unknown) {
  const res = await fetch(`${API_BASE}/api/settings/app/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
