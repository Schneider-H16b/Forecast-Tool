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
});