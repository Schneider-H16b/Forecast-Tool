import type { Order, OrderLine } from '../../types';
import type { OrdersRepo, OrderFilter } from '../interfaces/OrdersRepo';
import type { SqliteAdapter } from '../../db/sqliteAdapter';

export class OrdersRepoSqlite implements OrdersRepo {
  constructor(private adapter: SqliteAdapter) {}

  async upsertOrders(orders: Array<Order>): Promise<void> {
    for (const order of orders) {
      this.adapter.run(
        `INSERT INTO orders (id, ext_id, customer, status, forecast_date, sum_total, delivered_ratio, created_at, updated_at, import_id, distance_km, forecast_miss, miss_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           ext_id = excluded.ext_id,
           customer = excluded.customer,
           status = excluded.status,
           forecast_date = excluded.forecast_date,
           sum_total = excluded.sum_total,
           delivered_ratio = excluded.delivered_ratio,
           updated_at = excluded.updated_at,
           import_id = excluded.import_id`,
        [
          order.id,
          order.ext_id || null,
          order.customer || null,
          order.status,
          order.forecast_date || null,
          order.sum_total || null,
          order.delivered_ratio || null,
          order.created_at || new Date().toISOString(),
          order.updated_at || new Date().toISOString(),
          order.import_id || null,
          order.distance_km || 0,
          order.forecast_miss || 0,
          order.miss_days || 0,
        ]
      );
    }
    await this.adapter.saveToFile();
  }

  async upsertOrderLines(lines: Array<OrderLine>): Promise<void> {
    for (const line of lines) {
      this.adapter.run(
        `INSERT INTO order_lines (id, order_id, sku, qty, unit_price, delivered_qty, delivery_date, raw_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           sku = excluded.sku,
           qty = excluded.qty,
           unit_price = excluded.unit_price,
           delivered_qty = excluded.delivered_qty,
           delivery_date = excluded.delivery_date,
           raw_json = excluded.raw_json`,
        [
          line.id,
          line.order_id,
          line.sku || null,
          line.qty,
          line.unit_price || null,
          line.delivered_qty || null,
          line.delivery_date || null,
          line.raw_json || null,
        ]
      );
    }
    await this.adapter.saveToFile();
  }

  async listOrders(filter?: OrderFilter): Promise<Array<Order>> {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.from) {
      sql += ' AND forecast_date >= ?';
      params.push(filter.from);
    }
    if (filter?.to) {
      sql += ' AND forecast_date <= ?';
      params.push(filter.to);
    }
    if (filter?.search) {
      sql += ' AND (customer LIKE ? OR ext_id LIKE ?)';
      const search = `%${filter.search}%`;
      params.push(search, search);
    }

    const rows = this.adapter.query(sql, params);
    return rows.map(this.rowToOrder);
  }

  async getOrderWithLines(orderId: string): Promise<(Order & { lines: OrderLine[] }) | null> {
    const orderRows = this.adapter.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) return null;

    const order = this.rowToOrder(orderRows[0]);
    const lineRows = this.adapter.query('SELECT * FROM order_lines WHERE order_id = ?', [orderId]);
    const lines = lineRows.map(this.rowToOrderLine);

    return { ...order, lines };
  }

  async updateOrderMeta(orderId: string, meta: { distanceKm?: number; forecast_miss?: number; miss_days?: number }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (meta.distanceKm !== undefined) {
      updates.push('distance_km = ?');
      params.push(meta.distanceKm);
    }
    if (meta.forecast_miss !== undefined) {
      updates.push('forecast_miss = ?');
      params.push(meta.forecast_miss);
    }
    if (meta.miss_days !== undefined) {
      updates.push('miss_days = ?');
      params.push(meta.miss_days);
    }

    if (updates.length > 0) {
      params.push(orderId);
      this.adapter.run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
      await this.adapter.saveToFile();
    }
  }

  private rowToOrder(row: any): Order {
    return {
      id: row.id,
      ext_id: row.ext_id,
      customer: row.customer,
      status: row.status,
      forecast_date: row.forecast_date,
      sum_total: row.sum_total,
      delivered_ratio: row.delivered_ratio,
      created_at: row.created_at,
      updated_at: row.updated_at,
      import_id: row.import_id,
      distance_km: row.distance_km,
      forecast_miss: row.forecast_miss,
      miss_days: row.miss_days,
    };
  }

  private rowToOrderLine(row: any): OrderLine {
    return {
      id: row.id,
      order_id: row.order_id,
      sku: row.sku,
      qty: row.qty,
      unit_price: row.unit_price,
      delivered_qty: row.delivered_qty,
      delivery_date: row.delivery_date,
      raw_json: row.raw_json,
    };
  }
}
