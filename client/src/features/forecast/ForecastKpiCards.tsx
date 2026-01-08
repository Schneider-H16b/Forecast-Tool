import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardMetrics } from '../../api/dashboard';
import { KPICard, DashboardGrid } from '../../ui/components';

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
      <DashboardGrid cols={4}>
        <div className="kpi-card animate-pulse h-24" />
        <div className="kpi-card animate-pulse h-24" />
        <div className="kpi-card animate-pulse h-24" />
        <div className="kpi-card animate-pulse h-24" />
      </DashboardGrid>
    );
  }
  if (isError || !data) {
    return (
      <div className="card border-error/50 bg-error-light/20">
        <div className="text-error font-semibold">⚠ Fehler beim Laden der KPIs</div>
      </div>
    );
  }

  const top = data.kpis.slice(0,4);
  return (
    <DashboardGrid cols={4}>
      {top.map((k, idx)=> (
        <KPICard
          key={k.label}
          value={k.value}
          label={k.label}
          icon={['📊', '⏱️', '✓', '📈'][idx]}
        />
      ))}
    </DashboardGrid>
  );
}
