import fs from 'fs';
import path from 'path';
import { SqliteAdapter } from './sqliteAdapter';
import { SettingsRepoSqlite } from '../repos/sqlite/SettingsRepoSqlite';

let adapter: SqliteAdapter | null = null;
let settingsRepo: SettingsRepoSqlite | null = null;

export async function initDB(options?: { dbPath?: string; schemaPath?: string }) {
  const dbPath = options?.dbPath || path.join(process.cwd(), 'server', 'dev.db');
  const schemaPath = options?.schemaPath || path.join(process.cwd(), 'docs', 'schema.sql');
  const schema = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : undefined;

  adapter = new SqliteAdapter(dbPath);
  await adapter.init(schema);
  settingsRepo = new SettingsRepoSqlite(adapter);
}

export function getAdapter() {
  if (!adapter) throw new Error('DB not initialized');
  return adapter;
}

export function getSettingsRepo() {
  if (!settingsRepo) throw new Error('DB not initialized');
  return settingsRepo;
}
