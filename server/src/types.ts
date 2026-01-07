// Core domain types

export interface Order {
  id: string;
  ext_id?: string;
  customer?: string;
  status: string;
  forecast_date?: string;
  delivery_date?: string;
  sum_total?: number;
  delivered_ratio?: number;
  created_at?: string;
  updated_at?: string;
  import_id?: string;
  distance_km?: number;
  forecast_miss?: number;
  miss_days?: number;
  total_prod_min?: number;
  total_mont_min?: number;
}

export interface OrderLine {
  id: string;
  order_id: string;
  sku?: string;
  qty: number;
  unit_price?: number;
  delivered_qty?: number;
  delivery_date?: string;
  raw_json?: string;
}

export interface ImportMeta {
  id: string;
  source?: string;
  created_at: string;
  header_hash?: string;
  lines_hash?: string;
  raw_meta_json?: string;
}

export interface Item {
  sku: string;
  name?: string;
  prodMinPerUnit: number;
  montMinPerUnit: number;
  active: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role?: string;
  weeklyHours?: number;
  daysMask?: number;
  isArchived?: boolean;
  color?: string;
}

export interface Blocker {
  id: string;
  employeeId: string;
  dateIso: string;
  overnight: boolean;
  reason?: string;
}

export interface PlanEvent {
  id: string;
  kind: string;
  order_id: string;
  start_date: string;
  end_date: string;
  total_minutes: number;
  travel_minutes: number;
  created_at: string;
  updated_at: string;
  source: string;
  employeeIds?: string[];
}

export interface PlanEventEmployee {
  event_id: string;
  employee_id: string;
}

export interface AutoPlanRun {
  id: string;
  created_at: string;
  params_json: string;
  summary_json: string;
}

export interface AutoPlanIssue {
  id: string;
  run_id: string;
  type: string;
  order_id?: string;
  date_iso?: string;
  employee_id?: string;
  deficit_min?: number;
  details_json?: string;
}
