import React, { useMemo, useState } from 'react';
import { ThreePanelLayout } from '../app/ThreePanelLayout';
import { KPICard, DashboardGrid, Card, CardHeader, CardBody } from '../ui/components';
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
  if (!kpis?.length) return <Card><CardBody>Keine KPIs verfügbar</CardBody></Card>;
  return (
    <DashboardGrid>
      {kpis.map((k) => (
        <KPICard
          key={k.label}
          label={k.label}
          value={String(k.value)}
          unit={k.unit}
          trend={k.trend}
          trendPercent={k.trendPercent}
        />
      ))}
    </DashboardGrid>
  );
}

function Bars({ data, title }: { title: string; data: { label: string; value: number; unit?: string }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <Card>
      <CardHeader>
        <h4 style={{ margin: 0 }}>{title}</h4>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {data.map(d => (
          <div key={d.label} className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span>{d.label}</span>
              <span>{d.value}{d.unit ? ` ${d.unit}` : ''}</span>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: 'var(--h16b-accent)' }} />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
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
    <Card>
      <CardHeader>
        <h4 style={{ margin: 0 }}>Drilldown</h4>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="font-medium">{r.value ?? '–'}{r.unit ? ` ${r.unit}` : ''}</span>
          </div>
        ))}
      </CardBody>
    </Card>
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
