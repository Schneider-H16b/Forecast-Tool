import { SettingsRepo } from '../interfaces/SettingsRepo';
import { SqliteAdapter } from '../../db/sqliteAdapter';

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
    if (!emp.id) throw new Error('id required for sqlite upsertEmployee (use UUID client side or implement id generation)');
    const exists = this.db.query('SELECT id FROM employees WHERE id = ?;', [emp.id]);
    if (exists.length === 0) {
      this.db.run('INSERT INTO employees (id, name, role, weekly_hours, days_mask, active, color) VALUES (?, ?, ?, ?, ?, ?, ?);', [emp.id, emp.name, emp.role, emp.weeklyHours, emp.daysMask, emp.active ? 1 : 0, emp.color || null]);
    } else {
      this.db.run('UPDATE employees SET name = ?, role = ?, weekly_hours = ?, days_mask = ?, active = ?, color = ? WHERE id = ?;', [emp.name, emp.role, emp.weeklyHours, emp.daysMask, emp.active ? 1 : 0, emp.color || null, emp.id]);
    }
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
    return emp.id;
  }

  async listBlockers(filter?: { employeeId?: string; dateIso?: string }) {
    if (!filter) {
      const rows = this.db.query('SELECT id, employee_id as employeeId, date_iso as dateIso, overnight, reason FROM blockers;') as Array<Record<string, unknown>>;
      return rows.map(r => ({
        id: r.id as string,
        employeeId: r.employeeId as string,
        dateIso: r.dateIso as string,
        overnight: (r.overnight as number) === 1,
        reason: (r.reason as string) || undefined,
      }));
    }
    const clauses: string[] = [];
    const params: Array<string> = [];
    if (filter.employeeId) {
      clauses.push('employee_id = ?');
      params.push(filter.employeeId);
    }
    if (filter.dateIso) {
      clauses.push('date_iso = ?');
      params.push(filter.dateIso);
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
    if (!b.id) throw new Error('id required for sqlite upsertBlocker');
    const exists = this.db.query('SELECT id FROM blockers WHERE id = ?;', [b.id]);
    if (exists.length === 0) {
      this.db.run('INSERT INTO blockers (id, employee_id, date_iso, overnight, reason) VALUES (?, ?, ?, ?, ?);', [b.id, b.employeeId, b.dateIso, b.overnight ? 1 : 0, b.reason || null]);
    } else {
      this.db.run('UPDATE blockers SET employee_id = ?, date_iso = ?, overnight = ?, reason = ? WHERE id = ?;', [b.employeeId, b.dateIso, b.overnight ? 1 : 0, b.reason || null, b.id]);
    }
    try { this.db.saveToFile(); } catch (e) { /* best-effort save */ }
    return b.id;
  }

  async deleteBlocker(id: string) {
    this.db.run('DELETE FROM blockers WHERE id = ?;', [id]);
  }
}
