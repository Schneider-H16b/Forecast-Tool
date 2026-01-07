import type { PlanEvent } from '../../types';
import type { PlanningRepo, PlanEventInput } from '../interfaces/PlanningRepo';
import { v4 as uuidv4 } from 'uuid';

export class PlanningRepoMemory implements PlanningRepo {
  private events: Map<string, PlanEvent> = new Map();
  private eventEmployees: Map<string, Set<string>> = new Map();

  async createEvent(input: PlanEventInput): Promise<string> {
    const id = input.id || `event-${uuidv4()}`;
    const now = new Date().toISOString();

    const event: PlanEvent = {
      id,
      kind: input.kind,
      order_id: input.orderId,
      start_date: input.startDate,
      end_date: input.endDate,
      total_minutes: input.totalMinutes,
      travel_minutes: input.travelMinutes || 0,
      created_at: now,
      updated_at: now,
      source: input.source || 'manual',
      employeeIds: input.employeeIds || [],
    };

    this.events.set(id, event);

    if (input.employeeIds) {
      this.eventEmployees.set(id, new Set(input.employeeIds));
    }

    return id;
  }

  async updateEvent(input: PlanEventInput): Promise<void> {
    if (!input.id) throw new Error('Event ID required for update');

    const existing = this.events.get(input.id);
    if (!existing) throw new Error(`Event ${input.id} not found`);

    const updated: PlanEvent = {
      ...existing,
      kind: input.kind,
      order_id: input.orderId,
      start_date: input.startDate,
      end_date: input.endDate,
      total_minutes: input.totalMinutes,
      travel_minutes: input.travelMinutes || 0,
      updated_at: new Date().toISOString(),
      source: input.source || existing.source,
      employeeIds: input.employeeIds || existing.employeeIds,
    };

    this.events.set(input.id, updated);

    if (input.employeeIds) {
      this.eventEmployees.set(input.id, new Set(input.employeeIds));
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    this.events.delete(eventId);
    this.eventEmployees.delete(eventId);
  }

  async listEvents(kind?: string, dateRange?: { from: string; to: string }): Promise<Array<PlanEvent>> {
    let result = Array.from(this.events.values());

    if (kind) {
      result = result.filter(e => e.kind === kind);
    }

    if (dateRange) {
      result = result.filter(
        e => e.start_date >= dateRange.from && e.start_date <= dateRange.to
      );
    }

    return result.map(e => ({
      ...e,
      employeeIds: Array.from(this.eventEmployees.get(e.id) || []),
    }));
  }

  async getRemainingCapacity(): Promise<number> {
    // Mock implementation: return a fixed capacity
    // In real implementation, this would calculate based on employee availability and existing events
    return 480; // 8 hours in minutes
  }
}
