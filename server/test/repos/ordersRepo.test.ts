import { describe, it, expect, beforeEach } from 'vitest';
import { OrdersRepoMemory } from '../../src/repos/in-memory/OrdersRepoMemory';
import type { Order, OrderLine } from '../../src/types';

describe('OrdersRepo', () => {
  let repo: OrdersRepoMemory;

  beforeEach(() => {
    repo = new OrdersRepoMemory();
  });

  it('should upsert and list orders', async () => {
    const orders: Order[] = [
      {
        id: 'order-1',
        ext_id: 'EXT-001',
        customer: 'Customer A',
        status: 'open',
        forecast_date: '2026-02-01',
        sum_total: 1000,
        delivered_ratio: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'order-2',
        ext_id: 'EXT-002',
        customer: 'Customer B',
        status: 'closed',
        forecast_date: '2026-01-15',
        sum_total: 500,
        delivered_ratio: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-05T00:00:00Z',
      },
    ];

    await repo.upsertOrders(orders);

    const allOrders = await repo.listOrders();
    expect(allOrders).toHaveLength(2);

    const openOrders = await repo.listOrders({ status: 'open' });
    expect(openOrders).toHaveLength(1);
    expect(openOrders[0].customer).toBe('Customer A');
  });

  it('should get order with lines', async () => {
    const order: Order = {
      id: 'order-1',
      ext_id: 'EXT-001',
      customer: 'Customer A',
      status: 'open',
      forecast_date: '2026-02-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    const lines: OrderLine[] = [
      { id: 'line-1', order_id: 'order-1', sku: 'SKU-A', qty: 10, unit_price: 50 },
      { id: 'line-2', order_id: 'order-1', sku: 'SKU-B', qty: 5, unit_price: 100 },
    ];

    await repo.upsertOrders([order]);
    await repo.upsertOrderLines(lines);

    const result = await repo.getOrderWithLines('order-1');
    expect(result).not.toBeNull();
    expect(result?.lines).toHaveLength(2);
    expect(result?.lines[0].sku).toBe('SKU-A');
  });

  it('should update order meta', async () => {
    const order: Order = {
      id: 'order-1',
      ext_id: 'EXT-001',
      customer: 'Customer A',
      status: 'open',
      forecast_date: '2026-02-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      distance_km: 0,
      forecast_miss: 0,
      miss_days: 0,
    };

    await repo.upsertOrders([order]);
    await repo.updateOrderMeta('order-1', { distanceKm: 150, forecast_miss: 1, miss_days: 2 });

    const result = await repo.getOrderWithLines('order-1');
    expect(result?.distance_km).toBe(150);
    expect(result?.forecast_miss).toBe(1);
    expect(result?.miss_days).toBe(2);
  });

  it('should filter orders by date range', async () => {
    const orders: Order[] = [
      {
        id: 'order-1',
        status: 'open',
        forecast_date: '2026-01-10',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'order-2',
        status: 'open',
        forecast_date: '2026-02-15',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'order-3',
        status: 'open',
        forecast_date: '2026-03-20',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    await repo.upsertOrders(orders);

    const filtered = await repo.listOrders({ from: '2026-02-01', to: '2026-03-01' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('order-2');
  });
});
