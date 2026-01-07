import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { Order, OrderLine, ImportMeta } from '../types';

export interface CsvRow {
  [key: string]: string;
}

export interface ImportOptions {
  source?: string;
  skipDuplicates?: boolean;
}

export interface EffortCalculation {
  orderId: string;
  sku: string;
  qty: number;
  prodMinPerUnit: number;
  montMinPerUnit: number;
  totalProdMin: number;
  totalMontMin: number;
}

export class ImportService {
  /**
   * Parse CSV rows into orders and lines
   * Expected CSV columns: order_id, customer, status, forecast_date, sku, qty, unit_price
   */
  parseOrdersCsv(rows: CsvRow[]): { orders: Order[]; lines: OrderLine[] } {
    const ordersMap = new Map<string, Order>();
    const lines: OrderLine[] = [];

    for (const row of rows) {
      const orderId = row.order_id || `order-${uuidv4()}`;
      
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: orderId,
          ext_id: row.order_id,
          customer: row.customer,
          status: row.status || 'open',
          forecast_date: row.forecast_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (row.sku && row.qty) {
        lines.push({
          id: `line-${uuidv4()}`,
          order_id: orderId,
          sku: row.sku,
          qty: parseFloat(row.qty) || 0,
          unit_price: row.unit_price ? parseFloat(row.unit_price) : undefined,
          raw_json: JSON.stringify(row),
        });
      }
    }

    return {
      orders: Array.from(ordersMap.values()),
      lines,
    };
  }

  /**
   * Create import metadata with hashes for deduplication
   */
  createImportMeta(rows: CsvRow[], options?: ImportOptions): ImportMeta {
    const headerHash = this.hashHeaders(Object.keys(rows[0] || {}));
    const linesHash = this.hashLines(rows);

    return {
      id: `import-${uuidv4()}`,
      source: options?.source || 'csv',
      created_at: new Date().toISOString(),
      header_hash: headerHash,
      lines_hash: linesHash,
      raw_meta_json: JSON.stringify({ rowCount: rows.length, options }),
    };
  }

  /**
   * Calculate effort for order lines based on item configuration
   */
  calculateEffort(
    lines: OrderLine[],
    itemsConfig: Map<string, { prodMinPerUnit: number; montMinPerUnit: number }>
  ): EffortCalculation[] {
    const results: EffortCalculation[] = [];

    for (const line of lines) {
      const config = itemsConfig.get(line.sku || '');
      if (!config) continue;

      results.push({
        orderId: line.order_id,
        sku: line.sku || '',
        qty: line.qty,
        prodMinPerUnit: config.prodMinPerUnit,
        montMinPerUnit: config.montMinPerUnit,
        totalProdMin: line.qty * config.prodMinPerUnit,
        totalMontMin: line.qty * config.montMinPerUnit,
      });
    }

    return results;
  }

  private hashHeaders(headers: string[]): string {
    return crypto.createHash('sha256').update(headers.sort().join(',')).digest('hex');
  }

  private hashLines(rows: CsvRow[]): string {
    const content = rows.map(r => JSON.stringify(r)).join('\n');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
