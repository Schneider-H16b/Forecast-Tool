import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardMetrics } from '../../api/dashboard';

function monthStartToRange(isoMonthStart: string) {
  const d = new Date(isoMonthStart + 'T00:00:00Z');
  const from = isoMonthStart;
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const to = end.toISOString().slice(0, 10);
  return { from, to };
}

export default function ForecastKpiCards({ monthStart }: { monthStart: string }) {
  const { from, to } = monthStartToRange(monthStart);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard','metrics', from, to],
    queryFn: () => fetchDashboardMetrics(from, to),
  });

  if (isLoading) {
    return (
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <div className="kpi-card">Loading…</div>
        <div className="kpi-card">Loading…</div>
        <div className="kpi-card">Loading…</div>
        <div className="kpi-card">Loading…</div>
      </div>
    );
  }
  if (isError || !data) {
    return <div className="kpi-card" style={{borderColor:'var(--warn)'}}>Fehler beim Laden der KPIs</div>;
  }

  const top = data.kpis.slice(0,4);
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
      {top.map((k)=> (
        <div key={k.label} className="kpi-card">
          <div style={{fontSize:12,color:'var(--muted)'}}>{k.label}</div>
          <div style={{fontSize:22,fontWeight:600}}>
            {k.value}
            {k.unit ? <span style={{fontSize:12,marginLeft:6,color:'var(--muted)'}}>{k.unit}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
