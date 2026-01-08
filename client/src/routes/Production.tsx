import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ThreePanelLayout } from '../app/ThreePanelLayout';
import { useUIStore } from '../store/uiStore';
import { useOrdersList } from '../hooks/useOrders';
import { useEventsMonth } from '../hooks/useEvents';
import { AssignmentModal } from '../features/forecast/AssignmentModal';
import { createPlanEvent, deletePlanEvent } from '../api/events';
import { PlanningInspector } from '../features/planning/PlanningInspector';
import { EventEditModal } from '../features/planning/EventEditModal';
import { useCapacityMonth } from '../hooks/useCapacity';

function monthDays(monthIso: string) {
  const d = new Date(monthIso + 'T00:00:00Z');
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), i + 1));
    const iso = date.toISOString().slice(0, 10);
    return { iso, weekday: date.getUTCDay() };
  });
}

export default function Production() {
  const month = useUIStore((s) => s.currentMonth);
  const modal = useUIStore((s) => s.modal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const select = useUIStore((s) => s.setSelection);
  const selection = useUIStore((s) => s.selection);

  const [onlyWithPositions, setOnlyWithPositions] = useState(false);

  const { data: orders = [], isLoading: ordersLoading, isError: ordersError } = useOrdersList({
    monthIso: month,
    statuses: ['open'],
    onlyUnplanned: true,
    onlyWithPositions,
    sort: 'forecast:asc',
  });
  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useEventsMonth('production', month);
  const { data: capacity = {}, isLoading: capLoading, isError: capError } = useCapacityMonth('production', month);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const qc = useQueryClient();

  const createEvent = useMutation({
    mutationFn: async ({ orderId, date, durationHours, travelMinutes, employeeIds }:{ orderId: string; date: string; durationHours: number; travelMinutes: number; employeeIds: string[] }) => {
      const totalMinutes = Math.max(60, Math.round(durationHours * 60));
      return createPlanEvent({
        kind: 'production',
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
        qc.invalidateQueries({ queryKey: ['events','month','production', month] }),
        qc.invalidateQueries({ queryKey: ['orders','list'] }),
        qc.invalidateQueries({ queryKey: ['order','detail', vars.orderId] }),
      ]);
      closeModal();
    },
  });

  const days = useMemo(() => monthDays(month), [month]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    events.forEach((ev) => {
      const arr = map.get(ev.start_date) ?? [];
      arr.push(ev);
      map.set(ev.start_date, arr);
    });
    return map;
  }, [events]);

  return (
    <ThreePanelLayout
      sidebar={
        <div style={{ display: 'grid', gap: 8 }}>
          <h3>Planbare Aufträge</h3>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyWithPositions}
              onChange={(e) => setOnlyWithPositions(e.target.checked)}
            />
            <span>Nur mit Positionen</span>
          </label>
          {ordersLoading && <div className="badge">Lade Aufträge…</div>}
          {ordersError && <div className="badge">Aufträge laden fehlgeschlagen</div>}
          {!ordersLoading && !ordersError && orders.length === 0 && <div className="badge">Keine offenen Aufträge</div>}
          {orders.map((o) => (
            <button
              key={o.id}
              className={`kpi-card ${selectedOrderId === o.id ? 'active' : ''}`}
              style={{ textAlign: 'left' }}
              onClick={() => { setSelectedOrderId(o.id); select({ type: 'order', id: o.id }); }}
            >
              <div>#{o.id} {o.customer ?? ''}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Forecast {o.forecast_date ?? '-'}</div>
            </button>
          ))}
        </div>
      }
      inspector={<PlanningInspector kind="production" events={events} selection={selection} onDelete={async (id) => {
        const m = useMutation({ mutationFn: deletePlanEvent });
        await m.mutateAsync(id);
        await Promise.all([
          qc.invalidateQueries({ queryKey: ['events','month','production', month] }),
        ]);
      }} onEdit={(ev) => openModal({ type: 'editEvent', event: ev })} />}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        {eventsLoading && <div className="kpi-card">Lade Events…</div>}
        {eventsError && <div className="kpi-card">Events konnten nicht geladen werden.</div>}
        {!eventsLoading && !eventsError && events.length === 0 && (
          <div className="kpi-card">Keine Events für diesen Monat</div>
        )}
        {capError && <div className="kpi-card">Kapazität konnte nicht geladen werden.</div>}
        <div className="kpi-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map((d) => (
            <div key={d.iso} className={`day-cell ${d.weekday === 0 || d.weekday === 6 ? 'muted' : ''}`} style={{ border: '1px solid var(--border)', padding: 8, borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <button className="link" onClick={() => select({ type: 'day', date: d.iso })}>{d.iso.slice(8)}</button>
                {capLoading ? (
                  <span className="badge" title="Kapazität wird geladen">…</span>
                ) : capacity[d.iso] !== undefined ? (
                  <span
                    className="badge"
                    title="Verfügbare Minuten"
                    style={capacity[d.iso] < 0 ? { background: '#fee', color: '#a00' } : undefined}
                  >
                    {capacity[d.iso] < 0 ? `Überbucht ${capacity[d.iso]}m` : `Kapazität ${capacity[d.iso]}m`}
                  </span>
                ) : null}
                <button
                  className="btn"
                  disabled={!selectedOrderId}
                  onClick={() => selectedOrderId && openModal({ type: 'assignment', orderId: selectedOrderId, kind: 'production', date: d.iso })}
                >
                  Planen
                </button>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {(eventsByDate.get(d.iso) ?? []).map((ev) => (
                  <button key={ev.id} className="badge" style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'left' }} onClick={() => select({ type: 'event', id: ev.id })}>
                    <span>#{ev.order_id}</span>
                    <span>{Math.round(ev.total_minutes/60)}h</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {modal.type === 'assignment' && (
        <AssignmentModal
          orderId={modal.orderId}
          kind={modal.kind}
          initialDate={modal.date}
          onSubmit={async ({ date, durationHours, travelMinutes, employeeIds }) => {
            await createEvent.mutateAsync({ orderId: modal.orderId, date, durationHours, travelMinutes, employeeIds });
          }}
        />
      )}
      {modal.type === 'editEvent' && (
        <EventEditModal event={modal.event} />
      )}
    </ThreePanelLayout>
  );
}
