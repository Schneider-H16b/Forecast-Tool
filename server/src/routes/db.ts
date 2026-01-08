import { Router } from 'express';
import { getDB } from '../db/db';

export const dbRouter = Router();

// GET /api/db/export - download current sqlite db bytes
dbRouter.get('/db/export', async (_req, res) => {
  try {
    const adapter = getDB().getAdapter();
    const buf = adapter.serialize();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="dev.db"');
    res.status(200).send(buf);
  } catch (e) {
    console.error('db export error', e);
    res.status(500).json({ error: 'Export failed' });
  }
});
