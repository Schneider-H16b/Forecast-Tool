import fs from 'fs';
import path from 'path';
import { SqliteAdapter } from './sqliteAdapter';
import { SettingsRepoSqlite } from '../repos/sqlite/SettingsRepoSqlite';
import { OrdersRepoSqlite } from '../repos/sqlite/OrdersRepoSqlite';
import { ImportRepoSqlite } from '../repos/sqlite/ImportRepoSqlite';
import { PlanningRepoSqlite } from '../repos/sqlite/PlanningRepoSqlite';

let adapter: SqliteAdapter | null = null;
let settingsRepo: SettingsRepoSqlite | null = null;
let ordersRepo: OrdersRepoSqlite | null = null;
let importRepo: ImportRepoSqlite | null = null;
let planningRepo: PlanningRepoSqlite | null = null;

export async function initDB(options?: { dbPath?: string; schemaPath?: string }) {
  const cwd = process.cwd();
  const dbPath = options?.dbPath || path.join(cwd, cwd.endsWith(path.sep + 'server') ? 'dev.db' : path.join('server', 'dev.db'));
  const schemaPath = options?.schemaPath || path.join(cwd, cwd.endsWith(path.sep + 'server') ? path.join('..', 'docs', 'schema.sql') : path.join('docs', 'schema.sql'));
  const schema = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : undefined;

  adapter = new SqliteAdapter(dbPath);
  await adapter.init(schema);
  settingsRepo = new SettingsRepoSqlite(adapter);
  ordersRepo = new OrdersRepoSqlite(adapter);
  importRepo = new ImportRepoSqlite(adapter);
  planningRepo = new PlanningRepoSqlite(adapter);
}

export function getAdapter() {
  if (!adapter) throw new Error('DB not initialized');
  return adapter;
}

export function getSettingsRepo() {
  if (!settingsRepo) throw new Error('DB not initialized');
  return settingsRepo;
}

export function getOrdersRepo() {
  if (!ordersRepo) throw new Error('DB not initialized');
  return ordersRepo;
}

export function getImportRepo() {
  if (!importRepo) throw new Error('DB not initialized');
  return importRepo;
}

export function getPlanningRepo() {
  if (!planningRepo) throw new Error('DB not initialized');
  return planningRepo;
}

export function getDB() {
  return {
    getAdapter,
    getSettingsRepo,
    getOrdersRepo,
    getImportRepo,
    getPlanningRepo,
  };
}
