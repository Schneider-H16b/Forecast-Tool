import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ThreePanelLayout } from '../app/ThreePanelLayout';
import { Button, Card, CardHeader, CardBody, Badge } from '../ui/components';
import { useAutoPlanSettings, useBlockers, useEmployees, useGlobalSettings, useItems } from '../hooks/useSettings';
import {
  deleteBlocker,
  deleteEmployee,
  deleteItem,
  saveBlocker,
  saveEmployee,
  saveItem,
  updateAutoPlanSettings,
  updateGlobalSettings,
  type AutoPlanSettingsDto,
  type BlockerDto,
  type EmployeeDto,
  type GlobalSettingsDto,
  type ItemDto,
} from '../api/settings';
import { useToast } from '../store/toastStore';

type Tab = 'global' | 'autoplan' | 'items' | 'employees' | 'blockers';

export default function Settings() {
  const [tab, setTab] = useState<Tab>('global');
  return (
    <ThreePanelLayout
      sidebar={<SettingsNav tab={tab} onSelect={setTab} />}
      inspector={<SettingsHelp />}
    >
      {tab === 'global' && <GlobalSettingsPanel />}
      {tab === 'autoplan' && <AutoPlanSettingsPanel />}
      {tab === 'items' && <ItemsPanel />}
      {tab === 'employees' && <EmployeesPanel />}
      {tab === 'blockers' && <BlockersPanel />}
    </ThreePanelLayout>
  );
}

function SettingsNav({ tab, onSelect }: { tab: Tab; onSelect: (t: Tab) => void }) {
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'global', label: 'Global' },
    { id: 'autoplan', label: 'AutoPlan' },
    { id: 'items', label: 'Artikel' },
    { id: 'employees', label: 'Mitarbeiter' },
    { id: 'blockers', label: 'Blocker' },
  ];
  return (
    <Card>
      <CardHeader>
        <h3 style={{ margin: 0 }}>Einstellungen</h3>
      </CardHeader>
      <CardBody className="flex flex-col gap-2">
        {tabs.map(t => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'primary' : 'ghost'}
            size="md"
            onClick={() => onSelect(t.id)}
            className="justify-start"
          >
            {t.label}
          </Button>
        ))}
      </CardBody>
    </Card>
  );
}

function SettingsHelp() {
  return (
    <Card>
      <CardHeader>
        <h4 style={{ margin: 0 }}>Hinweise</h4>
      </CardHeader>
      <CardBody>
        <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 8 }}>
          <li>Änderungen werden sofort gespeichert.</li>
          <li>Minutenwerte werden automatisch begrenzt.</li>
          <li>Blocker können nach Monat gefiltert werden.</li>
        </ul>
      </CardBody>
    </Card>
  );
}

