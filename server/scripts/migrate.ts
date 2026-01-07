#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import { initDB, getSettingsRepo } from '../src/db/db';

async function loadLocalStorageDump(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`dump file not found: ${filePath}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

async function reconcileSettings(legacy: Record<string, any>, repo: any) {
  const summary: { key: string; legacyValue: any; dbValue: any; action: 'noop' | 'insert' | 'update' }[] = [];
  for (const [key, legacyValue] of Object.entries(legacy)) {
    const dbValue = await repo.getAppSetting(key);
    if (typeof dbValue === 'undefined' || dbValue === null) {
      summary.push({ key, legacyValue, dbValue, action: 'insert' });
    } else if (JSON.stringify(dbValue) !== JSON.stringify(legacyValue)) {
      summary.push({ key, legacyValue, dbValue, action: 'update' });
    } else {
      summary.push({ key, legacyValue, dbValue, action: 'noop' });
    }
  }
  return summary;
}

async function applyMigration(summary: any[], repo: any, dryRun: boolean) {
  const report: { key: string; action: string }[] = [];
  for (const s of summary) {
    if (s.action === 'insert') {
      if (!dryRun) await repo.setAppSetting(s.key, s.legacyValue);
      report.push({ key: s.key, action: dryRun ? 'would-insert' : 'inserted' });
    } else if (s.action === 'update') {
      if (!dryRun) await repo.setAppSetting(s.key, s.legacyValue);
      report.push({ key: s.key, action: dryRun ? 'would-update' : 'updated' });
    } else {
      report.push({ key: s.key, action: 'noop' });
    }
  }
  return report;
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('dump', { type: 'string', describe: 'Path to localStorage JSON dump', demandOption: true })
    .option('db', { type: 'string', describe: 'Path to sqlite DB file', default: path.join(process.cwd(), 'server', 'dev.db') })
    .option('dry-run', { type: 'boolean', describe: 'Run migration in dry-run mode', default: true })
    .option('backup', { type: 'boolean', describe: 'Backup DB before applying', default: true })
    .parseSync();

  const dump = await loadLocalStorageDump(argv.dump);

  await initDB({ dbPath: argv.db });
  const repo = getSettingsRepo();

  const summary = await reconcileSettings(dump, repo);
  console.log('Migration summary:');
  console.table(summary.map(s => ({ key: s.key, action: s.action })));

  if (argv['dry-run']) {
    console.log('\nDry-run mode: no changes applied. To apply run with --no-dry-run');
    const report = await applyMigration(summary, repo, true);
    console.table(report);
    process.exit(0);
  }

  if (argv.backup) {
    const backupPath = argv.db + '.bak-' + Date.now();
    fs.copyFileSync(argv.db, backupPath);
    console.log('Backup created at', backupPath);
  }

  const report = await applyMigration(summary, repo, false);
  console.table(report);
  console.log('Migration applied successfully');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
