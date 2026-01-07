import { Router } from 'express';
import { AutoPlanService } from '../services/AutoPlanService';
import { getDB } from '../db/db';

export const autoPlanRouter = Router();

/**
 * POST /api/autoplan/run
 * Execute an auto-planning run
 */
autoPlanRouter.post('/autoplan/run', async (req, res) => {
  try {
    const { startDate, endDate, includeProduction, includeMontage, overwriteExisting } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const db = getDB();
    const service = new AutoPlanService(
      db.getOrdersRepo(),
      db.getSettingsRepo(),
      db.getPlanningRepo()
    );

    const result = await service.executeAutoPlan({
      startDate,
      endDate,
      includeProduction,
      includeMontage,
      overwriteExisting,
    });

    res.json(result);
  } catch (error) {
    console.error('Error executing auto-plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
