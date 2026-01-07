import fs from 'fs';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export class SqliteAdapter {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private dbPath?: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath;
  }

  async init(schemaSql?: string) {
    if (!this.SQL) {
      // Ensure the wasm file is resolved from the sql.js package path in Node
      const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
      this.SQL = await initSqlJs({ locateFile: () => wasmPath });
    }

    if (this.dbPath && fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
      if (schemaSql) this.db.run(schemaSql);
      if (this.dbPath) this.saveToFile();
    }
  }

  exec(sql: string) {
    if (!this.db) throw new Error('DB not initialized');
    return this.db.exec(sql);
  }

  run(sql: string, params?: Array<string | number | null | Uint8Array>) {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(sql);
    try {
      stmt.run(params);
    } finally {
      stmt.free();
    }
  }

  query(sql: string, params?: Array<string | number | null | Uint8Array>) {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(sql);
    const rows: Array<Record<string, unknown>> = [];
    try {
      if (params && params.length) stmt.bind(params);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  serialize(): Buffer {
    if (!this.db) throw new Error('DB not initialized');
    const data = this.db.export();
    return Buffer.from(data);
  }

  saveToFile(filePath?: string) {
    if (!this.dbPath && !filePath) throw new Error('No dbPath specified');
    const p = filePath || this.dbPath!;
    fs.writeFileSync(p, this.serialize());
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
