import { Router } from 'express';
import { getDB } from '../db/db';

export const biRouter = Router();

/**
 * BI dashboard config persisted in app_settings under key 'bi.dashboard'
 * Shape: { widgets: Array<any>, layouts: Record<string, any> }
 */
biRouter.get('/bi/dashboard', async (_req, res) => {
  try {
    const settings = getDB().getSettingsRepo();
    const cfg = (await settings.getAppSetting('bi.dashboard')) as any;
    res.json(cfg || { widgets: [], layouts: null });
  } catch (e) {
    console.error('BI get error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

biRouter.put('/bi/dashboard', async (req, res) => {
  try {
    const { widgets, layouts } = req.body || {};
    if (!widgets || !layouts) {
      return res.status(400).json({ error: 'widgets and layouts required' });
    }
    const settings = getDB().getSettingsRepo();
    await settings.setAppSetting('bi.dashboard', { widgets, layouts, updatedAt: new Date().toISOString() });
    res.json({ ok: true });
  } catch (e) {
    console.error('BI set error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});
