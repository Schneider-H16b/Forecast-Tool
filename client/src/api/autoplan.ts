import { API_BASE } from './client';

export interface AutoPlanResult {
  run?: {
    id: string;
    created_at: string;
    params_json?: string;
    summary_json?: string;
  };
  createdEvents?: number;
  skippedOrders?: number;
  issues?: Array<{
    id: string;
    type: string;
    order_id?: string;
    date_iso?: string;
    deficit_min?: number;
    details_json?: string;
  }>;
  [key: string]: unknown;
}

export async function runAutoPlan(params: { startDate: string; endDate: string; includeProduction?: boolean; includeMontage?: boolean; overwriteExisting?: boolean }) {
  const res = await fetch(`${API_BASE}/api/autoplan/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json() as AutoPlanResult;
}
