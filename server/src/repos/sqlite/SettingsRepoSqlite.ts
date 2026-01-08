import { v4 as uuidv4 } from 'uuid';
import { SettingsRepo, GlobalSettings, AutoPlanSettings } from '../interfaces/SettingsRepo';
import { SqliteAdapter } from '../../db/sqliteAdapter';

const DEFAULT_GLOBAL: GlobalSettings = {
  dayMinutes: 480,
  minCapPerDay: 60,
  travelKmh: 60,
  travelRoundTrip: true,
};

const DEFAULT_AUTOPLAN: AutoPlanSettings = {
  tolPerDayMin: 60,
  maxEmployeesPerOrder: 3,
  softConflictLimitMin: 120,
  autoPlanMontageSlipBackDays: 5,
  autoPlanMontageSlipFwdDays: 5,
  respectOvernightBarriers: true,
};

function clamp(num: number, min: number, max: number) {
  if (Number.isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
}

export class SettingsRepoSqlite implements SettingsRepo {
  private db: SqliteAdapter;

  constructor(db: SqliteAdapter) {
    this.db = db;
  }

  async getAppSetting(key: string) {
    const rows = this.db.query('SELECT value_json FROM app_settings WHERE key = ?;', [key]) as Array<Record<string, unknown>>;
    if (rows.length === 0) return null;
    try {
      return JSON.parse(String(rows[0].value_json));
    } catch (e) {
      return null;
    }
  }

  async setAppSetting(key: string, value: unknown) {
    const existing = this.db.query('SELECT key FROM app_settings WHERE key = ?;', [key]);
    const json = JSON.stringify(value);
    if (existing.length === 0) {
      this.db.run('INSERT INTO app_settings (key, value_json) VALUES (?, ?);', [key, json]);
    } else {
      this.db.run('UPDATE app_settings SET value_json = ? WHERE key = ?;', [json, key]);
    }
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
  }

  async getGlobalSettings(): Promise<GlobalSettings> {
    const raw = await this.getAppSetting('settings.global');
    const merged = { ...DEFAULT_GLOBAL, ...(typeof raw === 'object' && raw ? raw : {}) } as GlobalSettings;
    merged.dayMinutes = clamp(Number(merged.dayMinutes ?? DEFAULT_GLOBAL.dayMinutes), 60, 960);
    merged.minCapPerDay = clamp(Number(merged.minCapPerDay ?? DEFAULT_GLOBAL.minCapPerDay), 0, merged.dayMinutes);
    merged.travelKmh = clamp(Number(merged.travelKmh ?? DEFAULT_GLOBAL.travelKmh), 10, 200);
    merged.travelRoundTrip = Boolean(merged.travelRoundTrip ?? DEFAULT_GLOBAL.travelRoundTrip);
    return merged;
  }

  async setGlobalSettings(patch: Partial<GlobalSettings>): Promise<GlobalSettings> {
    const current = await this.getGlobalSettings();
    const next: GlobalSettings = {
      ...current,
      ...patch,
    };
    next.dayMinutes = clamp(Number(next.dayMinutes), 60, 960);
    next.minCapPerDay = clamp(Number(next.minCapPerDay), 0, next.dayMinutes);
    next.travelKmh = clamp(Number(next.travelKmh), 10, 200);
    next.travelRoundTrip = Boolean(next.travelRoundTrip);
    await this.setAppSetting('settings.global', next);
    return next;
  }

  async getAutoPlanSettings(): Promise<AutoPlanSettings> {
    const raw = await this.getAppSetting('settings.autoplan');
    const merged = { ...DEFAULT_AUTOPLAN, ...(typeof raw === 'object' && raw ? raw : {}) } as AutoPlanSettings;
    merged.tolPerDayMin = clamp(Number(merged.tolPerDayMin ?? DEFAULT_AUTOPLAN.tolPerDayMin), 0, 240);
    merged.maxEmployeesPerOrder = clamp(Number(merged.maxEmployeesPerOrder ?? DEFAULT_AUTOPLAN.maxEmployeesPerOrder), 1, 8);
    merged.softConflictLimitMin = clamp(Number(merged.softConflictLimitMin ?? DEFAULT_AUTOPLAN.softConflictLimitMin), 0, 960);
    merged.autoPlanMontageSlipBackDays = clamp(Number(merged.autoPlanMontageSlipBackDays ?? DEFAULT_AUTOPLAN.autoPlanMontageSlipBackDays), 0, 60);
    merged.autoPlanMontageSlipFwdDays = clamp(Number(merged.autoPlanMontageSlipFwdDays ?? DEFAULT_AUTOPLAN.autoPlanMontageSlipFwdDays), 0, 60);
    merged.respectOvernightBarriers = Boolean(merged.respectOvernightBarriers ?? DEFAULT_AUTOPLAN.respectOvernightBarriers);
    if (merged.autoPlanProductionLookaheadDays !== undefined) {
      merged.autoPlanProductionLookaheadDays = clamp(Number(merged.autoPlanProductionLookaheadDays), 1, 365);
    }
    return merged;
  }

  async setAutoPlanSettings(patch: Partial<AutoPlanSettings>): Promise<AutoPlanSettings> {
    const current = await this.getAutoPlanSettings();
    const next: AutoPlanSettings = {
      ...current,
      ...patch,
    };
    next.tolPerDayMin = clamp(Number(next.tolPerDayMin), 0, 240);
    next.maxEmployeesPerOrder = clamp(Number(next.maxEmployeesPerOrder), 1, 8);
    next.softConflictLimitMin = clamp(Number(next.softConflictLimitMin), 0, 960);
    next.autoPlanMontageSlipBackDays = clamp(Number(next.autoPlanMontageSlipBackDays), 0, 60);
    next.autoPlanMontageSlipFwdDays = clamp(Number(next.autoPlanMontageSlipFwdDays), 0, 60);
    if (next.autoPlanProductionLookaheadDays !== undefined) {
      next.autoPlanProductionLookaheadDays = clamp(Number(next.autoPlanProductionLookaheadDays), 1, 365);
    }
    next.respectOvernightBarriers = Boolean(next.respectOvernightBarriers);
    await this.setAppSetting('settings.autoplan', next);
    return next;
  }

  async listItems() {
    const rows = this.db.query('SELECT sku, name, prod_min_per_unit as prodMinPerUnit, mont_min_per_unit as montMinPerUnit, active FROM items;') as Array<Record<string, unknown>>;
    return rows.map(r => ({
      sku: r.sku as string,
      name: (r.name as string) || undefined,
      prodMinPerUnit: Number(r.prodMinPerUnit || 0),
      montMinPerUnit: Number(r.montMinPerUnit || 0),
      active: (r.active as number) === 1,
    }));
  }
  async upsertItem(item: { sku: string; name?: string; prodMinPerUnit?: number; montMinPerUnit?: number; active?: boolean }) {
    const exists = this.db.query('SELECT sku FROM items WHERE sku = ?;', [item.sku]);
    if (exists.length === 0) {
      this.db.run('INSERT INTO items (sku, name, prod_min_per_unit, mont_min_per_unit, active) VALUES (?, ?, ?, ?, ?);', [item.sku, item.name || null, item.prodMinPerUnit || 0, item.montMinPerUnit || 0, item.active ? 1 : 0]);
    } else {
      this.db.run('UPDATE items SET name = ?, prod_min_per_unit = ?, mont_min_per_unit = ?, active = ? WHERE sku = ?;', [item.name || null, item.prodMinPerUnit || 0, item.montMinPerUnit || 0, item.active ? 1 : 0, item.sku]);
    }
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
  }

  async deleteItem(sku: string) {
    this.db.run('DELETE FROM items WHERE sku = ?;', [sku]);
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
  }

  async listEmployees() {
    const rows = this.db.query('SELECT id, name, role, weekly_hours as weeklyHours, days_mask as daysMask, active, color FROM employees;') as Array<Record<string, unknown>>;
    return rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      role: r.role as string,
      weeklyHours: Number(r.weeklyHours || 0),
      daysMask: Number(r.daysMask || 0),
      active: (r.active as number) === 1,
      color: (r.color as string) || undefined,
    }));
  }
  async upsertEmployee(emp: { id?: string; name: string; role: string; weeklyHours: number; daysMask: number; active?: boolean; color?: string }) {
    const id = emp.id || uuidv4();
    const exists = this.db.query('SELECT id FROM employees WHERE id = ?;', [id]);
    if (exists.length === 0) {
      this.db.run('INSERT INTO employees (id, name, role, weekly_hours, days_mask, active, color) VALUES (?, ?, ?, ?, ?, ?, ?);', [id, emp.name, emp.role, emp.weeklyHours, emp.daysMask, emp.active ? 1 : 0, emp.color || null]);
    } else {
      this.db.run('UPDATE employees SET name = ?, role = ?, weekly_hours = ?, days_mask = ?, active = ?, color = ? WHERE id = ?;', [emp.name, emp.role, emp.weeklyHours, emp.daysMask, emp.active ? 1 : 0, emp.color || null, id]);
    }
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
    return id;
  }

  async deleteEmployee(id: string) {
    this.db.run('DELETE FROM employees WHERE id = ?;', [id]);
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
  }

  async listBlockers(filter?: { employeeId?: string; dateIso?: string; monthIso?: string }) {
    const clauses: string[] = [];
    const params: Array<string> = [];
    if (filter?.employeeId) {
      clauses.push('employee_id = ?');
      params.push(filter.employeeId);
    }
    if (filter?.dateIso) {
      clauses.push('date_iso = ?');
      params.push(filter.dateIso);
    }
    if (filter?.monthIso) {
      clauses.push('date_iso LIKE ?');
      params.push(`${filter.monthIso}%`);
    }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const rows = this.db.query(`SELECT id, employee_id as employeeId, date_iso as dateIso, overnight, reason FROM blockers ${where};`, params) as Array<Record<string, unknown>>;
    return rows.map(r => ({
      id: r.id as string,
      employeeId: r.employeeId as string,
      dateIso: r.dateIso as string,
      overnight: (r.overnight as number) === 1,
      reason: (r.reason as string) || undefined,
    }));
  }

  async upsertBlocker(b: { id?: string; employeeId: string; dateIso: string; overnight?: boolean; reason?: string }) {
    const id = b.id || uuidv4();
    const exists = this.db.query('SELECT id FROM blockers WHERE id = ?;', [id]);
    if (exists.length === 0) {
      this.db.run('INSERT INTO blockers (id, employee_id, date_iso, overnight, reason) VALUES (?, ?, ?, ?, ?);', [id, b.employeeId, b.dateIso, b.overnight ? 1 : 0, b.reason || null]);
    } else {
      this.db.run('UPDATE blockers SET employee_id = ?, date_iso = ?, overnight = ?, reason = ? WHERE id = ?;', [b.employeeId, b.dateIso, b.overnight ? 1 : 0, b.reason || null, id]);
    }
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
    return id;
  }

  async deleteBlocker(id: string) {
    this.db.run('DELETE FROM blockers WHERE id = ?;', [id]);
  }
}
