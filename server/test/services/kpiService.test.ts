import { describe, it, expect, beforeEach } from 'vitest';
import { KPIService } from '../../src/services/KPIService';
import { OrdersRepoMemory } from '../../src/repos/in-memory/OrdersRepoMemory';
import { SettingsRepoMemory } from '../../src/repos/in-memory/SettingsRepoMemory';
import { PlanningRepoMemory } from '../../src/repos/in-memory/PlanningRepoMemory';

describe('KPIService', () => {
  let service: KPIService;
  let ordersRepo: OrdersRepoMemory;
  let settingsRepo: SettingsRepoMemory;
  let planningRepo: PlanningRepoMemory;

  beforeEach(async () => {
    ordersRepo = new OrdersRepoMemory();
    settingsRepo = new SettingsRepoMemory();
    planningRepo = new PlanningRepoMemory();
    service = new KPIService(ordersRepo, settingsRepo, planningRepo);

    // Setup test data
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

  it('should calculate empty metrics when no data exists', async () => {
    const result = await service.calculateDashboardMetrics({
      from: '2026-02-01',
      to: '2026-02-28',
    });

    expect(result.metrics.orders.total).toBe(0);
    expect(result.metrics.orders.open).toBe(0);
    expect(result.metrics.planning.totalEvents).toBe(0);
    expect(result.kpis.length).toBeGreaterThan(0);
  });

  it('should calculate metrics with orders', async () => {
    await ordersRepo.upsertOrders([
      {
        id: 'order-1',
        customer: 'Customer A',
        delivery_date: '2026-02-15',
        status: 'open',
      },
      {
        id: 'order-2',
        customer: 'Customer B',
        delivery_date: '2026-02-20',
        status: 'delivered',
      },
      {
        id: 'order-3',
        customer: 'Customer C',
        delivery_date: '2026-02-25',
        status: 'delivered',
        miss_days: 2,
      },
    ]);

    const result = await service.calculateDashboardMetrics({
      from: '2026-02-01',
      to: '2026-02-28',
    });

    expect(result.metrics.orders.total).toBe(3);
    expect(result.metrics.orders.open).toBe(1);
    expect(result.metrics.orders.delivered).toBe(2);
    // Average miss_days: (0 + 0 + 2) / 3 = 0.67, rounds to 0.7
    expect(result.metrics.orders.averageDeliveryDaysLate).toBe(0.7);
  });

  it('should calculate metrics with planning events', async () => {
    await ordersRepo.upsertOrders([
      {
        id: 'order-1',
        customer: 'Customer A',
        delivery_date: '2026-02-15',
        status: 'open',
        total_prod_min: 240,
      },
    ]);

    await planningRepo.createEvent({
      kind: 'production',
      orderId: 'order-1',
      startDate: '2026-02-10',
      endDate: '2026-02-10',
      totalMinutes: 240,
      employeeIds: ['emp-1', 'emp-2'],
    });

    const result = await service.calculateDashboardMetrics({
      from: '2026-02-01',
      to: '2026-02-28',
    });

    expect(result.metrics.planning.totalEvents).toBe(1);
    expect(result.metrics.planning.productionEvents).toBe(1);
    expect(result.metrics.planning.plannedOrders).toBe(1);
    expect(result.metrics.planning.unplannedOrders).toBe(0);
  });

  it('should calculate on-time delivery rate', async () => {
    await ordersRepo.upsertOrders([
      {
        id: 'order-1',
        customer: 'Customer A',
        delivery_date: '2026-02-15',
        status: 'delivered',
        miss_days: 0,
      },
      {
        id: 'order-2',
        customer: 'Customer B',
        delivery_date: '2026-02-20',
        status: 'delivered',
        miss_days: 0,
      },
      {
        id: 'order-3',
        customer: 'Customer C',
        delivery_date: '2026-02-25',
        status: 'delivered',
        miss_days: 5,
      },
    ]);

    const result = await service.calculateDashboardMetrics({
      from: '2026-02-01',
      to: '2026-02-28',
    });

    expect(result.metrics.performance.onTimeDeliveryRate).toBeCloseTo(66.67, 0);
  });

  it('should include KPIs in summary', async () => {
    await ordersRepo.upsertOrders([
      {
        id: 'order-1',
        customer: 'Customer A',
        delivery_date: '2026-02-15',
        status: 'open',
        total_prod_min: 240,
      },
    ]);

    const result = await service.calculateDashboardMetrics({
      from: '2026-02-01',
      to: '2026-02-28',
    });

    expect(result.kpis).toHaveLength(8);
    expect(result.kpis[0].label).toBe('Open Orders');
    expect(result.kpis[0].value).toBe(1);
    expect(result.kpis[0].unit).toBe('orders');
  });

  it('should calculate employee utilization', async () => {
    for (let i = 0; i < 5; i++) {
      await planningRepo.createEvent({
        kind: 'production',
        orderId: `order-${i}`,
        startDate: '2026-02-10',
        endDate: '2026-02-10',
        totalMinutes: 120,
        employeeIds: ['emp-1', 'emp-2'],
      });
    }

    const result = await service.calculateDashboardMetrics({
      from: '2026-02-01',
      to: '2026-02-28',
    });

    expect(result.metrics.planning.averageEmployeeUtilization).toBeGreaterThan(0);
    expect(result.metrics.planning.totalEvents).toBe(5);
  });

  it('should filter orders outside date range', async () => {
    await ordersRepo.upsertOrders([
      {
        id: 'order-1',
        customer: 'Customer A',
        delivery_date: '2026-01-15',
        status: 'open',
      },
      {
        id: 'order-2',
        customer: 'Customer B',
        delivery_date: '2026-02-15',
        status: 'open',
      },
    ]);

    const result = await service.calculateDashboardMetrics({
      from: '2026-02-01',
      to: '2026-02-28',
    });

    // Should only count order-2 (within range)
    expect(result.metrics.orders.total).toBe(1);
    expect(result.metrics.orders.open).toBe(1);
  });
});
