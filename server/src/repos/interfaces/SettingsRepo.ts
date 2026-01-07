export type AppSettingValue = unknown;

export interface SettingsRepo {
  getAppSetting(key: string): Promise<AppSettingValue | null>;
  setAppSetting(key: string, value: AppSettingValue): Promise<void>;
  listItems(): Promise<Array<{ sku: string; name?: string; prodMinPerUnit: number; montMinPerUnit: number; active: boolean }>>;
  upsertItem(item: { sku: string; name?: string; prodMinPerUnit?: number; montMinPerUnit?: number; active?: boolean }): Promise<void>;
  listEmployees(): Promise<Array<{ id: string; name: string; role: string; weeklyHours: number; daysMask: number; active: boolean; color?: string }>>;
  upsertEmployee(emp: { id?: string; name: string; role: string; weeklyHours: number; daysMask: number; active?: boolean; color?: string }): Promise<string>; // returns id
  listBlockers(filter?: { employeeId?: string; dateIso?: string }): Promise<Array<{ id: string; employeeId: string; dateIso: string; overnight: boolean; reason?: string }>>;
  upsertBlocker(b: { id?: string; employeeId: string; dateIso: string; overnight?: boolean; reason?: string }): Promise<string>;
  deleteBlocker(id: string): Promise<void>;
}
