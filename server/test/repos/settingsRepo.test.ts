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

  it('can upsert and list items', async () => {
    await repo.upsertItem({ sku: 'A1', name: 'Item A1', prodMinPerUnit: 5 });
    const items = await repo.listItems();
    expect(items.length).toBe(1);
    expect(items[0].sku).toBe('A1');
  });

  it('can upsert and list employees and blockers', async () => {
    const id = await repo.upsertEmployee({ name: 'John', role: 'production', weeklyHours: 40, daysMask: 31 });
    const emps = await repo.listEmployees();
    expect(emps.find((e) => e.id === id)).toBeTruthy();

    const blockerId = await repo.upsertBlocker({ employeeId: id, dateIso: '2026-01-08', overnight: true });
    const blockers = await repo.listBlockers({ employeeId: id });
    expect(blockers.length).toBe(1);
    await repo.deleteBlocker(blockerId);
    const blockersAfter = await repo.listBlockers({ employeeId: id });
    expect(blockersAfter.length).toBe(0);
  });
});