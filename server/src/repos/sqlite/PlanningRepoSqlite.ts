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

    const rows = this.adapter.query(sql, params);
    const events: PlanEvent[] = [];

    for (const row of rows) {
      const empRows = this.adapter.query(
        'SELECT employee_id FROM plan_event_employees WHERE event_id = ?',
        [row.id]
      );
      const employeeIds = empRows.map(r => r.employee_id);

      events.push({
        id: row.id,
        kind: row.kind,
        order_id: row.order_id,
        start_date: row.start_date,
        end_date: row.end_date,
        total_minutes: row.total_minutes,
        travel_minutes: row.travel_minutes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        source: row.source,
        employeeIds,
      });
    }

    return events;
  }

  async getRemainingCapacity(
    kind: string,
    date: string
  ): Promise<number> {
    // Calculate total scheduled minutes for the date
    const sql = `
      SELECT SUM(total_minutes) as used_minutes
      FROM plan_events
      WHERE kind = ?
        AND start_date <= ?
        AND end_date >= ?
    `;
    const rows = this.adapter.query(sql, [kind, date, date]);
    const usedMinutes = rows[0]?.used_minutes || 0;

    // Assume 8 hours (480 minutes) per day capacity
    const totalCapacity = 480;
    return Math.max(0, totalCapacity - usedMinutes);
  }
}
