import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { initDB, getDB } from '../../src/db/db';
import { describe, it, beforeAll, expect } from 'vitest';

let app: any;
const dbPath = path.join(__dirname, 'tmp-newroutes.db');

describe('New routes', () => {
  beforeAll(async () => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    // Initialize temporary DB with schema
    const schemaPath = path.join(__dirname, '../../../docs/schema.sql');
    await initDB({ dbPath, schemaPath });
    // Import app after DB init so routes have access to initialized repos
    app = (await import('../../src/app')).default;
  });

  it('GET /api/orders/critical returns open unplanned within range', async () => {
    const db = getDB();
    const ordersRepo = db.getOrdersRepo();
    const iso = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    };
    await ordersRepo.upsertOrders([
      { id: 'o1', status: 'open', customer: 'ACME', forecast_date: iso(7), sum_total: 1000 },
      { id: 'o2', status: 'delivered', customer: 'Done', forecast_date: iso(20), sum_total: 500 },
    ] as any);

    const res = await request(app).get('/api/orders/critical?days=14');
    expect(res.status).toBe(200);
    const ids = (res.body as Array<any>).map(o => o.id);
    expect(ids).toContain('o1');
    expect(ids).not.toContain('o2');
  });

  it('GET /api/capacity/day returns per-employee breakdown', async () => {
    const db = getDB();
    const settingsRepo = db.getSettingsRepo();
    // Mon-Fri mask: bits 0-4 set => 0b00011111 = 31
    await settingsRepo.upsertEmployee({ id: 'emp1', name: 'Prod', role: 'production', weeklyHours: 40, daysMask: 31, active: true, color: '#f00' });

    const res = await request(app).get('/api/capacity/day').query({ kind: 'production', date: '2026-02-02' }); // 2026-02-02 is Monday
    expect(res.status).toBe(200);
    expect(res.body.employees).toBeDefined();
    const emp = res.body.employees.find((e: any) => e.id === 'emp1');
    expect(emp).toBeDefined();
    expect(emp.availableMin).toBeGreaterThan(0);
    expect(emp.bookedMin).toBe(0);
  });

  it('POST /api/export/orders returns JSON export', async () => {
    const db = getDB();
    const ordersRepo = db.getOrdersRepo();
    await ordersRepo.upsertOrders([
      { id: 'e1', status: 'open', customer: 'X', forecast_date: '2026-02-01', sum_total: 10 },
      { id: 'e2', status: 'open', customer: 'Y', forecast_date: '2026-02-02', sum_total: 20 },
    ] as any);

    const res = await request(app)
      .post('/api/export/orders')
      .query({ format: 'json', from: '2026-02-01', to: '2026-02-28' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    const arr = JSON.parse(res.text);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/db/export returns sqlite bytes', async () => {
    const res = await request(app).get('/api/db/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/octet-stream');
    expect(res.body instanceof Buffer || res.body instanceof Uint8Array).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/import/csv-dual imports header + positions csv', async () => {
    const headerCsv = 'AUFTRAGSNUMMER;KUNDENNAME;GESAMTBETRAG;LIEFERDATUM\nA1;Foo GmbH;1000;01.01.2026';
    const positionsCsv = 'AUFTRAGSNUMMER;ARTIKELNUMMER;MENGE;POSITIONSWERT\nA1;SKU1;2;500';

    const res = await request(app)
      .post('/api/import/csv-dual')
      .send({ headerCsvText: headerCsv, positionsCsvText: positionsCsv });
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
  });

  it('supports typed settings endpoints', async () => {
    const globalRes = await request(app).get('/api/settings/global');
    expect(globalRes.status).toBe(200);
    expect(globalRes.body.dayMinutes).toBeGreaterThan(0);

    const updatedGlobal = await request(app)
      .put('/api/settings/global')
      .send({ travelKmh: 90, travelRoundTrip: false });
    expect(updatedGlobal.status).toBe(200);
    expect(updatedGlobal.body.travelKmh).toBe(90);
    expect(updatedGlobal.body.travelRoundTrip).toBe(false);

    const updatedAuto = await request(app)
      .put('/api/settings/autoplan')
      .send({ maxEmployeesPerOrder: 4, tolPerDayMin: 15 });
    expect(updatedAuto.status).toBe(200);
    expect(updatedAuto.body.maxEmployeesPerOrder).toBe(4);
    expect(updatedAuto.body.tolPerDayMin).toBe(15);
  });
});