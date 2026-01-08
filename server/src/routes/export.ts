import { Router } from 'express';
import { getDB } from '../db/db';

export const exportRouter = Router();

/**
 * POST /api/export/orders
 * Export orders in CSV or JSON format
 * Query params: format (csv|json), from (YYYY-MM-DD), to (YYYY-MM-DD), statuses (comma-separated)
 */
exportRouter.post('/export/orders', async (req, res) => {
  try {
    const format = (req.query.format as string || 'csv').toLowerCase();
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const statuses = req.query.statuses ? (req.query.statuses as string).split(',').filter(Boolean) : undefined;

    if (format !== 'csv' && format !== 'json') {
      return res.status(400).json({ error: 'Invalid format. Use "csv" or "json"' });
    }

    const repo = getDB().getOrdersRepo();
    const orders = await repo.listOrders({
      from,
      to,
      statuses,
      sort: 'forecast:asc',
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.json"`);
      res.send(JSON.stringify(orders, null, 2));
    } else {
      // CSV format
      const headers = ['ID', 'Ext_ID', 'Customer', 'Status', 'Forecast_Date', 'Sum_Total', 'Distance_KM', 'Forecast_Miss', 'Miss_Days'];
      const rows = orders.map(o => [
        o.id,
        o.ext_id ?? '',
        o.customer ?? '',
        o.status,
        o.forecast_date ?? '',
        o.sum_total ?? '',
        o.distance_km ?? '',
        o.forecast_miss ?? '',
        o.miss_days ?? '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => {
          const str = String(cell ?? '');
          // Escape quotes and wrap in quotes if contains comma or quote
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csvContent);
    }
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
