import type { Order, OrderLine } from '../../types';
import type { OrdersRepo, OrderFilter } from '../interfaces/OrdersRepo';

export class OrdersRepoMemory implements OrdersRepo {
  private orders: Map<string, Order> = new Map();
  private orderLines: Map<string, OrderLine> = new Map();

  async upsertOrders(orders: Array<Order>): Promise<void> {
    for (const order of orders) {
      this.orders.set(order.id, order);
    }
  }

  async upsertOrderLines(lines: Array<OrderLine>): Promise<void> {
    for (const line of lines) {
      this.orderLines.set(line.id, line);
    }
  }

  async listOrders(filter?: OrderFilter): Promise<Array<Order & { linesCount?: number }>> {
    let result = Array.from(this.orders.values());

    const statuses = filter?.statuses || (filter?.status ? [filter.status] : undefined);
    if (statuses && statuses.length) {
      result = result.filter(o => statuses.includes(o.status));
    }
    if (filter?.from) {
      result = result.filter(o => !o.forecast_date || o.forecast_date >= filter.from!);
    }
    if (filter?.to) {
      result = result.filter(o => !o.forecast_date || o.forecast_date <= filter.to!);
    }
    if (filter?.onlyDelayed) {
      result = result.filter(o => o.forecast_miss === 1);
    }
    if (filter?.onlyUnplanned) {
      // In memory repo has no events, so just treat as all unplanned.
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase();
      result = result.filter(o =>
        o.customer?.toLowerCase().includes(s) || o.ext_id?.toLowerCase().includes(s) || o.id.toLowerCase().includes(s)
      );
    }

    // compute lines count
    const linesByOrder = new Map<string, number>();
    for (const line of this.orderLines.values()) {
      const c = linesByOrder.get(line.order_id) ?? 0;
      linesByOrder.set(line.order_id, c + 1);
    }

    let mapped = result.map(o => ({ ...o, linesCount: linesByOrder.get(o.id) ?? 0 }));
    if (filter?.onlyWithPositions) {
      mapped = mapped.filter(o => (o.linesCount ?? 0) > 0);
    }

    return mapped;
  }

  async getOrderWithLines(orderId: string): Promise<(Order & { lines: OrderLine[] }) | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const lines = Array.from(this.orderLines.values()).filter(l => l.order_id === orderId);
    return { ...order, lines };
  }

  async updateOrderMeta(orderId: string, meta: { distanceKm?: number; forecast_miss?: number; miss_days?: number }): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    this.orders.set(orderId, {
      ...order,
      distance_km: meta.distanceKm ?? order.distance_km,
      forecast_miss: meta.forecast_miss ?? order.forecast_miss,
      miss_days: meta.miss_days ?? order.miss_days,
    });
  }
}
