import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { initDB } from '../../src/db/db';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDB();
});

describe('BI routes', () => {
  it('returns default config when empty', async () => {
    const res = await request(app).get('/api/bi/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ widgets: [], layouts: null });
  });

  it('stores and retrieves dashboard config', async () => {
    const payload = { widgets: [{ id: 'w1', type: 'kpi' }], layouts: { lg: [{ i: 'w1', x:0, y:0, w:3, h:2 }] } };
    const put = await request(app).put('/api/bi/dashboard').send(payload);
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({ ok: true });

    const res = await request(app).get('/api/bi/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.widgets[0]).toMatchObject({ id: 'w1', type: 'kpi' });
    expect(res.body.layouts.lg[0]).toMatchObject({ i: 'w1', w: 3 });
  });
});
