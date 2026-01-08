import { Router } from 'express';
import { getDB } from '../db/db';

export const ordersRouter = Router();

// GET /api/orders?status=open|delivered|canceled&from=YYYY-MM-DD&to=YYYY-MM-DD&search=...&onlyWithPositions=1
ordersRouter.get('/orders', async (req, res) => {
  try {
    const { status, statuses, from, to, search, onlyDelayed, onlyUnplanned, onlyWithPositions, sort } = req.query as Record<string, string | undefined>;
    const repo = getDB().getOrdersRepo();
    const statusList = statuses ? statuses.split(',').filter(Boolean) : undefined;
    const orders = await repo.listOrders({
      status,
      statuses: statusList,
      from,
      to,
      search,
      onlyDelayed: onlyDelayed === '1' || onlyDelayed === 'true',
      onlyUnplanned: onlyUnplanned === '1' || onlyUnplanned === 'true',
      onlyWithPositions: onlyWithPositions === '1' || onlyWithPositions === 'true',
      sort: sort,
    });
    res.json(orders);
  } catch (err) {
    console.error('Error listing orders', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id -> order with lines and events grouped by kind
ordersRouter.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const repo = db.getOrdersRepo();
    const detail = await repo.getOrderWithLines(id);
    if (!detail) return res.status(404).json({ error: 'Not found' });

    // Query events for this order (including employeeIds)
    const adapter = db.getAdapter();
    const rows = adapter.query('SELECT * FROM plan_events WHERE order_id = ? ORDER BY start_date ASC', [id]) as Array<Record<string, unknown>>;
    const events = await Promise.all(rows.map(async (r) => {
      const emp = adapter.query('SELECT employee_id FROM plan_event_employees WHERE event_id = ?', [r.id as string]) as Array<Record<string, unknown>>;
      return {
        id: r.id as string,
        kind: r.kind as string,
        order_id: r.order_id as string,
        start_date: r.start_date as string,
        end_date: r.end_date as string,
        total_minutes: (r.total_minutes as number) ?? 0,
        travel_minutes: (r.travel_minutes as number) ?? 0,
        source: (r.source as string) || 'manual',
        employeeIds: emp.map(e => e.employee_id as string),
      };
    }));

    res.json({ order: detail, events });
  } catch (err) {
    console.error('Error fetching order detail', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/critical?days=14
// Returns open, unplanned orders with missing/overdue forecast or forecast within N days
ordersRouter.get('/orders/critical', async (req, res) => {
  try {
    const days = Number((req.query.days as string) || '14');
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const from = `${yyyy}-${mm}-${dd}`;
    const toDate = new Date(now);
    toDate.setDate(now.getDate() + (Number.isFinite(days) ? days : 14));
    const to = `${toDate.getFullYear()}-${String(toDate.getMonth()+1).padStart(2,'0')}-${String(toDate.getDate()).padStart(2,'0')}`;

    const repo = getDB().getOrdersRepo();
    const orders = await repo.listOrders({
      statuses: ['open'],
      from,
      to,
      onlyUnplanned: true,
      sort: 'forecast:asc',
    });
    res.json(orders);
  } catch (err) {
    console.error('Error listing critical orders', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/meta { distanceKm, forecast_miss, miss_days }
ordersRouter.patch('/orders/:id/meta', async (req, res) => {
  try {
    const { id } = req.params;
    const { distanceKm, forecast_miss, miss_days } = req.body as { distanceKm?: number; forecast_miss?: number; miss_days?: number };
    const repo = getDB().getOrdersRepo();
    await repo.updateOrderMeta(id, { distanceKm, forecast_miss, miss_days });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating order meta', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
