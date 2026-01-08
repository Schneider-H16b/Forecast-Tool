import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ThreePanelLayout } from '../app/ThreePanelLayout';
import ForecastKpiCards from '../features/forecast/ForecastKpiCards';
import { useUIStore } from '../store/uiStore';
import { useOrdersList } from '../hooks/useOrders';
import ForecastTable from '../features/forecast/ForecastTable';
import ForecastSidebar from '../features/forecast/ForecastSidebar';
import ForecastSortBar from '../features/forecast/ForecastSortBar';
import OrderInspector from '../features/forecast/OrderInspector';
import { PositionsModal } from '../features/forecast/PositionsModal';
import { AssignmentModal } from '../features/forecast/AssignmentModal';
import { createPlanEvent } from '../api/events';
import { AutoPlanResultModal } from '../features/forecast/AutoPlanResultModal';

export default function Forecast() {
  const month = useUIStore(s=>s.currentMonth);
  const f = useUIStore(s=>s.forecast);
  const sortParam = `${f.sort.key === 'forecast' ? 'forecast' : f.sort.key}:${f.sort.dir}`;
  const { data: orders = [], isLoading, isError } = useOrdersList({
    monthIso: undefined, // default: no date filter to show all orders
    search: f.search,
    statuses: f.statuses,
    onlyDelayed: f.onlyDelayed,
    onlyUnplanned: f.onlyUnplanned,
    sort: sortParam,
  });
  const select = useUIStore(s=>s.setSelection);
  const selected = useUIStore(s=>s.selection);
  const modal = useUIStore(s=>s.modal);
  const closeModal = useUIStore(s=>s.closeModal);
  const qc = useQueryClient();
  const createEventMutation = useMutation({
    mutationFn: async ({ orderId, kind, date, durationHours, travelMinutes, employeeIds }:{ orderId: string; kind:'production'|'montage'; date: string; durationHours: number; travelMinutes: number; employeeIds: string[] }) => {
      const totalMinutes = Math.max(60, Math.round(durationHours * 60));
      return createPlanEvent({
        kind,
        orderId,
        startDate: date,
        endDate: date,
        totalMinutes,
        travelMinutes,
        employeeIds,
      });
    },
    onSuccess: async (_data, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['events','month'] }),
        qc.invalidateQueries({ queryKey: ['orders','list'] }),
        qc.invalidateQueries({ queryKey: ['order','detail', vars.orderId] }),
      ]);
      closeModal();
    },
  });
  return (
    <ThreePanelLayout
      sidebar={<ForecastSidebar />}
      inspector={<OrderInspector orderId={selected.type==='order'? selected.id: undefined} />}
    >
      <div style={{display:'grid',gap:12}}>
        <ForecastKpiCards monthStart={month} />
        <ForecastSortBar />
        {isLoading && <div className="kpi-card">Lade Orders…</div>}
        {isError && <div className="kpi-card" style={{borderColor:'var(--warn)'}}>Fehler beim Laden der Orders</div>}
        {!isLoading && !isError && <ForecastTable rows={orders} onSelectOrder={(id)=>select({ type:'order', id })} />}
      </div>
      {modal.type === 'positions' && (
        <PositionsModal orderId={modal.orderId} />
      )}
      {modal.type === 'assignment' && (
        <AssignmentModal
          orderId={modal.orderId}
          kind={modal.kind}
          initialDate={modal.date}
          onSubmit={async ({ date, durationHours, travelMinutes, employeeIds }) => {
            await createEventMutation.mutateAsync({ orderId: modal.orderId, kind: modal.kind, date, durationHours, travelMinutes, employeeIds });
          }}
        />
      )}
      {modal.type === 'autoplanResult' && (
        <AutoPlanResultModal result={modal.result as any} />
      )}
    </ThreePanelLayout>
  );
}
