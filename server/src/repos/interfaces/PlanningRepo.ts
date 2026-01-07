import type { PlanEvent } from '../types';

export interface PlanEventInput {
  id?: string;
  kind: 'production' | 'montage' | string;
  orderId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  totalMinutes: number;
  travelMinutes?: number;
  employeeIds?: string[];
  source?: string;
}

export interface PlanningRepo {
  createEvent(event: PlanEventInput): Promise<string>;
  updateEvent(event: PlanEventInput): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  listEvents(kind?: string, dateRange?: { from: string; to: string }): Promise<Array<PlanEvent>>;
  getRemainingCapacity(kind: string, date: string, employeeIds?: string[]): Promise<number>;
}
