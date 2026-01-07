export interface Order {
  id: string;
  extId?: string;
  customer?: string;
  status: string;
  forecastDate?: string;
  sumTotal?: number;
  distanceKm?: number;
  forecastMiss?: number;
  missDays?: number;
}

export interface OrderLine {
  id: string;
  orderId: string;
  sku?: string;
  qty: number;
  unitPrice?: number;
}

export interface PlanEvent {
  id: string;
  kind: string;
  orderId: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  travelMinutes?: number;
}

export interface ImportMeta {
  source?: string;
  headerHash?: string;
  linesHash?: string;
  rawMetaJson?: Record<string, unknown>;
}

export interface KpiMonthRange {
  from: string;
  to: string;
}
