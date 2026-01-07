import { API_BASE } from './client';

export interface DashboardMetrics {
  timestamp: string;
  dateRange: { from: string; to: string };
  orders: {
    total: number;
    open: number;
    delivered: number;
    averageDeliveryDaysLate: number;
  };
  planning: {
    totalEvents: number;
    productionEvents: number;
    montageEvents: number;
    plannedOrders: number;
    unplannedOrders: number;
    averageEmployeeUtilization: number;
  };
  performance: {
    forecastAccuracy: number;
    capacityUtilization: number;
    onTimeDeliveryRate: number;
    averageEventDuration: number;
  };
}

export interface KPI { label: string; value: number | string; unit?: string; trend?: 'up'|'down'|'neutral'; trendPercent?: number }

export async function fetchDashboardMetrics(from: string, to: string): Promise<{ kpis: KPI[]; metrics: DashboardMetrics }> {
  const url = `${API_BASE}/api/dashboard/metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
