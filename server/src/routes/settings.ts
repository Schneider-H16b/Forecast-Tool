import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/db';

export const settingsRouter = Router();

function numOrUndefined(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

// App settings (generic key/value JSON)
settingsRouter.get('/settings/app/:key', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const value = await repo.getAppSetting(req.params.key);
    res.json({ key: req.params.key, value });
  } catch (e) {
    console.error('get app setting error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.put('/settings/app/:key', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    await repo.setAppSetting(req.params.key, req.body?.value);
    res.json({ success: true });
  } catch (e) {
    console.error('set app setting error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

// Global settings (typed)
settingsRouter.get('/settings/global', async (_req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const settings = await repo.getGlobalSettings();
    res.json(settings);
  } catch (e) {
    console.error('get global settings error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.put('/settings/global', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const payload = req.body ?? {};
    const patch: Record<string, unknown> = {};
    if ('dayMinutes' in payload) patch.dayMinutes = numOrUndefined(payload.dayMinutes);
    if ('minCapPerDay' in payload) patch.minCapPerDay = numOrUndefined(payload.minCapPerDay);
    if ('travelKmh' in payload) patch.travelKmh = numOrUndefined(payload.travelKmh);
    if ('travelRoundTrip' in payload) patch.travelRoundTrip = Boolean(payload.travelRoundTrip);
    const saved = await repo.setGlobalSettings(patch as any);
    res.json(saved);
  } catch (e) {
    console.error('set global settings error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

// AutoPlan settings (typed)
settingsRouter.get('/settings/autoplan', async (_req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const settings = await repo.getAutoPlanSettings();
    res.json(settings);
  } catch (e) {
    console.error('get autoplan settings error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.put('/settings/autoplan', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const payload = req.body ?? {};
    const patch: Record<string, unknown> = {};
    if ('tolPerDayMin' in payload) patch.tolPerDayMin = numOrUndefined(payload.tolPerDayMin);
    if ('maxEmployeesPerOrder' in payload) patch.maxEmployeesPerOrder = numOrUndefined(payload.maxEmployeesPerOrder);
    if ('softConflictLimitMin' in payload) patch.softConflictLimitMin = numOrUndefined(payload.softConflictLimitMin);
    if ('autoPlanMontageSlipBackDays' in payload) patch.autoPlanMontageSlipBackDays = numOrUndefined(payload.autoPlanMontageSlipBackDays);
    if ('autoPlanMontageSlipFwdDays' in payload) patch.autoPlanMontageSlipFwdDays = numOrUndefined(payload.autoPlanMontageSlipFwdDays);
    if ('autoPlanProductionLookaheadDays' in payload) patch.autoPlanProductionLookaheadDays = numOrUndefined(payload.autoPlanProductionLookaheadDays);
    if ('respectOvernightBarriers' in payload) patch.respectOvernightBarriers = Boolean(payload.respectOvernightBarriers);
    const saved = await repo.setAutoPlanSettings(patch as any);
    res.json(saved);
  } catch (e) {
    console.error('set autoplan settings error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

// Employees
settingsRouter.get('/settings/employees', async (_req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const employees = await repo.listEmployees();
    res.json(employees);
  } catch (e) {
    console.error('list employees error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.post('/settings/employees', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const body = req.body ?? {};
    const id = await repo.upsertEmployee({
      id: body.id || uuidv4(),
      name: body.name,
      role: body.role,
      weeklyHours: clamp(Number(body.weeklyHours || 0), 0, 80),
      daysMask: Number(body.daysMask || 0),
      active: body.active !== false,
      color: body.color,
    });
    res.status(201).json({ id });
  } catch (e) {
    console.error('upsert employee error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.put('/settings/employees/:id', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const body = req.body ?? {};
    const id = await repo.upsertEmployee({
      id: req.params.id,
      name: body.name,
      role: body.role,
      weeklyHours: clamp(Number(body.weeklyHours || 0), 0, 80),
      daysMask: Number(body.daysMask || 0),
      active: body.active !== false,
      color: body.color,
    });
    res.json({ id });
  } catch (e) {
    console.error('upsert employee error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.delete('/settings/employees/:id', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    await repo.deleteEmployee(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error('delete employee error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

// Blockers
settingsRouter.get('/settings/blockers', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const employeeId = req.query.employeeId as string | undefined;
    const dateIso = req.query.dateIso as string | undefined;
    const monthIso = req.query.monthIso as string | undefined;
    const blockers = await repo.listBlockers({ employeeId, dateIso, monthIso });
    res.json(blockers);
  } catch (e) {
    console.error('list blockers error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.post('/settings/blockers', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const body = req.body ?? {};
    const id = await repo.upsertBlocker({
      id: body.id || uuidv4(),
      employeeId: body.employeeId,
      dateIso: body.dateIso,
      overnight: Boolean(body.overnight),
      reason: body.reason,
    });
    res.status(201).json({ id });
  } catch (e) {
    console.error('upsert blocker error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.put('/settings/blockers/:id', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const body = req.body ?? {};
    const id = await repo.upsertBlocker({
      id: req.params.id,
      employeeId: body.employeeId,
      dateIso: body.dateIso,
      overnight: Boolean(body.overnight),
      reason: body.reason,
    });
    res.json({ id });
  } catch (e) {
    console.error('upsert blocker error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.delete('/settings/blockers/:id', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    await repo.deleteBlocker(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error('delete blocker error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

// Items
settingsRouter.get('/settings/items', async (_req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const items = await repo.listItems();
    res.json(items);
  } catch (e) {
    console.error('list items error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.post('/settings/items', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const body = req.body ?? {};
    await repo.upsertItem({
      sku: body.sku,
      name: body.name,
      prodMinPerUnit: clamp(Number(body.prodMinPerUnit || 0), 0, 600),
      montMinPerUnit: clamp(Number(body.montMinPerUnit || 0), 0, 600),
      active: body.active !== false,
    });
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('upsert item error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.put('/settings/items/:sku', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const body = req.body ?? {};
    await repo.upsertItem({
      sku: req.params.sku,
      name: body.name,
      prodMinPerUnit: clamp(Number(body.prodMinPerUnit || 0), 0, 600),
      montMinPerUnit: clamp(Number(body.montMinPerUnit || 0), 0, 600),
      active: body.active !== false,
    });
    res.json({ success: true });
  } catch (e) {
    console.error('upsert item error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.delete('/settings/items/:sku', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    await repo.deleteItem(req.params.sku);
    res.json({ success: true });
  } catch (e) {
    console.error('delete item error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});
