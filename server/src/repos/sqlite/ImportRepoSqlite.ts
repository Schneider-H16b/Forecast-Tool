import type { ImportMeta } from '../../types';
import type { ImportRepo } from '../interfaces/ImportRepo';
import type { SqliteAdapter } from '../../db/sqliteAdapter';

export class ImportRepoSqlite implements ImportRepo {
  constructor(private adapter: SqliteAdapter) {}

  async createImport(meta: ImportMeta): Promise<string> {
    this.adapter.run(
      `INSERT INTO imports (id, source, created_at, header_hash, lines_hash, raw_meta_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        meta.id,
        meta.source || null,
        meta.created_at,
        meta.header_hash || null,
        meta.lines_hash || null,
        meta.raw_meta_json || null,
      ]
    );
    await this.adapter.saveToFile();
    return meta.id;
  }

  async attachImportToOrders(importId: string, orderIds: string[]): Promise<void> {
    for (const orderId of orderIds) {
      this.adapter.run('UPDATE orders SET import_id = ? WHERE id = ?', [importId, orderId]);
    }
    await this.adapter.saveToFile();
  }
}
