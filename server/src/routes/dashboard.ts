import { Router } from 'express';
import { KPIService } from '../services/KPIService';
import { getDB } from '../db/db';

export const dashboardRouter = Router();

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics and KPIs for a date range
 * Query params: from (date), to (date)
 */
dashboardRouter.get('/dashboard/metrics', async (req, res) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to date are required' });
    }

    const db = getDB();
    const service = new KPIService(
      db.getOrdersRepo(),
      db.getSettingsRepo(),
      db.getPlanningRepo()
    );

    const result = await service.calculateDashboardMetrics({ from, to });

    res.json(result);
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/kpis
 * Get just the KPI summary without full metrics
 * Query params: from (date), to (date)
 */
dashboardRouter.get('/dashboard/kpis', async (req, res) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to date are required' });
    }

    const db = getDB();
    const service = new KPIService(
      db.getOrdersRepo(),
      db.getSettingsRepo(),
      db.getPlanningRepo()
    );

    const result = await service.calculateDashboardMetrics({ from, to });

    res.json({ kpis: result.kpis });
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
