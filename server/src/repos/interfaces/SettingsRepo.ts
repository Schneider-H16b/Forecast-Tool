export type AppSettingValue = unknown;

export interface GlobalSettings {
  dayMinutes: number;
  minCapPerDay: number;
  travelKmh: number;
  travelRoundTrip: boolean;
}

export interface AutoPlanSettings {
  tolPerDayMin: number;
  maxEmployeesPerOrder: number;
  softConflictLimitMin: number;
  autoPlanMontageSlipBackDays: number;
  autoPlanMontageSlipFwdDays: number;
  respectOvernightBarriers: boolean;
  autoPlanProductionLookaheadDays?: number;
}

export interface SettingsRepo {
  // legacy key/value access (kept for compatibility)
  getAppSetting(key: string): Promise<AppSettingValue | null>;
  setAppSetting(key: string, value: AppSettingValue): Promise<void>;

  // structured settings
  getGlobalSettings(): Promise<GlobalSettings>;
  setGlobalSettings(patch: Partial<GlobalSettings>): Promise<GlobalSettings>;
  getAutoPlanSettings(): Promise<AutoPlanSettings>;
  setAutoPlanSettings(patch: Partial<AutoPlanSettings>): Promise<AutoPlanSettings>;

  // items
  listItems(): Promise<Array<{ sku: string; name?: string; prodMinPerUnit: number; montMinPerUnit: number; active: boolean }>>;
  upsertItem(item: { sku: string; name?: string; prodMinPerUnit?: number; montMinPerUnit?: number; active?: boolean }): Promise<void>;
  deleteItem(sku: string): Promise<void>;

  // employees
  listEmployees(): Promise<Array<{ id: string; name: string; role: string; weeklyHours: number; daysMask: number; active: boolean; color?: string }>>;
  upsertEmployee(emp: { id?: string; name: string; role: string; weeklyHours: number; daysMask: number; active?: boolean; color?: string }): Promise<string>; // returns id
  deleteEmployee(id: string): Promise<void>;

  // blockers
  listBlockers(filter?: { employeeId?: string; dateIso?: string; monthIso?: string }): Promise<Array<{ id: string; employeeId: string; dateIso: string; overnight: boolean; reason?: string }>>;
  upsertBlocker(b: { id?: string; employeeId: string; dateIso: string; overnight?: boolean; reason?: string }): Promise<string>;
  deleteBlocker(id: string): Promise<void>;
}
