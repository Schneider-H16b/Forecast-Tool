import React, { useState } from 'react';
import { ThreePanelLayout } from '../app/ThreePanelLayout';
import { useEmployees, useBlockers, useItems } from '../hooks/useSettings';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertEmployee, upsertBlocker, deleteBlocker, upsertItem, fetchAppSetting, setAppSetting } from '../api/settings';

function EmployeesPanel() {
  const { data: employees = [], isLoading, isError } = useEmployees();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: string; name: string; role: string; weeklyHours: number; daysMask: number; active: boolean; color?: string } | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return upsertEmployee(editing);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','employees'] });
      setEditing(null);
    },
  });
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <h3>Mitarbeiter</h3>
      {isLoading && <div className="badge">Lade…</div>}
      {isError && <div className="badge">Fehler beim Laden</div>}
      {employees.map(e => (
        <button key={e.id} className="kpi-card" style={{ textAlign: 'left' }} onClick={() => setEditing(e)}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{e.name} ({e.role})</span>
            <span>{e.active ? 'aktiv' : 'inaktiv'}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Wochenstunden: {e.weeklyHours}</div>
        </button>
      ))}
      {editing && (
        <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
          <h4>Bearbeiten: {editing.name}</h4>
          <label>
            <span>Name</span>
            <input value={editing.name} onChange={(e)=>setEditing({ ...editing, name: e.target.value })} />
          </label>
          <label>
            <span>Rolle</span>
            <input value={editing.role} onChange={(e)=>setEditing({ ...editing, role: e.target.value })} />
          </label>
          <label>
            <span>Wochenstunden</span>
            <input type="number" value={editing.weeklyHours} onChange={(e)=>setEditing({ ...editing, weeklyHours: Number(e.target.value) })} />
          </label>
          <label>
            <span>Aktiv</span>
            <input type="checkbox" checked={editing.active} onChange={(e)=>setEditing({ ...editing, active: e.target.checked })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="secondary" onClick={()=>setEditing(null)} disabled={save.isPending}>Abbrechen</button>
            <button onClick={()=>save.mutate()} disabled={save.isPending}>Speichern</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockersPanel() {
  const { data: blockers = [], isLoading, isError } = useBlockers();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: string; employeeId: string; dateIso: string; overnight: boolean; reason?: string } | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return upsertBlocker(editing);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings','blockers'] });
      setEditing(null);
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => deleteBlocker(id),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['settings','blockers'] }),
  });
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <h3>Blocker</h3>
      {isLoading && <div className="badge">Lade…</div>}
      {isError && <div className="badge">Fehler beim Laden</div>}
      {blockers.map(b => (
        <div key={b.id} className="kpi-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{b.employeeId} • {b.dateIso}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{b.reason ?? ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary" onClick={()=>setEditing(b)}>Bearbeiten</button>
            <button onClick={()=>del.mutate(b.id)} disabled={del.isPending}>Löschen</button>
          </div>
        </div>
      ))}
      <div>
        <button className="btn" onClick={()=>setEditing({ id: crypto.randomUUID(), employeeId: '', dateIso: '', overnight: false })}>Neu</button>
      </div>
      {editing && (
        <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
          <h4>{blockers.find(b=>b.id===editing.id)?'Bearbeiten':'Neu'}</h4>
          <label>
            <span>Mitarbeiter-ID</span>
            <input value={editing.employeeId} onChange={(e)=>setEditing({ ...editing, employeeId: e.target.value })} />
          </label>
          <label>
            <span>Datum</span>
            <input type="date" value={editing.dateIso} onChange={(e)=>setEditing({ ...editing, dateIso: e.target.value })} />
          </label>
          <label>
            <span>Übernachtung</span>
            <input type="checkbox" checked={editing.overnight} onChange={(e)=>setEditing({ ...editing, overnight: e.target.checked })} />
          </label>
          <label>
            <span>Grund</span>
            <input value={editing.reason ?? ''} onChange={(e)=>setEditing({ ...editing, reason: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="secondary" onClick={()=>setEditing(null)} disabled={save.isPending}>Abbrechen</button>
            <button onClick={()=>save.mutate()} disabled={save.isPending}>Speichern</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  return (
    <ThreePanelLayout
      sidebar={<EmployeesPanel />}
      inspector={<BlockersPanel />}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <ItemsPanel />
        <AppSettingsPanel />
      </div>
    </ThreePanelLayout>
  );
}

function ItemsPanel() {
  const { data: items = [], isLoading, isError } = useItems();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ sku: string; name?: string; prodMinPerUnit?: number; montMinPerUnit?: number; active?: boolean } | null>(null);
  const save = useMutation({
    mutationFn: async () => {
      if (!editing || !editing.sku) return;
      return upsertItem({
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
    },
  });
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Artikel</h3>
        <button className="btn" onClick={() => setEditing({ sku: '', name: '', prodMinPerUnit: 0, montMinPerUnit: 0, active: true })}>Neu</button>
      </div>
      {isLoading && <div className="badge">Lade…</div>}
      {isError && <div className="badge">Fehler beim Laden</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(it => (
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
          <label>
            <span>Aktiv</span>
            <input type="checkbox" checked={editing.active ?? true} onChange={(e)=>setEditing({ ...editing, active: e.target.checked })} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="secondary" onClick={()=>setEditing(null)} disabled={save.isPending}>Abbrechen</button>
            <button onClick={()=>save.mutate()} disabled={save.isPending || !editing.sku}>Speichern</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppSettingsPanel() {
  const [key, setKey] = useState('planning.example');
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const load = useMutation({
    mutationFn: async () => fetchAppSetting<unknown>(key),
    onSuccess: (val) => {
      setRaw(JSON.stringify(val ?? null, null, 2));
      setStatus('');
    },
    onError: () => setStatus('Fehler beim Laden'),
  });
  const save = useMutation({
    mutationFn: async () => {
      let val: unknown = null;
      try { val = raw ? JSON.parse(raw) : null; } catch { throw new Error('Ungültiges JSON'); }
      return setAppSetting(key, val);
    },
    onSuccess: () => setStatus('Gespeichert'),
    onError: (e) => setStatus(String(e)),
  });
  return (
    <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
      <h3>Global Settings (JSON)</h3>
      <label>
        <span>Key</span>
        <input value={key} onChange={(e)=>setKey(e.target.value)} />
      </label>
      <label>
        <span>Value (JSON)</span>
        <textarea rows={6} value={raw} onChange={(e)=>setRaw(e.target.value)} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="secondary" onClick={()=>load.mutate()} disabled={load.isPending}>Laden</button>
        <button onClick={()=>save.mutate()} disabled={save.isPending}>Speichern</button>
        {status && <span className="badge">{status}</span>}
      </div>
    </div>
  );
}
