import type { OrdersRepo } from '../repos/interfaces/OrdersRepo';
import type { SettingsRepo } from '../repos/interfaces/SettingsRepo';
import type { PlanningRepo } from '../repos/interfaces/PlanningRepo';
import type { DashboardMetrics, KPI, KPISummary } from '../types/kpi';

export class KPIService {
  constructor(
    private ordersRepo: OrdersRepo,
    private settingsRepo: SettingsRepo,
    private planningRepo: PlanningRepo
  ) {}

  async calculateDashboardMetrics(
    dateRange: { from: string; to: string }
  ): Promise<KPISummary> {
    const timestamp = new Date().toISOString();

    // Fetch all data
    const [orders, employees, plannedEvents] = await Promise.all([
      this.ordersRepo.listOrders(),
      this.settingsRepo.listEmployees(),
      this.planningRepo.listEvents(undefined, dateRange),
    ]);

    // Filter data by date range
    const ordersInRange = orders.filter(
      o => !o.delivery_date || (o.delivery_date >= dateRange.from && o.delivery_date <= dateRange.to)
    );

    // Calculate metrics
    const metrics = this.computeMetrics(ordersInRange, employees, plannedEvents, dateRange);
    const kpis = this.generateKPIs(metrics);

    return { kpis, metrics };
  }

  private computeMetrics(
    orders: any[],
    employees: any[],
    events: any[],
    dateRange: { from: string; to: string }
  ): DashboardMetrics {
    const timestamp = new Date().toISOString();

    // Order metrics
    const totalOrders = orders.length;
    const openOrders = orders.filter(o => o.status === 'open').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    // Calculate average miss_days for all orders, not just late ones
    const totalMissDays = orders.reduce((sum, o) => sum + Math.max(0, o.miss_days || 0), 0);
    const averageDeliveryDaysLate = totalOrders > 0 ? totalMissDays / totalOrders : 0;

    // Planning metrics
    const productionEvents = events.filter(e => e.kind === 'production').length;
    const montageEvents = events.filter(e => e.kind === 'montage').length;
    const totalEvents = productionEvents + montageEvents;

    // Orders with assigned events
    const plannedOrderIds = new Set(events.map(e => e.order_id));
    const plannedOrdersCount = plannedOrderIds.size;
    const unplannedOrdersCount = totalOrders - plannedOrdersCount;

    // Employee utilization (simple: events assigned / total possible)
    const activeEmployees = employees.filter(e => !e.isArchived).length;
    const averageEmployeeUtilization =
      activeEmployees > 0 ? (totalEvents / (activeEmployees * 10)) * 100 : 0; // Assume 10 events per employee per month max

    // Performance metrics
    const forecastAccuracy = this.calculateForecastAccuracy(orders);
    const capacityUtilization = this.calculateCapacityUtilization(events, activeEmployees);
    const onTimeDeliveryRate = this.calculateOnTimeDeliveryRate(orders);
    const averageEventDuration = this.calculateAverageEventDuration(events);

    return {
      timestamp,
      dateRange,
      orders: {
        total: totalOrders,
        open: openOrders,
        delivered: deliveredOrders,
        averageDeliveryDaysLate: Math.round(averageDeliveryDaysLate * 10) / 10,
      },
      planning: {
        totalEvents,
        productionEvents,
        montageEvents,
        plannedOrders: plannedOrdersCount,
        unplannedOrders: unplannedOrdersCount,
        averageEmployeeUtilization: Math.round(averageEmployeeUtilization),
      },
      performance: {
        forecastAccuracy: Math.round(forecastAccuracy),
        capacityUtilization: Math.round(capacityUtilization),
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate),
        averageEventDuration: Math.round(averageEventDuration),
      },
    };
  }

  private calculateForecastAccuracy(orders: any[]): number {
    // Accuracy: delivered on time / total delivered
    if (orders.length === 0) return 100;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    if (delivered === 0) return 100;
    const onTime = orders.filter(o => o.status === 'delivered' && (o.miss_days || 0) <= 0).length;
    return (onTime / delivered) * 100;
  }

  private calculateCapacityUtilization(events: any[], activeEmployees: number): number {
    if (activeEmployees === 0) return 0;
    // Assume 480 minutes per day per employee
    const totalCapacityMinutes = activeEmployees * 480 * 30; // 30 days
    const totalScheduledMinutes = events.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
    return (totalScheduledMinutes / totalCapacityMinutes) * 100;
  }

  private calculateOnTimeDeliveryRate(orders: any[]): number {
    if (orders.length === 0) return 100;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    if (delivered === 0) return 100;
    const onTime = orders.filter(o => o.status === 'delivered' && (o.miss_days || 0) <= 0).length;
    return (onTime / delivered) * 100;
  }

  private calculateAverageEventDuration(events: any[]): number {
    if (events.length === 0) return 0;
    const totalMinutes = events.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
    return totalMinutes / events.length;
  }

  private generateKPIs(metrics: DashboardMetrics): KPI[] {
    return [
      {
        label: 'Open Orders',
        value: metrics.orders.open,
        unit: 'orders',
        trend: metrics.orders.open > metrics.orders.total * 0.5 ? 'up' : 'down',
      },
      {
        label: 'On-Time Delivery',
        value: metrics.performance.onTimeDeliveryRate,
        unit: '%',
        trend: metrics.performance.onTimeDeliveryRate >= 95 ? 'up' : 'down',
      },
      {
        label: 'Planned Orders',
        value: metrics.planning.plannedOrders,
        unit: 'orders',
        trend: metrics.planning.plannedOrders > 0 ? 'up' : 'neutral',
      },
      {
        label: 'Employee Utilization',
        value: metrics.planning.averageEmployeeUtilization,
        unit: '%',
        trend: metrics.planning.averageEmployeeUtilization > 60 ? 'up' : 'down',
      },
      {
        label: 'Capacity Usage',
        value: metrics.performance.capacityUtilization,
        unit: '%',
        trend: metrics.performance.capacityUtilization > 70 ? 'up' : 'down',
      },
      {
        label: 'Forecast Accuracy',
        value: metrics.performance.forecastAccuracy,
        unit: '%',
        trend: metrics.performance.forecastAccuracy >= 90 ? 'up' : 'down',
      },
      {
        label: 'Avg Delivery Delay',
        value: metrics.orders.averageDeliveryDaysLate,
        unit: 'days',
        trend: metrics.orders.averageDeliveryDaysLate <= 1 ? 'up' : 'down',
      },
      {
        label: 'Planned Events',
        value: metrics.planning.totalEvents,
        unit: 'events',
        trend: metrics.planning.totalEvents > 0 ? 'up' : 'neutral',
      },
    ];
  }
}
