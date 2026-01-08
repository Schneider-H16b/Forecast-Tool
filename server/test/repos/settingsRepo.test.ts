import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsRepoMemory } from '../../src/repos/in-memory/SettingsRepoMemory';

let repo: SettingsRepoMemory;

beforeEach(() => {
  repo = new SettingsRepoMemory();
});

describe('SettingsRepoMemory', () => {
  it('can set and get app settings', async () => {
    await repo.setAppSetting('travelKmh', 60);
    const val = await repo.getAppSetting('travelKmh');
    expect(val).toBe(60);
  });

  it('handles structured global and autoplan settings with defaults', async () => {
    const defaults = await repo.getGlobalSettings();
    expect(defaults.dayMinutes).toBeGreaterThan(0);
    const patched = await repo.setGlobalSettings({ dayMinutes: 420, travelRoundTrip: false });
    expect(patched.dayMinutes).toBe(420);
    expect(patched.travelRoundTrip).toBe(false);

    const autoDefaults = await repo.getAutoPlanSettings();
    expect(autoDefaults.maxEmployeesPerOrder).toBeGreaterThan(0);
    const autoPatched = await repo.setAutoPlanSettings({ maxEmployeesPerOrder: 5, tolPerDayMin: 30 });
    expect(autoPatched.maxEmployeesPerOrder).toBe(5);
    expect(autoPatched.tolPerDayMin).toBe(30);
  });

  it('can upsert and list items', async () => {
    await repo.upsertItem({ sku: 'A1', name: 'Item A1', prodMinPerUnit: 5 });
    const items = await repo.listItems();
    expect(items.length).toBe(1);
    expect(items[0].sku).toBe('A1');
    await repo.deleteItem('A1');
    const afterDelete = await repo.listItems();
    expect(afterDelete.length).toBe(0);
  });

  it('can upsert and list employees and blockers', async () => {
    const id = await repo.upsertEmployee({ name: 'John', role: 'production', weeklyHours: 40, daysMask: 31 });
    const emps = await repo.listEmployees();
    expect(emps.find((e) => e.id === id)).toBeTruthy();

    const blockerId = await repo.upsertBlocker({ employeeId: id, dateIso: '2026-01-08', overnight: true });
    const blockers = await repo.listBlockers({ employeeId: id });
    expect(blockers.length).toBe(1);
    const janBlockers = await repo.listBlockers({ monthIso: '2026-01' });
    expect(janBlockers.length).toBe(1);
    const febBlockers = await repo.listBlockers({ monthIso: '2026-02' });
    expect(febBlockers.length).toBe(0);
    await repo.deleteBlocker(blockerId);
    const blockersAfter = await repo.listBlockers({ employeeId: id });
    expect(blockersAfter.length).toBe(0);

    await repo.deleteEmployee(id);
    const afterDeleteEmp = await repo.listEmployees();
    expect(afterDeleteEmp.length).toBe(0);
  });
});