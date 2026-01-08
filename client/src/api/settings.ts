import { API_BASE } from './client';

export interface GlobalSettingsDto {
  dayMinutes: number;
  minCapPerDay: number;
  travelKmh: number;
  travelRoundTrip: boolean;
}

export interface AutoPlanSettingsDto {
  tolPerDayMin: number;
  maxEmployeesPerOrder: number;
  softConflictLimitMin: number;
  autoPlanMontageSlipBackDays: number;
  autoPlanMontageSlipFwdDays: number;
  autoPlanProductionLookaheadDays?: number;
  respectOvernightBarriers: boolean;
}

export async function fetchGlobalSettings() {
  const res = await fetch(`${API_BASE}/api/settings/global`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as GlobalSettingsDto;
}

export async function updateGlobalSettings(patch: Partial<GlobalSettingsDto>) {
  const res = await fetch(`${API_BASE}/api/settings/global`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as GlobalSettingsDto;
}

export async function fetchAutoPlanSettings() {
  const res = await fetch(`${API_BASE}/api/settings/autoplan`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as AutoPlanSettingsDto;
}

export async function updateAutoPlanSettings(patch: Partial<AutoPlanSettingsDto>) {
  const res = await fetch(`${API_BASE}/api/settings/autoplan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as AutoPlanSettingsDto;
}

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

export async function saveEmployee(emp: Partial<EmployeeDto> & { id?: string }) {
  const isUpdate = Boolean(emp.id);
  const path = isUpdate ? `/api/settings/employees/${emp.id}` : '/api/settings/employees';
  const res = await fetch(`${API_BASE}${path}`, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emp),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json() as { id: string };
}

export async function deleteEmployee(id: string) {
  const res = await fetch(`${API_BASE}/api/settings/employees/${id}`, { method: 'DELETE' });
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

export async function fetchBlockers(params?: { employeeId?: string; dateIso?: string; monthIso?: string }) {
  const q = new URLSearchParams();
  if (params?.employeeId) q.set('employeeId', params.employeeId);
  if (params?.dateIso) q.set('dateIso', params.dateIso);
  if (params?.monthIso) q.set('monthIso', params.monthIso);
  const res = await fetch(`${API_BASE}/api/settings/blockers?${q.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as BlockerDto[];
}

export async function saveBlocker(b: Partial<BlockerDto> & { id?: string }) {
  const isUpdate = Boolean(b.id);
  const path = isUpdate ? `/api/settings/blockers/${b.id}` : '/api/settings/blockers';
  const res = await fetch(`${API_BASE}${path}`, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json() as { id: string };
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

export async function saveItem(item: ItemDto) {
  const path = item.sku ? `/api/settings/items/${encodeURIComponent(item.sku)}` : '/api/settings/items';
  const method = item.sku ? 'PUT' : 'POST';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function deleteItem(sku: string) {
  const res = await fetch(`${API_BASE}/api/settings/items/${encodeURIComponent(sku)}`, { method: 'DELETE' });
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
