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
