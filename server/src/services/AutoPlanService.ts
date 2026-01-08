import { v4 as uuidv4 } from 'uuid';
import type { OrdersRepo } from '../repos/interfaces/OrdersRepo';
import type { SettingsRepo, AutoPlanSettings, GlobalSettings } from '../repos/interfaces/SettingsRepo';
import type { PlanningRepo } from '../repos/interfaces/PlanningRepo';
import type { Order, Employee, AutoPlanRun, AutoPlanIssue } from '../types';

export interface AutoPlanParams {
  startDate: string;
  endDate: string;
  includeProduction?: boolean;
  includeMontage?: boolean;
  overwriteExisting?: boolean;
}

export interface AutoPlanResult {
  run: AutoPlanRun;
  issues: AutoPlanIssue[];
  createdEvents: number;
  skippedOrders: number;
}

export class AutoPlanService {
  constructor(
    private ordersRepo: OrdersRepo,
    private settingsRepo: SettingsRepo,
    private planningRepo: PlanningRepo
  ) {}

  async executeAutoPlan(params: AutoPlanParams): Promise<AutoPlanResult> {
    const runId = `run-${uuidv4()}`;
    const createdAt = new Date().toISOString();
    const issues: AutoPlanIssue[] = [];
    let createdEvents = 0;
    let skippedOrders = 0;

    const globalSettings = await this.settingsRepo.getGlobalSettings();
    const autoSettings = await this.settingsRepo.getAutoPlanSettings();

    // Get all employees
    const employees = (await this.settingsRepo.listEmployees()).filter(e => (e as any).active !== false);
    if (employees.length === 0) {
      issues.push(this.createIssue(runId, 'no_employees', undefined, undefined));
      return this.buildResult(runId, createdAt, params, createdEvents, skippedOrders, issues);
    }

    // Get orders that need planning
    const orders = await this.ordersRepo.listOrders();
    const unplannedOrders = orders.filter(o => this.needsPlanning(o, params));

    // Sort orders by delivery date (earliest first)
    unplannedOrders.sort((a, b) => (a.delivery_date || '').localeCompare(b.delivery_date || ''));

    for (const order of unplannedOrders) {
      try {
        if (params.includeProduction !== false) {
          await this.planProductionEvent(order, employees, params, runId, issues, autoSettings);
          createdEvents++;
        }

        if (params.includeMontage !== false) {
          await this.planMontageEvent(order, employees, params, runId, issues, globalSettings, autoSettings);
          createdEvents++;
        }
      } catch (error) {
        skippedOrders++;
        issues.push(this.createIssue(runId, 'planning_error', order.id, undefined, error));
      }
    }

    return this.buildResult(runId, createdAt, params, createdEvents, skippedOrders, issues);
  }

  private needsPlanning(order: Order, params: AutoPlanParams): boolean {
    // Check if order delivery date is within planning range
    if (!order.delivery_date || order.delivery_date < params.startDate || order.delivery_date > params.endDate) {
      return false;
    }

    // Check if order has required effort data
    if (!order.total_prod_min && !order.total_mont_min) {
      return false;
    }

    return true;
  }

  private async planProductionEvent(
    order: Order,
    employees: Employee[],
    params: AutoPlanParams,
    runId: string,
    issues: AutoPlanIssue[],
    autoSettings: AutoPlanSettings
  ): Promise<void> {
    if (!order.total_prod_min || order.total_prod_min === 0) {
      return;
    }

    // Calculate production date based on lookahead
    const deliveryDate = new Date(order.delivery_date!);
    const productionDate = new Date(deliveryDate);
    const lookahead = autoSettings.autoPlanProductionLookaheadDays ?? 7;
    productionDate.setDate(productionDate.getDate() - lookahead);
    const productionDateStr = productionDate.toISOString().split('T')[0];

    // Check capacity
    const productionCapacity = await this.planningRepo.getRemainingCapacity('production', productionDateStr);
    if (productionCapacity + autoSettings.tolPerDayMin < order.total_prod_min) {
      issues.push(
        this.createIssue(
          runId,
          'insufficient_capacity',
          order.id,
          productionDateStr,
          undefined,
          order.total_prod_min - productionCapacity
        )
      );
    }

    // Assign available employees
    const availableEmployees = employees.slice(0, Math.max(1, autoSettings.maxEmployeesPerOrder));

    await this.planningRepo.createEvent({
      kind: 'production',
      orderId: order.id,
      startDate: productionDateStr,
      endDate: productionDateStr,
      totalMinutes: order.total_prod_min,
      travelMinutes: 0,
      employeeIds: availableEmployees.map(e => e.id),
      source: 'autoplan',
    });
  }

