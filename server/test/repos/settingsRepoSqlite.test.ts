import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SqliteAdapter } from '../../src/db/sqliteAdapter';
import { SettingsRepoSqlite } from '../../src/repos/sqlite/SettingsRepoSqlite';

const DB_PATH = path.join(__dirname, 'temp_test.db');

beforeEach(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

afterEach(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

describe('SettingsRepoSqlite', () => {
  it('persists settings and items across adapter reloads', async () => {
    const schema = fs.readFileSync(path.join(__dirname, '../../..', 'docs', 'schema.sql'), 'utf8');
    const adapter = new SqliteAdapter(DB_PATH);
    await adapter.init(schema);
    const repo = new SettingsRepoSqlite(adapter);

    await repo.setAppSetting('travelKmh', 55);
    await repo.upsertItem({ sku: 'S1', name: 'Item S1', prodMinPerUnit: 10 });

    // reload adapter (simulate app restart)
    adapter.close();
    const adapter2 = new SqliteAdapter(DB_PATH);
    await adapter2.init();
    const repo2 = new SettingsRepoSqlite(adapter2);

    const travel = await repo2.getAppSetting('travelKmh');
    expect(travel).toBe(55);
    const items = await repo2.listItems();
    expect(items.find((i: any) => i.sku === 'S1')).toBeTruthy();

    adapter2.close();
  });

  it('returns structured defaults and applies patches', async () => {
    const schema = fs.readFileSync(path.join(__dirname, '../../..', 'docs', 'schema.sql'), 'utf8');
    const adapter = new SqliteAdapter(DB_PATH);
    await adapter.init(schema);
    const repo = new SettingsRepoSqlite(adapter);

    const global = await repo.getGlobalSettings();
    expect(global.dayMinutes).toBeGreaterThan(0);
    const patched = await repo.setGlobalSettings({ dayMinutes: 510, travelKmh: 70, travelRoundTrip: false });
    expect(patched.dayMinutes).toBe(510);
    expect(patched.travelKmh).toBe(70);
    expect(patched.travelRoundTrip).toBe(false);

    const auto = await repo.getAutoPlanSettings();
    expect(auto.maxEmployeesPerOrder).toBeGreaterThan(0);
    const autoPatched = await repo.setAutoPlanSettings({ maxEmployeesPerOrder: 4, tolPerDayMin: 10 });
    expect(autoPatched.maxEmployeesPerOrder).toBe(4);
    expect(autoPatched.tolPerDayMin).toBe(10);

    adapter.close();
  });
});