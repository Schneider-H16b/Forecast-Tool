import type { KpiMonthRange } from '../types';

export interface KpiRepo {
  monthlyCapacity(role: string, monthRange: KpiMonthRange): Promise<Record<string, unknown>>;
  monthlyDemand(status: string, monthRange: KpiMonthRange): Promise<Record<string, unknown>>;
  quarterlyRollup(params?: Record<string, unknown>): Promise<Record<string, unknown>>;
}
