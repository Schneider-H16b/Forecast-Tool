import { Router } from 'express';
import { getDB } from '../db/db';

export const settingsRouter = Router();

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
    const id = await repo.upsertEmployee(req.body);
    res.status(201).json({ id });
  } catch (e) {
    console.error('upsert employee error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.put('/settings/employees/:id', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const id = await repo.upsertEmployee({ ...req.body, id: req.params.id });
    res.json({ id });
  } catch (e) {
    console.error('upsert employee error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

// Blockers
settingsRouter.get('/settings/blockers', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const employeeId = req.query.employeeId as string | undefined;
    const dateIso = req.query.dateIso as string | undefined;
    const blockers = await repo.listBlockers({ employeeId, dateIso });
    res.json(blockers);
  } catch (e) {
    console.error('list blockers error', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

settingsRouter.post('/settings/blockers', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const id = await repo.upsertBlocker(req.body);
    res.status(201).json({ id });
  } catch (e) {
    console.error('upsert blocker error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.put('/settings/blockers/:id', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    const id = await repo.upsertBlocker({ ...req.body, id: req.params.id });
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
    await repo.upsertItem(req.body);
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('upsert item error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});

settingsRouter.put('/settings/items/:sku', async (req, res) => {
  try {
    const repo = getDB().getSettingsRepo();
    await repo.upsertItem({ ...req.body, sku: req.params.sku });
    res.json({ success: true });
  } catch (e) {
    console.error('upsert item error', e);
    res.status(400).json({ error: 'Bad request' });
  }
});
