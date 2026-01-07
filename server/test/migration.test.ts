import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { initDB, getSettingsRepo } from '../src/db/db';

describe('Migration', () => {
  const testDbPath = path.join(__dirname, 'test-migration.db');
  const testDumpPath = path.join(__dirname, 'test-dump.json');
  const schemaPath = path.join(__dirname, '..', '..', 'docs', 'schema.sql');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(testDumpPath)) fs.unlinkSync(testDumpPath);
  });

  it('should migrate localStorage dump to SQLite', async () => {
    const legacyData = {
      'forecast.threshold': 42,
      'forecast.autoplan': true,
      'forecast.user': 'testuser'
    };
    fs.writeFileSync(testDumpPath, JSON.stringify(legacyData));

    await initDB({ dbPath: testDbPath, schemaPath });
    const repo = getSettingsRepo();

    for (const [key, value] of Object.entries(legacyData)) {
      await repo.setAppSetting(key, value);
    }

    const threshold = await repo.getAppSetting('forecast.threshold');
    const autoplan = await repo.getAppSetting('forecast.autoplan');
    const user = await repo.getAppSetting('forecast.user');

    expect(threshold).toBe(42);
    expect(autoplan).toBe(true);
    expect(user).toBe('testuser');
  });

  it('should be idempotent - repeated migration has no effect', async () => {
    const legacyData = { 'forecast.key': 'value1' };
    fs.writeFileSync(testDumpPath, JSON.stringify(legacyData));

    await initDB({ dbPath: testDbPath, schemaPath });
    const repo = getSettingsRepo();

    await repo.setAppSetting('forecast.key', 'value1');
    const firstResult = await repo.getAppSetting('forecast.key');

    await repo.setAppSetting('forecast.key', 'value1');
    const secondResult = await repo.getAppSetting('forecast.key');

    expect(firstResult).toBe('value1');
    expect(secondResult).toBe('value1');
  });

  it('should handle empty dump gracefully', async () => {
    fs.writeFileSync(testDumpPath, JSON.stringify({}));

    await initDB({ dbPath: testDbPath, schemaPath });
    const repo = getSettingsRepo();

    const result = await repo.getAppSetting('nonexistent.key');
    expect(result).toBeNull();
  });
});
