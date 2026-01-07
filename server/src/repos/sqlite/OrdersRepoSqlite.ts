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
    const params: Array<string> = [];

    const statuses = filter?.statuses || (filter?.status ? [filter.status] : undefined);
    if (statuses && statuses.length) {
      const placeholders = statuses.map(() => '?').join(',');
      sql += ` AND status IN (${placeholders})`;
      params.push(...statuses);
    }
    if (filter?.from) {
      sql += ' AND forecast_date >= ?';
      params.push(filter.from);
    }
    if (filter?.to) {
      sql += ' AND forecast_date <= ?';
      params.push(filter.to);
    }
    if (filter?.onlyDelayed) {
      sql += ' AND forecast_miss = 1';
    }
    if (filter?.onlyUnplanned) {
      sql += ' AND NOT EXISTS (SELECT 1 FROM plan_events pe WHERE pe.order_id = orders.id)';
    }
    if (filter?.search) {
      sql += ' AND (customer LIKE ? OR ext_id LIKE ? OR id LIKE ?)';
      const search = `%${filter.search}%`;
      params.push(search, search, search);
    }

    if (filter?.sort) {
      const [key, dirRaw] = filter.sort.split(':');
      const dir = (dirRaw || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      const col = key === 'id' ? 'id'
        : key === 'customer' ? 'customer'
        : key === 'forecast' ? 'forecast_date'
        : key === 'sum' ? 'sum_total'
        : key === 'status' ? 'status'
        : 'forecast_date';
      sql += ` ORDER BY ${col} ${dir}`;
    } else {
      sql += ' ORDER BY forecast_date ASC';
    }

    const rows = this.adapter.query(sql, params) as Array<Record<string, unknown>>;
    return rows.map((r) => this.rowToOrder(r));
  }

  async getOrderWithLines(orderId: string): Promise<(Order & { lines: OrderLine[] }) | null> {
    const orderRows = this.adapter.query('SELECT * FROM orders WHERE id = ?', [orderId]) as Array<Record<string, unknown>>;
    if (orderRows.length === 0) return null;

    const order = this.rowToOrder(orderRows[0]);
    const lineRows = this.adapter.query('SELECT * FROM order_lines WHERE order_id = ?', [orderId]) as Array<Record<string, unknown>>;
    const lines = lineRows.map((r) => this.rowToOrderLine(r));

    return { ...order, lines };
  }

  async getOrderByExtId(extId: string): Promise<Order | null> {
    const rows = this.adapter.query('SELECT * FROM orders WHERE ext_id = ?', [extId]) as Array<Record<string, unknown>>;
    return rows.length > 0 ? this.rowToOrder(rows[0]) : null;
  }

  async createOrder(order: Order): Promise<void> {
    this.adapter.run(
      `INSERT INTO orders (id, ext_id, customer, status, forecast_date, sum_total, delivered_ratio, created_at, updated_at, import_id, distance_km, forecast_miss, miss_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    await this.adapter.saveToFile();
  }

  async createOrderLine(line: OrderLine): Promise<void> {
    this.adapter.run(
      `INSERT INTO order_lines (id, order_id, sku, qty, unit_price, delivered_qty, delivery_date, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
    await this.adapter.saveToFile();
  }

  async updateOrderMeta(orderId: string, meta: { distanceKm?: number; forecast_miss?: number; miss_days?: number }): Promise<void> {
    const updates: string[] = [];
    const params: Array<number|string> = [];

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

  private rowToOrder(row: Record<string, unknown>): Order {
    return {
      id: row.id as string,
      ext_id: (row.ext_id as string) || undefined,
      customer: (row.customer as string) || undefined,
      status: row.status as string,
      forecast_date: (row.forecast_date as string) || undefined,
      sum_total: (row.sum_total as number) || undefined,
      delivered_ratio: (row.delivered_ratio as number) || undefined,
      created_at: (row.created_at as string) || undefined,
      updated_at: (row.updated_at as string) || undefined,
      import_id: (row.import_id as string) || undefined,
      distance_km: (row.distance_km as number) || undefined,
      forecast_miss: (row.forecast_miss as number) || undefined,
      miss_days: (row.miss_days as number) || undefined,
    };
  }

  private rowToOrderLine(row: Record<string, unknown>): OrderLine {
    return {
      id: row.id as string,
      order_id: row.order_id as string,
      sku: (row.sku as string) || undefined,
      qty: row.qty as number,
      unit_price: (row.unit_price as number) || undefined,
      delivered_qty: (row.delivered_qty as number) || undefined,
      delivery_date: (row.delivery_date as string) || undefined,
      raw_json: (row.raw_json as string) || undefined,
    };
  }
}
