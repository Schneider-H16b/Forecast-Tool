import React, { useMemo, useState } from 'react';
import { ThreePanelLayout } from '../app/ThreePanelLayout';
import { useUIStore } from '../store/uiStore';
import { useDashboardMetrics } from '../hooks/useDashboard';

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthRange(monthStartIso: string) {
  const start = new Date(monthStartIso + 'T00:00:00Z');
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return { from: toISO(start), to: toISO(end) };
}

function KPIBadges({ kpis }: { kpis: { label: string; value: number | string; unit?: string; trend?: 'up'|'down'|'neutral'; trendPercent?: number }[] }) {
  if (!kpis?.length) return <div className="kpi-card">Keine KPIs verfügbar</div>;
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
      {kpis.map((k) => (
        <div key={k.label} className="kpi-card" style={{ display: 'grid', gap: 4, padding: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{k.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {k.value}{k.unit ? ` ${k.unit}` : ''}
          </div>
          {k.trend && (
            <div style={{ fontSize: 12, color: k.trend === 'up' ? 'var(--ok)' : k.trend === 'down' ? 'var(--err)' : 'var(--muted)' }}>
              {k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '■'} {k.trendPercent ?? 0}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Bars({ data, title }: { title: string; data: { label: string; value: number; unit?: string }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="kpi-card" style={{ padding: 12, display: 'grid', gap: 8 }}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>{d.label}</span>
              <span>{d.value}{d.unit ? ` ${d.unit}` : ''}</span>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--ok))' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Drilldown({ metrics }: { metrics: any }) {
  if (!metrics) return null;
  const rows = [
    { label: 'Orders offen', value: metrics.orders?.open },
    { label: 'Orders geliefert', value: metrics.orders?.delivered },
    { label: 'Geplante Orders', value: metrics.planning?.plannedOrders },
    { label: 'Ungeplante Orders', value: metrics.planning?.unplannedOrders },
    { label: 'Events gesamt', value: metrics.planning?.totalEvents },
    { label: 'Ø Auslastung', value: metrics.planning?.averageEmployeeUtilization, unit: '%' },
    { label: 'Kapazitätsnutzung', value: metrics.performance?.capacityUtilization, unit: '%' },
    { label: 'On-Time Delivery', value: metrics.performance?.onTimeDeliveryRate, unit: '%' },
  ];
  return (
    <div className="kpi-card" style={{ padding: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Drilldown</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>{r.label}</span>
            <span>{r.value ?? '–'}{r.unit ? ` ${r.unit}` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KPIs() {
  const monthStart = useUIStore(s => s.currentMonth);
  const defaultRange = useMemo(() => monthRange(monthStart), [monthStart]);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const { data, isLoading, isError, refetch } = useDashboardMetrics(from, to);

  const planningBars = useMemo(() => {
    const m = data?.metrics;
    return [
      { label: 'Events gesamt', value: m?.planning?.totalEvents ?? 0 },
      { label: 'Fertigung', value: m?.planning?.productionEvents ?? 0 },
      { label: 'Montage', value: m?.planning?.montageEvents ?? 0 },
      { label: 'Ø Auslastung', value: m?.planning?.averageEmployeeUtilization ?? 0, unit: '%' },
    ];
  }, [data]);

  const performanceBars = useMemo(() => {
    const m = data?.metrics?.performance;
    return [
      { label: 'Forecast Accuracy', value: m?.forecastAccuracy ?? 0, unit: '%' },
      { label: 'Kapazitätsnutzung', value: m?.capacityUtilization ?? 0, unit: '%' },
      { label: 'On-Time Delivery', value: m?.onTimeDeliveryRate ?? 0, unit: '%' },
    ];
  }, [data]);

  const ordersBars = useMemo(() => {
    const o = data?.metrics?.orders;
    return [
      { label: 'Offen', value: o?.open ?? 0 },
      { label: 'Geliefert', value: o?.delivered ?? 0 },
      { label: 'Summe', value: o?.total ?? 0 },
    ];
  }, [data]);

  return (
    <ThreePanelLayout
      sidebar={(
        <div style={{ display: 'grid', gap: 12 }}>
          <h3>Zeitraum</h3>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Von</span>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Bis</span>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary" onClick={() => { const r = monthRange(monthStart); setFrom(r.from); setTo(r.to); }}>Aktueller Monat</button>
            <button className="secondary" onClick={() => { const now = new Date(); const past = new Date(now); past.setUTCDate(now.getUTCDate() - 29); setFrom(toISO(past)); setTo(toISO(now)); }}>Letzte 30 Tage</button>
          </div>
          <button onClick={() => refetch()}>Aktualisieren</button>
        </div>
      )}
      inspector={<Drilldown metrics={data?.metrics} />}
    >
      <div style={{display:'grid',gap:12}}>
        {isLoading && <div className="kpi-card">Lade KPIs…</div>}
        {isError && <div className="kpi-card" style={{ borderColor: 'var(--warn)' }}>Fehler beim Laden</div>}
        {!isLoading && !isError && data && (
          <>
            <KPIBadges kpis={data.kpis} />
            <Bars title="Orders" data={ordersBars} />
            <Bars title="Planning" data={planningBars} />
            <Bars title="Performance" data={performanceBars} />
          </>
        )}
      </div>
    </ThreePanelLayout>
  );
}
