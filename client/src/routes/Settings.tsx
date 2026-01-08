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

  if (isLoading) return <Badge variant="info">Lade…</Badge>;
  if (isError) return <Badge variant="error">Fehler beim Laden</Badge>;

  return (
    <Card>
      <CardHeader>
        <h3 style={{ margin: 0 }}>AutoPlan Einstellungen</h3>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Toleranz pro Tag (Minuten)</span>
          <input
            type="number"
            min={0}
            max={240}
            value={form?.tolPerDayMin ?? 60}
            onChange={(e) => setForm(f => f ? { ...f, tolPerDayMin: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Max. Mitarbeiter pro Auftrag</span>
          <input
            type="number"
            min={1}
            max={8}
            value={form?.maxEmployeesPerOrder ?? 3}
            onChange={(e) => setForm(f => f ? { ...f, maxEmployeesPerOrder: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Weiche Konfliktgrenze (Minuten)</span>
          <input
            type="number"
            min={0}
            max={960}
            value={form?.softConflictLimitMin ?? 120}
            onChange={(e) => setForm(f => f ? { ...f, softConflictLimitMin: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Montage rückwärts schieben (Tage)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={form?.autoPlanMontageSlipBackDays ?? 5}
            onChange={(e) => setForm(f => f ? { ...f, autoPlanMontageSlipBackDays: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Montage vorwärts schieben (Tage)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={form?.autoPlanMontageSlipFwdDays ?? 5}
            onChange={(e) => setForm(f => f ? { ...f, autoPlanMontageSlipFwdDays: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Production Lookahead (Tage)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={form?.autoPlanProductionLookaheadDays ?? 30}
            onChange={(e) => setForm(f => f ? { ...f, autoPlanProductionLookaheadDays: Number(e.target.value) } : null)}
            className="px-3 py-2 rounded border border-gray-300"
          />
        </label>
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={form?.respectOvernightBarriers ?? true}
            onChange={(e) => setForm(f => f ? { ...f, respectOvernightBarriers: e.target.checked } : null)}
          />
          <span className="text-sm">Übernachtungs-Blocker beachten</span>
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form}>
            Speichern
          </Button>
        </div>
      </CardBody>
    </Card>
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 style={{ margin: 0 }}>Artikel</h3>
        <Button onClick={() => setEditing({ sku: '', name: '', prodMinPerUnit: 0, montMinPerUnit: 0, active: true })}>
          Neu
        </Button>
      </div>
      {isLoading && <Badge variant="info">Lade…</Badge>}
      {isError && <Badge variant="error">Fehler beim Laden</Badge>}
      <div className="flex flex-col gap-3">
        {sortedItems.map(it => (
          <Card key={it.sku} className="cursor-pointer hover:bg-gray-50" onClick={() => setEditing(it)}>
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{it.sku} • {it.name ?? '-'}</div>
                  <div className="text-xs text-gray-500 mt-1">Prod/Mon: {it.prodMinPerUnit ?? 0} / {it.montMinPerUnit ?? 0} min/Unit</div>
                </div>
                <Badge variant={it.active ? 'info' : 'warning'}>
                  {it.active ? 'aktiv' : 'inaktiv'}
                </Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      {editing && (
        <Card>
          <CardHeader>
            <h4 style={{ margin: 0 }}>{items.find(i=>i.sku===editing.sku)?'Bearbeiten':'Neu anlegen'}</h4>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">SKU</span>
              <input value={editing.sku} onChange={(e)=>setEditing({ ...editing, sku: e.target.value })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Name</span>
              <input value={editing.name ?? ''} onChange={(e)=>setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Prod min/Unit</span>
              <input type="number" min={0} value={editing.prodMinPerUnit ?? 0} onChange={(e)=>setEditing({ ...editing, prodMinPerUnit: Number(e.target.value) })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Mont min/Unit</span>
              <input type="number" min={0} value={editing.montMinPerUnit ?? 0} onChange={(e)=>setEditing({ ...editing, montMinPerUnit: Number(e.target.value) })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <label className="flex gap-3 items-center">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e)=>setEditing({ ...editing, active: e.target.checked })} />
              <span className="text-sm">Aktiv</span>
            </label>
            <div className="flex gap-3 justify-end pt-2">
              {editing.sku && items.some(i => i.sku === editing.sku) && (
                <Button variant="danger" onClick={() => remove.mutate(editing.sku)} disabled={remove.isPending}>
                  Löschen
                </Button>
              )}
              <Button variant="ghost" onClick={()=>setEditing(null)} disabled={save.isPending}>
                Abbrechen
              </Button>
              <Button onClick={()=>save.mutate()} disabled={save.isPending || !editing.sku}>
                Speichern
              </Button>
            </div>
          </CardBody>
        </Card>
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 style={{ margin: 0 }}>Mitarbeiter</h3>
        <Button onClick={() => setEditing({ id: '', name: '', role: 'montage', weeklyHours: 40, daysMask: 0b1111100, active: true })}>
          Neu
        </Button>
      </div>
      {isLoading && <Badge variant="info">Lade…</Badge>}
      {isError && <Badge variant="error">Fehler beim Laden</Badge>}
      <div className="flex flex-col gap-3">
        {sortedEmployees.map(e => (
          <Card key={e.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setEditing(e)}>
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{e.name} ({e.role})</div>
                  <div className="text-xs text-gray-500 mt-1">Wochenstunden: {e.weeklyHours}</div>
                </div>
                <Badge variant={e.active ? 'info' : 'warning'}>
                  {e.active ? 'aktiv' : 'inaktiv'}
                </Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      {editing && (
        <Card>
          <CardHeader>
            <h4 style={{ margin: 0 }}>{editing.id ? 'Bearbeiten' : 'Neu anlegen'}</h4>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Name</span>
              <input value={editing.name} onChange={(e)=>setEditing({ ...editing, name: e.target.value })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Rolle</span>
              <select value={editing.role} onChange={(e)=>setEditing({ ...editing, role: e.target.value })} className="px-3 py-2 rounded border border-gray-300">
                <option value="production">production</option>
                <option value="montage">montage</option>
                <option value="other">other</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Wochenstunden</span>
              <input type="number" min={0} max={80} value={editing.weeklyHours} onChange={(e)=>setEditing({ ...editing, weeklyHours: Number(e.target.value) })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Arbeitstage</span>
              <div className="flex gap-3 flex-wrap">
                {['Mo','Di','Mi','Do','Fr','Sa','So'].map((label, idx) => {
                  const bit = 1 << idx;
                  const checked = (editing.daysMask & bit) === bit;
                  return (
                    <label key={label} className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const newMask = checked ? (editing.daysMask & ~bit) : (editing.daysMask | bit);
                          setEditing({ ...editing, daysMask: newMask });
                        }}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <label className="flex gap-3 items-center">
              <input type="checkbox" checked={editing.active} onChange={(e)=>setEditing({ ...editing, active: e.target.checked })} />
              <span className="text-sm">Aktiv</span>
            </label>
            <div className="flex gap-3 justify-end pt-2">
              {editing.id && employees.some(e => e.id === editing.id) && (
                <Button variant="danger" onClick={() => remove.mutate(editing.id)} disabled={remove.isPending}>
                  Löschen
                </Button>
              )}
              <Button variant="ghost" onClick={()=>setEditing(null)} disabled={save.isPending}>
                Abbrechen
              </Button>
              <Button onClick={()=>save.mutate()} disabled={save.isPending}>
                Speichern
              </Button>
            </div>
          </CardBody>
        </Card>
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 style={{ margin: 0 }}>Blocker</h3>
        <Button onClick={()=>setEditing({ id: crypto.randomUUID(), employeeId: '', dateIso: '', overnight: false, reason: '' })}>
          Neu
        </Button>
      </div>
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex gap-6 flex-wrap">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Filter Mitarbeiter</span>
              <select value={employeeFilter} onChange={(e)=>setEmployeeFilter(e.target.value)} className="px-3 py-2 rounded border border-gray-300">
                <option value="">Alle</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Monat</span>
              <input type="month" value={monthIso} onChange={(e)=>setMonthIso(e.target.value)} className="px-3 py-2 rounded border border-gray-300" />
            </label>
          </div>
        </CardBody>
      </Card>
      {isLoading && <Badge variant="info">Lade…</Badge>}
      {isError && <Badge variant="error">Fehler beim Laden</Badge>}
      <div className="flex flex-col gap-3">
        {filtered.map(b => (
          <Card key={b.id}>
            <CardBody>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{b.dateIso} • {employees.find(e=>e.id===b.employeeId)?.name ?? b.employeeId}</div>
                  <div className="text-xs text-gray-500 mt-1">{b.reason ?? '-'}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={()=>setEditing(b)}>
                    Bearbeiten
                  </Button>
                  <Button variant="danger" size="sm" onClick={()=>remove.mutate(b.id)} disabled={remove.isPending}>
                    Löschen
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      {editing && (
        <Card>
          <CardHeader>
            <h4 style={{ margin: 0 }}>{blockers.find(b=>b.id===editing.id)?'Bearbeiten':'Neu'}</h4>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Mitarbeiter</span>
              <select value={editing.employeeId} onChange={(e)=>setEditing({ ...editing, employeeId: e.target.value })} className="px-3 py-2 rounded border border-gray-300">
                <option value="">Bitte wählen…</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Datum</span>
              <input type="date" value={editing.dateIso} onChange={(e)=>setEditing({ ...editing, dateIso: e.target.value })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <label className="flex gap-3 items-center">
              <input type="checkbox" checked={editing.overnight} onChange={(e)=>setEditing({ ...editing, overnight: e.target.checked })} />
              <span className="text-sm">Übernachtung</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Grund</span>
              <input value={editing.reason ?? ''} onChange={(e)=>setEditing({ ...editing, reason: e.target.value })} className="px-3 py-2 rounded border border-gray-300" />
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={()=>setEditing(null)} disabled={save.isPending}>
                Abbrechen
              </Button>
              <Button onClick={()=>save.mutate()} disabled={save.isPending || !editing.employeeId || !editing.dateIso}>
                Speichern
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
