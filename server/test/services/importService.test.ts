import { describe, it, expect } from 'vitest';
import { ImportService } from '../../src/services/ImportService';
import type { CsvRow } from '../../src/services/ImportService';

describe('ImportService', () => {
  const service = new ImportService();

  it('should parse CSV rows into orders and lines', () => {
    const rows: CsvRow[] = [
      {
        order_id: 'ORD-001',
        customer: 'Customer A',
        status: 'open',
        forecast_date: '2026-02-01',
        sku: 'SKU-A',
        qty: '10',
        unit_price: '50',
      },
      {
        order_id: 'ORD-001',
        customer: 'Customer A',
        status: 'open',
        forecast_date: '2026-02-01',
        sku: 'SKU-B',
        qty: '5',
        unit_price: '100',
      },
      {
        order_id: 'ORD-002',
        customer: 'Customer B',
        status: 'closed',
        forecast_date: '2026-01-15',
        sku: 'SKU-C',
        qty: '20',
        unit_price: '25',
      },
    ];

    const result = service.parseOrdersCsv(rows);

    expect(result.orders).toHaveLength(2);
    expect(result.lines).toHaveLength(3);

    const order1 = result.orders.find(o => o.ext_id === 'ORD-001');
    expect(order1?.customer).toBe('Customer A');
    expect(order1?.status).toBe('open');

    const linesForOrder1 = result.lines.filter(l => l.order_id === order1?.id);
    expect(linesForOrder1).toHaveLength(2);
  });

  it('should create import metadata with hashes', () => {
    const rows: CsvRow[] = [
      { order_id: 'ORD-001', customer: 'Customer A', sku: 'SKU-A', qty: '10' },
      { order_id: 'ORD-002', customer: 'Customer B', sku: 'SKU-B', qty: '5' },
    ];

    const meta = service.createImportMeta(rows, { source: 'test.csv' });

    expect(meta.id).toMatch(/^import-/);
    expect(meta.source).toBe('test.csv');
    expect(meta.header_hash).toBeDefined();
    expect(meta.lines_hash).toBeDefined();
    expect(meta.created_at).toBeDefined();
  });

  it('should calculate effort for order lines', () => {
    const lines = [
      { id: 'line-1', order_id: 'order-1', sku: 'SKU-A', qty: 10 },
      { id: 'line-2', order_id: 'order-1', sku: 'SKU-B', qty: 5 },
      { id: 'line-3', order_id: 'order-2', sku: 'SKU-C', qty: 20 },
    ];

    const itemsConfig = new Map([
      ['SKU-A', { prodMinPerUnit: 15, montMinPerUnit: 10 }],
      ['SKU-B', { prodMinPerUnit: 30, montMinPerUnit: 20 }],
      ['SKU-C', { prodMinPerUnit: 5, montMinPerUnit: 3 }],
    ]);

    const efforts = service.calculateEffort(lines, itemsConfig);

    expect(efforts).toHaveLength(3);

    const effortA = efforts.find(e => e.sku === 'SKU-A');
    expect(effortA?.totalProdMin).toBe(150); // 10 * 15
    expect(effortA?.totalMontMin).toBe(100); // 10 * 10

    const effortB = efforts.find(e => e.sku === 'SKU-B');
    expect(effortB?.totalProdMin).toBe(150); // 5 * 30
    expect(effortB?.totalMontMin).toBe(100); // 5 * 20

    const effortC = efforts.find(e => e.sku === 'SKU-C');
    expect(effortC?.totalProdMin).toBe(100); // 20 * 5
    expect(effortC?.totalMontMin).toBe(60); // 20 * 3
  });

  it('should handle missing item configurations gracefully', () => {
    const lines = [
      { id: 'line-1', order_id: 'order-1', sku: 'SKU-A', qty: 10 },
      { id: 'line-2', order_id: 'order-1', sku: 'SKU-UNKNOWN', qty: 5 },
    ];

    const itemsConfig = new Map([['SKU-A', { prodMinPerUnit: 15, montMinPerUnit: 10 }]]);

    const efforts = service.calculateEffort(lines, itemsConfig);

    expect(efforts).toHaveLength(1); // Only SKU-A should be calculated
    expect(efforts[0].sku).toBe('SKU-A');
  });

  it('should handle empty CSV rows', () => {
    const result = service.parseOrdersCsv([]);
    expect(result.orders).toHaveLength(0);
    expect(result.lines).toHaveLength(0);
  });

  it('should generate unique IDs for orders without order_id', () => {
    const rows: CsvRow[] = [
      { customer: 'Customer A', sku: 'SKU-A', qty: '10' },
      { customer: 'Customer B', sku: 'SKU-B', qty: '5' },
    ];

    const result = service.parseOrdersCsv(rows);

    expect(result.orders).toHaveLength(2);
    expect(result.orders[0].id).toMatch(/^order-/);
    expect(result.orders[1].id).toMatch(/^order-/);
    expect(result.orders[0].id).not.toBe(result.orders[1].id);
  });
});