  private async planMontageEvent(
    order: Order,
    employees: Employee[],
    params: AutoPlanParams,
    runId: string,
    issues: AutoPlanIssue[],
    globalSettings: GlobalSettings,
    autoSettings: AutoPlanSettings
  ): Promise<void> {
    if (!order.total_mont_min || order.total_mont_min === 0) {
      return;
    }

    // Calculate montage date (1 day before delivery)
    const deliveryDate = new Date(order.delivery_date!);
    const montageDate = new Date(deliveryDate);
    montageDate.setDate(montageDate.getDate() - 1);
    const montageDateStr = montageDate.toISOString().split('T')[0];

    // Check capacity
    const found = await this.findSlotWithCapacity(
      'montage',
      order.total_mont_min,
      montageDate,
      autoSettings.autoPlanMontageSlipBackDays,
      autoSettings.autoPlanMontageSlipFwdDays,
      autoSettings.tolPerDayMin
    );
    let targetDateIso = montageDateStr;
    if (found) {
      targetDateIso = found.dateIso;
    } else {
      const capacity = await this.planningRepo.getRemainingCapacity('montage', montageDateStr);
      issues.push(
        this.createIssue(
          runId,
          'insufficient_capacity',
          order.id,
          montageDateStr,
          undefined,
          order.total_mont_min - capacity
        )
      );
    }

    // Calculate travel time based on distance, speed, and roundtrip setting
    let travelMinutes = 0;
    if (order.distance_km && order.distance_km > 0) {
      const distanceForCalc = globalSettings.travelRoundTrip ? order.distance_km * 2 : order.distance_km;
      travelMinutes = Math.ceil((distanceForCalc / globalSettings.travelKmh) * 60);
    }

    // Assign available employees
    const availableEmployees = employees.slice(0, Math.max(1, autoSettings.maxEmployeesPerOrder));

    await this.planningRepo.createEvent({
      kind: 'montage',
      orderId: order.id,
      startDate: targetDateIso,
      endDate: targetDateIso,
      totalMinutes: order.total_mont_min,
      travelMinutes,
      employeeIds: availableEmployees.map(e => e.id),
      source: 'autoplan',
    });
  }

  private async findSlotWithCapacity(
    kind: 'production' | 'montage',
    requiredMinutes: number,
    baseDate: Date,
    maxBack: number,
    maxForward: number,
    tolerance: number
  ) {
    const candidates: Date[] = [];
    for (let i = 0; i <= maxBack; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      candidates.push(d);
    }
    for (let i = 1; i <= maxForward; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      candidates.push(d);
    }

    for (const cand of candidates) {
      const iso = cand.toISOString().split('T')[0];
      const remaining = await this.planningRepo.getRemainingCapacity(kind, iso);
      if (remaining + tolerance >= requiredMinutes) {
        return { dateIso: iso, remaining };
      }
    }
    return null;
  }

  private createIssue(
    runId: string,
    type: string,
    orderId?: string,
    dateIso?: string,
    error?: unknown,
    deficitMin?: number
  ): AutoPlanIssue {
    return {
      id: `issue-${uuidv4()}`,
      run_id: runId,
      type,
      order_id: orderId,
      date_iso: dateIso,
      deficit_min: deficitMin,
      details_json: error ? JSON.stringify({ error: String(error) }) : undefined,
    };
  }

  private buildResult(
    runId: string,
    createdAt: string,
    params: AutoPlanParams,
    createdEvents: number,
    skippedOrders: number,
    issues: AutoPlanIssue[]
  ): AutoPlanResult {
    const run: AutoPlanRun = {
      id: runId,
      created_at: createdAt,
      params_json: JSON.stringify(params),
      summary_json: JSON.stringify({
        createdEvents,
        skippedOrders,
        issueCount: issues.length,
      }),
    };

    return { run, issues, createdEvents, skippedOrders };
  }
}
