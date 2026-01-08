import { Router } from 'express';
import { getDB } from '../db/db';

export const planningRouter = Router();

/**
 * POST /api/events
 * Create a new plan event
 */
planningRouter.post('/events', async (req, res) => {
  try {
    const { kind, orderId, startDate, endDate, totalMinutes, travelMinutes, employeeIds } = req.body;

    if (!kind || !orderId || !startDate || !endDate || totalMinutes === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const planningRepo = getDB().getPlanningRepo();
    const id = await planningRepo.createEvent({
      kind,
      orderId,
      startDate,
      endDate,
      totalMinutes,
      travelMinutes,
      employeeIds,
    });

    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating plan event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/events/:id
 * Update an existing plan event
 */
planningRouter.put('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kind, orderId, startDate, endDate, totalMinutes, travelMinutes, employeeIds } = req.body;

    if (!kind || !orderId || !startDate || !endDate || totalMinutes === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const planningRepo = getDB().getPlanningRepo();
    await planningRepo.updateEvent({
      id,
      kind,
      orderId,
      startDate,
      endDate,
      totalMinutes,
      travelMinutes,
      employeeIds,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating plan event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete a plan event
 */
planningRouter.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const planningRepo = getDB().getPlanningRepo();
    await planningRepo.deleteEvent(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/events
 * List plan events with optional filters
 * Query params: kind (production|montage), from (date), to (date)
 */
planningRouter.get('/events', async (req, res) => {
  try {
    const kind = req.query.kind as 'production' | 'montage' | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const dateRange = from && to ? { from, to } : undefined;

    const planningRepo = getDB().getPlanningRepo();
    const events = await planningRepo.listEvents(kind, dateRange);

    res.json(events);
  } catch (error) {
    console.error('Error listing plan events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/capacity
 * Get remaining capacity for a specific kind and date
 * Query params: kind (production|montage), date (YYYY-MM-DD)
 */
planningRouter.get('/capacity', async (req, res) => {
  try {
    const kind = req.query.kind as 'production' | 'montage' | undefined;
    const date = req.query.date as string | undefined;

    if (!kind || !date) {
      return res.status(400).json({ error: 'Missing kind or date' });
    }

    const planningRepo = getDB().getPlanningRepo();
    const remainingMinutes = await planningRepo.getRemainingCapacity(kind, date);

    res.json({ remainingMinutes });
  } catch (error) {
    console.error('Error getting capacity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/capacity/day
 * Get per-employee capacity breakdown for a specific kind and date
 * Query params: kind (production|montage), date (YYYY-MM-DD)
 * Returns: { employees: [{ id, name, availableMin, bookedMin, role, color }] }
 */
planningRouter.get('/capacity/day', async (req, res) => {
  try {
    const kind = req.query.kind as 'production' | 'montage' | undefined;
    const date = req.query.date as string | undefined;

    if (!kind || !date) {
      return res.status(400).json({ error: 'Missing kind or date' });
    }

    const db = getDB();
    const settingsRepo = db.getSettingsRepo();

    // Get all active employees
    const allEmps = await settingsRepo.listEmployees();

    // Determine weekday index (0=Mon..6=Sun)
    const weekdayJs = new Date(date).getDay(); // 0=Sun..6=Sat
    const maskIdx = ((weekdayJs + 6) % 7); // Convert to 0=Mon..6=Sun

    // Fetch min daily capacity from app_settings
    let minDailyCap = 0;
    try {
      const val = await settingsRepo.getAppSetting('planning.minDailyCapacityMin');
      if (typeof val === 'number' && Number.isFinite(val)) minDailyCap = val;
    } catch { /* ignore */ }

    function bitCount(n: number): number {
      let c = 0;
      while (n) {
        c += n & 1;
        n >>= 1;
      }
      return c;
    }

    // Compute per-employee availability
    const employees = [];
    for (const emp of allEmps) {
      if (!emp.active) continue;
      const role = emp.role;
      const relevant = kind === 'production'
        ? (role === 'production' || role === 'both')
        : (role === 'montage' || role === 'both');
      if (!relevant) continue;

      const mask = emp.daysMask || 0;
      const isWorkingDay = ((mask >> maskIdx) & 1) === 1;
      if (!isWorkingDay) continue;

      const weeklyHours = emp.weeklyHours || 0;
      const daysWorked = Math.max(1, bitCount(mask));
      const availableMin = Math.max(minDailyCap, Math.round((weeklyHours * 60) / daysWorked));

      // Subtract full-day blockers
      let available = availableMin;
      try {
        const blockerRows = await settingsRepo.listBlockers({ employeeId: emp.id, dateIso: date });
        if (blockerRows.length > 0) {
          available = 0; // Day is blocked
        }
      } catch { /* ignore */ }

      // Get booked minutes for this employee on this date
      const adapter = db.getAdapter();
      const eventRows = adapter.query(
        `SELECT SUM(total_minutes + travel_minutes) as booked_minutes
         FROM plan_events pe
         JOIN plan_event_employees pee ON pe.id = pee.event_id
         WHERE pee.employee_id = ? AND pe.kind = ? AND pe.start_date <= ? AND pe.end_date >= ?`,
        [emp.id, kind, date, date]
      ) as Array<Record<string, unknown>>;
      const bookedMin = Number(eventRows[0]?.booked_minutes || 0);

      employees.push({
        id: emp.id,
        name: emp.name,
        availableMin: available,
        bookedMin,
        role: emp.role,
        color: emp.color,
      });
    }

    res.json({ date, kind, employees });
  } catch (error) {
    console.error('Error getting capacity/day:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
