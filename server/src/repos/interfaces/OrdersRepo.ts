import type { Order, OrderLine } from '../../types';

export type OrderFilter = { status?: string; from?: string; to?: string; search?: string; sort?: string };

export interface OrdersRepo {
  upsertOrders(orders: Array<Order>): Promise<void>;
  upsertOrderLines(lines: Array<OrderLine>): Promise<void>;
  listOrders(filter?: OrderFilter): Promise<Array<Order>>;
  getOrderWithLines(orderId: string): Promise<(Order & { lines: OrderLine[] }) | null>;
  updateOrderMeta(orderId: string, meta: { distanceKm?: number; forecast_miss?: number; miss_days?: number }): Promise<void>;
}