function GlobalSettingsPanel() {
  const { data, isLoading, isError } = useGlobalSettings();
  const [form, setForm] = useState<GlobalSettingsDto | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error('Keine Daten geladen');
      return updateGlobalSettings(form);
    },
    onSuccess: async (saved) => {
      setForm(saved);
      await qc.invalidateQueries({ queryKey: ['settings','global'] });
      toast.success('Globale Einstellungen gespeichert');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern'),
  });

  if (isLoading) return <Badge variant="info">Lade…</Badge>;
  if (isError) return <Badge variant="error">Fehler beim Laden</Badge>;

  return (
    <Card>
      <CardHeader>
        <h3 style={{ margin: 0 }}>Globale Einstellungen</h3>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Minuten pro Arbeitstag</span>
          <input
            type="number"
            min={60}
            max={960}
            value={form?.dayMinutes ?? 480}
            onChange={(e) => setForm(f => f ? { ...f, dayMinutes: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Minimal verfügbare Kapazität pro Tag</span>
          <input
            type="number"
            min={0}
            max={form?.dayMinutes ?? 960}
            value={form?.minCapPerDay ?? 60}
            onChange={(e) => setForm(f => f ? { ...f, minCapPerDay: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Reisegeschwindigkeit (km/h)</span>
          <input
            type="number"
            min={10}
            max={200}
            value={form?.travelKmh ?? 60}
            onChange={(e) => setForm(f => f ? { ...f, travelKmh: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={form?.travelRoundTrip ?? true}
            onChange={(e) => setForm(f => f ? { ...f, travelRoundTrip: e.target.checked } : null)}
          />
          <span className="text-sm">Hin- und Rückfahrt berechnen</span>
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form}>
            Speichern
          </Button>
        </div>
      </CardBody>
    </Card>
  );
      </div>
    </div>
  );
}

function AutoPlanSettingsPanel() {
  const { data, isLoading, isError } = useAutoPlanSettings();
  const [form, setForm] = useState<AutoPlanSettingsDto | null>(null);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error('Keine Daten geladen');
      return updateAutoPlanSettings(form);
    },
    onSuccess: async (saved) => {
      setForm(saved);
      await qc.invalidateQueries({ queryKey: ['settings','autoplan'] });
      toast.success('AutoPlan Einstellungen gespeichert');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern'),
  });

  if (isLoading) return <div className="badge">Lade…</div>;
  if (isError) return <div className="badge">Fehler beim Laden</div>;

  return (
    <div className="kpi-card" style={{ display: 'grid', gap: 12, padding: 12 }}>
      <h3>AutoPlan</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        <label>
          <span>Toleranz pro Tag (Minuten)</span>
          <input
            type="number"
            min={0}
            max={240}
            value={form?.tolPerDayMin ?? 60}
            onChange={(e) => setForm(f => f ? { ...f, tolPerDayMin: Number(e.target.value) } : null)}
          />
        </label>
        <label>
          <span>Max. Mitarbeiter pro Auftrag</span>
          <input
            type="number"
            min={1}
            max={8}
            value={form?.maxEmployeesPerOrder ?? 3}
            onChange={(e) => setForm(f => f ? { ...f, maxEmployeesPerOrder: Number(e.target.value) } : null)}
          />
        </label>
        <label>
          <span>Weiche Konfliktgrenze (Minuten)</span>
          <input
            type="number"
            min={0}
            max={960}
            value={form?.softConflictLimitMin ?? 120}
            onChange={(e) => setForm(f => f ? { ...f, softConflictLimitMin: Number(e.target.value) } : null)}
          />
        </label>
        <label>
          <span>Montage rückwärts schieben (Tage)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={form?.autoPlanMontageSlipBackDays ?? 5}
            onChange={(e) => setForm(f => f ? { ...f, autoPlanMontageSlipBackDays: Number(e.target.value) } : null)}
          />
        </label>
        <label>
          <span>Montage vorwärts schieben (Tage)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={form?.autoPlanMontageSlipFwdDays ?? 5}
            onChange={(e) => setForm(f => f ? { ...f, autoPlanMontageSlipFwdDays: Number(e.target.value) } : null)}
          />
        </label>
        <label>
          <span>Production Lookahead (Tage)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={form?.autoPlanProductionLookaheadDays ?? 30}
            onChange={(e) => setForm(f => f ? { ...f, autoPlanProductionLookaheadDays: Number(e.target.value) } : null)}
          />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={form?.respectOvernightBarriers ?? true}
            onChange={(e) => setForm(f => f ? { ...f, respectOvernightBarriers: e.target.checked } : null)}
          />
          <span>Übernachtungs-Blocker beachten</span>
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => save.mutate()} disabled={save.isPending || !form}>Speichern</button>
      </div>
    </div>
  );
}

function ItemsPanel() {
  const { data: items = [], isLoading, isError } = useItems();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<ItemDto | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      if (!editing.sku?.trim()) throw new Error('SKU ist erforderlich');
      if ((editing.prodMinPerUnit ?? 0) < 0) throw new Error('Prod min/Unit müssen ≥ 0 sein');
      if ((editing.montMinPerUnit ?? 0) < 0) throw new Error('Mont min/Unit müssen ≥ 0 sein');
      return saveItem({
        sku: editing.sku,
        name: editing.name,
        prodMinPerUnit: editing.prodMinPerUnit ?? 0,
        montMinPerUnit: editing.montMinPerUnit ?? 0,
        active: editing.active ?? true,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','items'] });
      setEditing(null);
      toast.success('Artikel gespeichert');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern'),
  });

  const remove = useMutation({
    mutationFn: async (sku: string) => deleteItem(sku),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','items'] });
      toast.success('Artikel gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.sku.localeCompare(b.sku)), [items]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Artikel</h3>
        <button className="btn" onClick={() => setEditing({ sku: '', name: '', prodMinPerUnit: 0, montMinPerUnit: 0, active: true })}>Neu</button>
      </div>
      {isLoading && <div className="badge">Lade…</div>}
      {isError && <div className="badge">Fehler beim Laden</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {sortedItems.map(it => (
          <button key={it.sku} className="kpi-card" style={{ textAlign: 'left' }} onClick={() => setEditing(it)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{it.sku} • {it.name ?? '-'}</span>
              <span>{it.active ? 'aktiv' : 'inaktiv'}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Prod/Mon: {it.prodMinPerUnit ?? 0} / {it.montMinPerUnit ?? 0} min/Unit</div>
          </button>
        ))}
      </div>
      {editing && (
        <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
          <h4>{items.find(i=>i.sku===editing.sku)?'Bearbeiten':'Neu anlegen'}</h4>
          <label>
            <span>SKU</span>
            <input value={editing.sku} onChange={(e)=>setEditing({ ...editing, sku: e.target.value })} />
          </label>
          <label>
            <span>Name</span>
            <input value={editing.name ?? ''} onChange={(e)=>setEditing({ ...editing, name: e.target.value })} />
          </label>
          <label>
            <span>Prod min/Unit</span>
            <input type="number" min={0} value={editing.prodMinPerUnit ?? 0} onChange={(e)=>setEditing({ ...editing, prodMinPerUnit: Number(e.target.value) })} />
          </label>
          <label>
            <span>Mont min/Unit</span>
            <input type="number" min={0} value={editing.montMinPerUnit ?? 0} onChange={(e)=>setEditing({ ...editing, montMinPerUnit: Number(e.target.value) })} />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={editing.active ?? true} onChange={(e)=>setEditing({ ...editing, active: e.target.checked })} />
            <span>Aktiv</span>
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {editing.sku && items.some(i => i.sku === editing.sku) && (
              <button className="secondary" onClick={() => remove.mutate(editing.sku)} disabled={remove.isPending}>Löschen</button>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="secondary" onClick={()=>setEditing(null)} disabled={save.isPending}>Abbrechen</button>
              <button onClick={()=>save.mutate()} disabled={save.isPending || !editing.sku}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeesPanel() {
  const { data: employees = [], isLoading, isError } = useEmployees();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<EmployeeDto | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      if (!editing.name?.trim()) throw new Error('Name ist erforderlich');
      if (!editing.role?.trim()) throw new Error('Rolle ist erforderlich');
      if (editing.weeklyHours < 0) throw new Error('Wochenstunden müssen ≥ 0 sein');
      return saveEmployee(editing);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','employees'] });
      setEditing(null);
      toast.success('Mitarbeiter gespeichert');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => deleteEmployee(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','employees'] });
      toast.success('Mitarbeiter gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });

  const sortedEmployees = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name)), [employees]);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Mitarbeiter</h3>
        <button className="btn" onClick={() => setEditing({ id: '', name: '', role: 'montage', weeklyHours: 40, daysMask: 0b1111100, active: true })}>Neu</button>
      </div>
      {isLoading && <div className="badge">Lade…</div>}
      {isError && <div className="badge">Fehler beim Laden</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {sortedEmployees.map(e => (
          <button key={e.id} className="kpi-card" style={{ textAlign: 'left' }} onClick={() => setEditing(e)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{e.name} ({e.role})</span>
              <span>{e.active ? 'aktiv' : 'inaktiv'}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Wochenstunden: {e.weeklyHours}</div>
          </button>
        ))}
      </div>
      {editing && (
        <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
          <h4>{editing.id ? 'Bearbeiten' : 'Neu anlegen'}</h4>
          <label>
            <span>Name</span>
            <input value={editing.name} onChange={(e)=>setEditing({ ...editing, name: e.target.value })} />
          </label>
          <label>
            <span>Rolle</span>
            <select value={editing.role} onChange={(e)=>setEditing({ ...editing, role: e.target.value })}>
              <option value="production">production</option>
              <option value="montage">montage</option>
              <option value="other">other</option>
            </select>
          </label>
          <label>
            <span>Wochenstunden</span>
            <input type="number" min={0} max={80} value={editing.weeklyHours} onChange={(e)=>setEditing({ ...editing, weeklyHours: Number(e.target.value) })} />
          </label>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Arbeitstage</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Mo','Di','Mi','Do','Fr','Sa','So'].map((label, idx) => {
                const bit = 1 << idx;
                const checked = (editing.daysMask & bit) === bit;
                return (
                  <label key={label} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const newMask = checked ? (editing.daysMask & ~bit) : (editing.daysMask | bit);
                        setEditing({ ...editing, daysMask: newMask });
                      }}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={editing.active} onChange={(e)=>setEditing({ ...editing, active: e.target.checked })} />
            <span>Aktiv</span>
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {editing.id && employees.some(e => e.id === editing.id) && (
              <button className="secondary" onClick={() => remove.mutate(editing.id)} disabled={remove.isPending}>Löschen</button>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="secondary" onClick={()=>setEditing(null)} disabled={save.isPending}>Abbrechen</button>
              <button onClick={()=>save.mutate()} disabled={save.isPending}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockersPanel() {
  const { data: employees = [] } = useEmployees();
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [monthIso, setMonthIso] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const { data: blockers = [], isLoading, isError } = useBlockers({ employeeId: employeeFilter || undefined, monthIso });
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<BlockerDto | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      if (!editing.employeeId?.trim()) throw new Error('Mitarbeiter ist erforderlich');
      if (!editing.dateIso?.trim()) throw new Error('Datum ist erforderlich');
      return saveBlocker(editing);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','blockers'] });
      setEditing(null);
      toast.success('Blocker gespeichert');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Fehler beim Speichern'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => deleteBlocker(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','blockers'] });
      toast.success('Blocker gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });

  const filtered = useMemo(() => blockers, [blockers]);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Blocker</h3>
        <button className="btn" onClick={()=>setEditing({ id: crypto.randomUUID(), employeeId: '', dateIso: '', overnight: false, reason: '' })}>Neu</button>
      </div>
      <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Filter Mitarbeiter</span>
            <select value={employeeFilter} onChange={(e)=>setEmployeeFilter(e.target.value)}>
              <option value="">Alle</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Monat</span>
            <input type="month" value={monthIso} onChange={(e)=>setMonthIso(e.target.value)} />
          </label>
        </div>
      </div>
      {isLoading && <div className="badge">Lade…</div>}
      {isError && <div className="badge">Fehler beim Laden</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(b => (
          <div key={b.id} className="kpi-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{b.dateIso} • {employees.find(e=>e.id===b.employeeId)?.name ?? b.employeeId}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{b.reason ?? ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="secondary" onClick={()=>setEditing(b)}>Bearbeiten</button>
              <button onClick={()=>remove.mutate(b.id)} disabled={remove.isPending}>Löschen</button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
          <h4>{blockers.find(b=>b.id===editing.id)?'Bearbeiten':'Neu'}</h4>
          <label>
            <span>Mitarbeiter</span>
            <select value={editing.employeeId} onChange={(e)=>setEditing({ ...editing, employeeId: e.target.value })}>
              <option value="">Bitte wählen…</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </label>
          <label>
            <span>Datum</span>
            <input type="date" value={editing.dateIso} onChange={(e)=>setEditing({ ...editing, dateIso: e.target.value })} />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={editing.overnight} onChange={(e)=>setEditing({ ...editing, overnight: e.target.checked })} />
            <span>Übernachtung</span>
          </label>
          <label>
            <span>Grund</span>
            <input value={editing.reason ?? ''} onChange={(e)=>setEditing({ ...editing, reason: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="secondary" onClick={()=>setEditing(null)} disabled={save.isPending}>Abbrechen</button>
            <button onClick={()=>save.mutate()} disabled={save.isPending || !editing.employeeId || !editing.dateIso}>Speichern</button>
          </div>
        </div>
      )}
    </div>
  );
}
