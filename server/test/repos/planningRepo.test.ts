import { describe, it, expect, beforeEach } from 'vitest';
import { PlanningRepoMemory } from '../../src/repos/in-memory/PlanningRepoMemory';
import type { PlanEventInput } from '../../src/repos/interfaces/PlanningRepo';

describe('PlanningRepo', () => {
  let repo: PlanningRepoMemory;

  beforeEach(() => {
    repo = new PlanningRepoMemory();
  });

  it('should create a plan event', async () => {
    const input: PlanEventInput = {
      kind: 'production',
      orderId: 'order-1',
      startDate: '2026-02-01',
      endDate: '2026-02-01',
      totalMinutes: 240,
      travelMinutes: 30,
      employeeIds: ['emp-1', 'emp-2'],
    };

    const id = await repo.createEvent(input);
    expect(id).toMatch(/^event-/);

    const events = await repo.listEvents();
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('production');
    expect(events[0].total_minutes).toBe(240);
    expect(events[0].employeeIds).toHaveLength(2);
  });

  it('should update a plan event', async () => {
    const input: PlanEventInput = {
      kind: 'production',
      orderId: 'order-1',
      startDate: '2026-02-01',
      endDate: '2026-02-01',
      totalMinutes: 240,
      employeeIds: ['emp-1'],
    };

    const id = await repo.createEvent(input);

    const updateInput: PlanEventInput = {
      id,
      kind: 'montage',
      orderId: 'order-1',
      startDate: '2026-02-02',
      endDate: '2026-02-02',
      totalMinutes: 360,
      employeeIds: ['emp-1', 'emp-2', 'emp-3'],
    };

    await repo.updateEvent(updateInput);

    const events = await repo.listEvents();
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('montage');
    expect(events[0].total_minutes).toBe(360);
    expect(events[0].employeeIds).toHaveLength(3);
  });

  it('should delete a plan event', async () => {
    const input: PlanEventInput = {
      kind: 'production',
      orderId: 'order-1',
      startDate: '2026-02-01',
      endDate: '2026-02-01',
      totalMinutes: 240,
    };

    const id = await repo.createEvent(input);

    await repo.deleteEvent(id);

    const events = await repo.listEvents();
    expect(events).toHaveLength(0);
  });

  it('should list events filtered by kind', async () => {
    await repo.createEvent({
      kind: 'production',
      orderId: 'order-1',
      startDate: '2026-02-01',
      endDate: '2026-02-01',
      totalMinutes: 240,
    });

    await repo.createEvent({
      kind: 'montage',
      orderId: 'order-2',
      startDate: '2026-02-02',
      endDate: '2026-02-02',
      totalMinutes: 180,
    });

    await repo.createEvent({
      kind: 'production',
      orderId: 'order-3',
      startDate: '2026-02-03',
      endDate: '2026-02-03',
      totalMinutes: 300,
    });

    const productionEvents = await repo.listEvents('production');
    expect(productionEvents).toHaveLength(2);

    const montageEvents = await repo.listEvents('montage');
    expect(montageEvents).toHaveLength(1);
  });

  it('should list events filtered by date range', async () => {
    await repo.createEvent({
      kind: 'production',
      orderId: 'order-1',
      startDate: '2026-01-15',
      endDate: '2026-01-15',
      totalMinutes: 240,
    });

    await repo.createEvent({
      kind: 'production',
      orderId: 'order-2',
      startDate: '2026-02-10',
      endDate: '2026-02-10',
      totalMinutes: 180,
    });

    await repo.createEvent({
      kind: 'production',
      orderId: 'order-3',
      startDate: '2026-03-05',
      endDate: '2026-03-05',
      totalMinutes: 300,
    });

    const events = await repo.listEvents(undefined, { from: '2026-02-01', to: '2026-02-28' });
    expect(events).toHaveLength(1);
    expect(events[0].order_id).toBe('order-2');
  });

  it('should get remaining capacity', async () => {
    const capacity = await repo.getRemainingCapacity('production', '2026-02-01');
    expect(capacity).toBeGreaterThan(0);
  });

  it('should handle events without employee assignments', async () => {
    const input: PlanEventInput = {
      kind: 'production',
      orderId: 'order-1',
      startDate: '2026-02-01',
      endDate: '2026-02-01',
      totalMinutes: 240,
    };

    const id = await repo.createEvent(input);

    const events = await repo.listEvents();
    expect(events).toHaveLength(1);
    expect(events[0].employeeIds).toHaveLength(0);
  });
});
