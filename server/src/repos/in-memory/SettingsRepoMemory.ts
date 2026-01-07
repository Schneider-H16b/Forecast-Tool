import { SettingsRepo, AppSettingValue } from '../interfaces/SettingsRepo';
import { v4 as uuidv4 } from 'uuid';

export class SettingsRepoMemory implements SettingsRepo {
  private settings = new Map<string, AppSettingValue>();
  private items = new Map<string, { sku: string; name?: string; prodMinPerUnit: number; montMinPerUnit: number; active: boolean }>();
  private employees = new Map<string, { id: string; name: string; role: string; weeklyHours: number; daysMask: number; active: boolean; color?: string }>();
  private blockers = new Map<string, { id: string; employeeId: string; dateIso: string; overnight: boolean; reason?: string }>();

  async getAppSetting(key: string) {
    return this.settings.has(key) ? this.settings.get(key)! : null;
  }
  async setAppSetting(key: string, value: AppSettingValue) {
    this.settings.set(key, value);
  }

  async listItems() {
    return Array.from(this.items.values());
  }
  async upsertItem(item: { sku: string; name?: string; prodMinPerUnit?: number; montMinPerUnit?: number; active?: boolean }) {
    this.items.set(item.sku, { sku: item.sku, name: item.name, prodMinPerUnit: item.prodMinPerUnit || 0, montMinPerUnit: item.montMinPerUnit || 0, active: item.active !== false });
  }

  async listEmployees() {
    return Array.from(this.employees.values());
  }
  async upsertEmployee(emp: { id?: string; name: string; role: string; weeklyHours: number; daysMask: number; active?: boolean; color?: string }) {
    const id = emp.id || uuidv4();
    this.employees.set(id, { id, name: emp.name, role: emp.role, weeklyHours: emp.weeklyHours, daysMask: emp.daysMask, active: emp.active !== false, color: emp.color });
    return id;
  }

  async listBlockers(filter?: { employeeId?: string; dateIso?: string }) {
    const arr = Array.from(this.blockers.values());
    if (!filter) return arr;
    return arr.filter((b) => (filter.employeeId ? b.employeeId === filter.employeeId : true) && (filter.dateIso ? b.dateIso === filter.dateIso : true));
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
