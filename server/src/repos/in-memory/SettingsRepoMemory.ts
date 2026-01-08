import { SettingsRepo, AppSettingValue, GlobalSettings, AutoPlanSettings } from '../interfaces/SettingsRepo';
import { v4 as uuidv4 } from 'uuid';

export class SettingsRepoMemory implements SettingsRepo {
  private settings = new Map<string, AppSettingValue>();
  private items = new Map<string, { sku: string; name?: string; prodMinPerUnit: number; montMinPerUnit: number; active: boolean }>();
  private employees = new Map<string, { id: string; name: string; role: string; weeklyHours: number; daysMask: number; active: boolean; color?: string }>();
  private blockers = new Map<string, { id: string; employeeId: string; dateIso: string; overnight: boolean; reason?: string }>();

  private readonly defaultGlobal: GlobalSettings = {
    dayMinutes: 480,
    minCapPerDay: 60,
    travelKmh: 60,
    travelRoundTrip: true,
  };

  private readonly defaultAuto: AutoPlanSettings = {
    tolPerDayMin: 60,
    maxEmployeesPerOrder: 3,
    softConflictLimitMin: 120,
    autoPlanMontageSlipBackDays: 5,
    autoPlanMontageSlipFwdDays: 5,
    respectOvernightBarriers: true,
  };

  async getAppSetting(key: string) {
    return this.settings.has(key) ? this.settings.get(key)! : null;
  }
  async setAppSetting(key: string, value: AppSettingValue) {
    this.settings.set(key, value);
  }

  async getGlobalSettings(): Promise<GlobalSettings> {
    const raw = this.settings.get('settings.global');
    return { ...this.defaultGlobal, ...(raw as any) };
  }

  async setGlobalSettings(patch: Partial<GlobalSettings>): Promise<GlobalSettings> {
    const next = { ...this.defaultGlobal, ...(this.settings.get('settings.global') as any), ...patch } as GlobalSettings;
    this.settings.set('settings.global', next);
    return next;
  }

  async getAutoPlanSettings(): Promise<AutoPlanSettings> {
    const raw = this.settings.get('settings.autoplan');
    return { ...this.defaultAuto, ...(raw as any) };
  }

  async setAutoPlanSettings(patch: Partial<AutoPlanSettings>): Promise<AutoPlanSettings> {
    const next = { ...this.defaultAuto, ...(this.settings.get('settings.autoplan') as any), ...patch } as AutoPlanSettings;
    this.settings.set('settings.autoplan', next);
    return next;
  }

  async listItems() {
    return Array.from(this.items.values());
  }
  async upsertItem(item: { sku: string; name?: string; prodMinPerUnit?: number; montMinPerUnit?: number; active?: boolean }) {
    this.items.set(item.sku, { sku: item.sku, name: item.name, prodMinPerUnit: item.prodMinPerUnit || 0, montMinPerUnit: item.montMinPerUnit || 0, active: item.active !== false });
  }

  async deleteItem(sku: string) {
    this.items.delete(sku);
  }

  async listEmployees() {
    return Array.from(this.employees.values());
  }
  async upsertEmployee(emp: { id?: string; name: string; role: string; weeklyHours: number; daysMask: number; active?: boolean; color?: string }) {
    const id = emp.id || uuidv4();
    this.employees.set(id, { id, name: emp.name, role: emp.role, weeklyHours: emp.weeklyHours, daysMask: emp.daysMask, active: emp.active !== false, color: emp.color });
    return id;
  }

  async deleteEmployee(id: string) {
    this.employees.delete(id);
  }

  async listBlockers(filter?: { employeeId?: string; dateIso?: string; monthIso?: string }) {
    const arr = Array.from(this.blockers.values());
    if (!filter) return arr;
    return arr.filter((b) =>
      (filter.employeeId ? b.employeeId === filter.employeeId : true) &&
      (filter.dateIso ? b.dateIso === filter.dateIso : true) &&
      (filter.monthIso ? b.dateIso.startsWith(filter.monthIso) : true)
    );
  }

  async upsertBlocker(b: { id?: string; employeeId: string; dateIso: string; overnight?: boolean; reason?: string }) {
    const id = b.id || uuidv4();
    this.blockers.set(id, { id, employeeId: b.employeeId, dateIso: b.dateIso, overnight: !!b.overnight, reason: b.reason });
    return id;
  }

  async deleteBlocker(id: string) {
    this.blockers.delete(id);
  }
}
