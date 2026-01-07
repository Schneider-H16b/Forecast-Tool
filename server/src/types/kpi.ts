export interface KPI {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
}

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

export interface KPISummary {
  kpis: KPI[];
  metrics: DashboardMetrics;
}
