import { describe, it, expect, beforeEach } from 'vitest';
import { AutoPlanService } from '../../src/services/AutoPlanService';
import { OrdersRepoMemory } from '../../src/repos/in-memory/OrdersRepoMemory';
import { SettingsRepoMemory } from '../../src/repos/in-memory/SettingsRepoMemory';
import { PlanningRepoMemory } from '../../src/repos/in-memory/PlanningRepoMemory';

describe('AutoPlanService', () => {
  let service: AutoPlanService;
  let ordersRepo: OrdersRepoMemory;
  let settingsRepo: SettingsRepoMemory;
  let planningRepo: PlanningRepoMemory;

  beforeEach(async () => {
    ordersRepo = new OrdersRepoMemory();
    settingsRepo = new SettingsRepoMemory();
    planningRepo = new PlanningRepoMemory();
    service = new AutoPlanService(ordersRepo, settingsRepo, planningRepo);

    // Setup test employees
    await settingsRepo.upsertEmployee({
      id: 'emp-1',
      name: 'John Doe',
      isArchived: false,
    });
    await settingsRepo.upsertEmployee({
      id: 'emp-2',
      name: 'Jane Smith',
      isArchived: false,
    });
  });

  it('should create production and montage events for an order', async () => {
    await ordersRepo.upsertOrders([{
      id: 'order-1',
      customer: 'Customer A',
      delivery_date: '2026-02-15',
      total_prod_min: 240,
      total_mont_min: 180,
      status: 'open',
    }]);

    const result = await service.executeAutoPlan({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });

    expect(result.createdEvents).toBe(2);
    expect(result.skippedOrders).toBe(0);
    
    const events = await planningRepo.listEvents();
    expect(events.length).toBe(2);
    
    const prodEvent = events.find(e => e.kind === 'production');
    const montEvent = events.find(e => e.kind === 'montage');
    
    expect(prodEvent).toBeDefined();
    expect(montEvent).toBeDefined();
    expect(prodEvent?.total_minutes).toBe(240);
    expect(montEvent?.total_minutes).toBe(180);
  });

  it('should skip orders without effort data', async () => {
    await ordersRepo.upsertOrders([{
      id: 'order-1',
      customer: 'Customer A',
      delivery_date: '2026-02-15',
      total_prod_min: 0,
      total_mont_min: 0,
      status: 'open',
    }]);

    const result = await service.executeAutoPlan({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });

    expect(result.createdEvents).toBe(0);
    const events = await planningRepo.listEvents();
    expect(events.length).toBe(0);
  });

  it('should skip orders outside date range', async () => {
    await ordersRepo.upsertOrders([{
      id: 'order-1',
      customer: 'Customer A',
      delivery_date: '2026-03-15',
      total_prod_min: 240,
      total_mont_min: 180,
      status: 'open',
    }]);

    const result = await service.executeAutoPlan({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });

    expect(result.createdEvents).toBe(0);
    const events = await planningRepo.listEvents();
    expect(events.length).toBe(0);
  });

  it('should create only production events when montage disabled', async () => {
    await ordersRepo.upsertOrders([{
      id: 'order-1',
      customer: 'Customer A',
      delivery_date: '2026-02-15',
      total_prod_min: 240,
      total_mont_min: 180,
      status: 'open',
    }]);

    const result = await service.executeAutoPlan({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      includeMontage: false,
    });

    expect(result.createdEvents).toBe(1);
    
    const events = await planningRepo.listEvents();
    expect(events.length).toBe(1);
    expect(events[0].kind).toBe('production');
  });

  it('should create only montage events when production disabled', async () => {
    await ordersRepo.upsertOrders([{
      id: 'order-1',
      customer: 'Customer A',
      delivery_date: '2026-02-15',
      total_prod_min: 240,
      total_mont_min: 180,
      status: 'open',
    }]);

    const result = await service.executeAutoPlan({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      includeProduction: false,
    });

    expect(result.createdEvents).toBe(1);
    
    const events = await planningRepo.listEvents();
    expect(events.length).toBe(1);
    expect(events[0].kind).toBe('montage');
  });

  it('should report issue when no employees available', async () => {
    // Create a fresh service with no employees
    const emptySettingsRepo = new SettingsRepoMemory();
    const emptyService = new AutoPlanService(ordersRepo, emptySettingsRepo, planningRepo);

    await ordersRepo.upsertOrders([{
      id: 'order-1',
      customerName: 'Customer A',
      deliveryDate: '2026-02-15',
      totalProdMin: 240,
      totalMontMin: 180,
    }]);

    const result = await emptyService.executeAutoPlan({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].type).toBe('no_employees');
  });

  it('should calculate travel time for montage events', async () => {
    await ordersRepo.upsertOrders([{
      id: 'order-1',
      customer: 'Customer A',
      delivery_date: '2026-02-15',
      total_prod_min: 0,
      total_mont_min: 180,
      distance_km: 50,
      status: 'open',
    }]);

    const result = await service.executeAutoPlan({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      includeProduction: false,
    });

    expect(result.createdEvents).toBe(1);
    
    const events = await planningRepo.listEvents();
    // 50km * 2 (roundtrip) / 80 km/h * 60 min/h = 75 minutes
    expect(events[0].travel_minutes).toBe(75);
  });
});
