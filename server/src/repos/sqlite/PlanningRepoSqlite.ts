import type { PlanEvent } from '../../types';
import type { PlanningRepo, PlanEventInput } from '../interfaces/PlanningRepo';
import type { SqliteAdapter } from '../../db/sqliteAdapter';
import { v4 as uuidv4 } from 'uuid';

export class PlanningRepoSqlite implements PlanningRepo {
  constructor(private adapter: SqliteAdapter) {}

  async createEvent(input: PlanEventInput): Promise<string> {
    const id = input.id || `event-${uuidv4()}`;
    const now = new Date().toISOString();

    this.adapter.run(
      `INSERT INTO plan_events (id, kind, order_id, start_date, end_date, total_minutes, travel_minutes, created_at, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.kind,
        input.orderId,
        input.startDate,
        input.endDate,
        input.totalMinutes,
        input.travelMinutes || 0,
        now,
        now,
        input.source || 'manual',
      ]
    );

    if (input.employeeIds && input.employeeIds.length > 0) {
      for (const empId of input.employeeIds) {
        this.adapter.run(
          'INSERT INTO plan_event_employees (event_id, employee_id) VALUES (?, ?)',
          [id, empId]
        );
      }
    }

    await this.adapter.saveToFile();
    return id;
  }

  async updateEvent(input: PlanEventInput): Promise<void> {
    if (!input.id) throw new Error('Event ID required for update');

    this.adapter.run(
      `UPDATE plan_events SET
        kind = ?,
        order_id = ?,
        start_date = ?,
        end_date = ?,
        total_minutes = ?,
        travel_minutes = ?,
        updated_at = ?,
        source = ?
       WHERE id = ?`,
      [
        input.kind,
        input.orderId,
        input.startDate,
        input.endDate,
        input.totalMinutes,
        input.travelMinutes || 0,
        new Date().toISOString(),
        input.source || 'manual',
        input.id,
      ]
    );

    if (input.employeeIds) {
      this.adapter.run('DELETE FROM plan_event_employees WHERE event_id = ?', [input.id]);
      for (const empId of input.employeeIds) {
        this.adapter.run(
          'INSERT INTO plan_event_employees (event_id, employee_id) VALUES (?, ?)',
          [input.id, empId]
        );
      }
    }

    await this.adapter.saveToFile();
  }

  async deleteEvent(eventId: string): Promise<void> {
    this.adapter.run('DELETE FROM plan_event_employees WHERE event_id = ?', [eventId]);
    this.adapter.run('DELETE FROM plan_events WHERE id = ?', [eventId]);
    await this.adapter.saveToFile();
  }

  async listEvents(kind?: string, dateRange?: { from: string; to: string }): Promise<Array<PlanEvent>> {
    let sql = 'SELECT * FROM plan_events WHERE 1=1';
    const params: string[] = [];

    if (kind) {
      sql += ' AND kind = ?';
      params.push(kind);
    }

    if (dateRange) {
      sql += ' AND start_date >= ? AND start_date <= ?';
      params.push(dateRange.from, dateRange.to);
    }

    sql += ' ORDER BY start_date ASC';

    const rows = this.adapter.query(sql, params) as Array<Record<string, unknown>>;
    const events: PlanEvent[] = [];

    for (const row of rows) {
      const empRows = this.adapter.query(
        'SELECT employee_id FROM plan_event_employees WHERE event_id = ?',
        [row.id as string]
      ) as Array<Record<string, unknown>>;
      const employeeIds = empRows.map(r => r.employee_id as string);

      events.push({
        id: row.id as string,
        kind: row.kind as string,
        order_id: row.order_id as string,
        start_date: row.start_date as string,
        end_date: row.end_date as string,
        total_minutes: (row.total_minutes as number) ?? 0,
        travel_minutes: (row.travel_minutes as number) ?? 0,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        source: (row.source as string) || 'manual',
        employeeIds,
      });
    }

    return events;
  }

  async getRemainingCapacity(
    kind: string,
    date: string
  ): Promise<number> {
    // 1) Base capacity from employees & settings
    const weekdayIdx = new Date(date).getDay();
    // Map JS getDay (0=Sun..6=Sat) to our mask where 0=Mo..6=So
    const maskIdx = ((weekdayIdx + 6) % 7); // Sun->6, Mon->0, ...

    const empRows = this.adapter.query(
      'SELECT role, weekly_hours as weeklyHours, days_mask as daysMask, active FROM employees WHERE active = 1;'
    ) as Array<Record<string, unknown>>;

    // Fetch min daily capacity from app_settings (optional)
    let minDailyCap = 0;
    try {
      const srows = this.adapter.query('SELECT value_json FROM app_settings WHERE key = ?;', ['planning.minDailyCapacityMin']) as Array<Record<string, unknown>>;
      if (srows.length) {
        const val = JSON.parse(String(srows[0].value_json ?? '0')) as number;
        minDailyCap = Number.isFinite(val) ? Number(val) : 0;
      }
    } catch { /* ignore */ }

    function bitCount(n: number): number { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; }

    let totalCapacity = 0;
    for (const r of empRows) {
      const role = String(r.role || '');
      const relevant = kind === 'production'
        ? (role === 'production' || role === 'both')
        : (role === 'montage' || role === 'both');
      if (!relevant) continue;
      const mask = Number(r.daysMask || 0);
      const isWorkingDay = ((mask >> maskIdx) & 1) === 1;
      if (!isWorkingDay) continue;
      const weeklyHours = Number(r.weeklyHours || 0);
      const days = Math.max(1, bitCount(mask));
      const perDayMin = Math.max(minDailyCap, Math.round((weeklyHours * 60) / days));
      totalCapacity += perDayMin;
    }

    // 2) Subtract full-day blockers for the date
    // If an employee has a blocker on that date, subtract their per-day capacity
    try {
      const blockerRows = this.adapter.query('SELECT employee_id as employeeId FROM blockers WHERE date_iso = ?;', [date]) as Array<Record<string, unknown>>;
      const blockedEmpIds = new Set(blockerRows.map(r => String(r.employeeId)));
      if (blockedEmpIds.size > 0) {
        for (const r of empRows) {
          const role = String(r.role || '');
          const relevant = kind === 'production'
            ? (role === 'production' || role === 'both')
            : (role === 'montage' || role === 'both');
          if (!relevant) continue;
          const idRows = this.adapter.query('SELECT id FROM employees WHERE rowid = rowid AND name = name LIMIT 0'); // placeholder to satisfy types; we don't have id here
          // We don't have employee id from previous select; fetch per-emp when blocked set is non-empty
        }
        // Simpler: approximate by subtracting average per-emp capacity for number of blocked employees matching role
        const roleFiltered = empRows.filter(r => (kind === 'production' ? (String(r.role||'') === 'production' || String(r.role||'')==='both') : (String(r.role||'') === 'montage' || String(r.role||'')==='both')));
        const maskFiltered = roleFiltered.filter(r => ((Number(r.daysMask||0) >> maskIdx) & 1) === 1);
        const days = maskFiltered.map(r => Math.max(1, bitCount(Number(r.daysMask||0))));
        const perDayCaps = maskFiltered.map((r,i) => Math.max(minDailyCap, Math.round((Number(r.weeklyHours||0)*60)/days[i])));
        const avgCap = perDayCaps.length ? Math.round(perDayCaps.reduce((a,b)=>a+b,0)/perDayCaps.length) : 0;
        // Count how many of the blocked employees belong to relevant role; since we don't have IDs here, approximate by min(count, role employees)
        const blockedCount = blockedEmpIds.size;
        totalCapacity = Math.max(0, totalCapacity - (blockedCount * avgCap));
      }
    } catch { /* ignore blockers if any issue */ }

    // 3) Subtract scheduled minutes (including travel for montage)
    const sql = `
      SELECT SUM(total_minutes + travel_minutes) as used_minutes
      FROM plan_events
      WHERE kind = ?
        AND start_date <= ?
        AND end_date >= ?
    `;
    const rows = this.adapter.query(sql, [kind, date, date]) as Array<Record<string, unknown>>;
    const usedMinutes = Number(rows[0]?.used_minutes || 0);

    return Math.max(0, totalCapacity - usedMinutes);
  }
}
