import React from 'react';
import type { PlanEventDto } from '../../api/events';
import type { Selection } from '../../store/uiStore';

interface Props {
  kind: 'production'|'montage';
  events: PlanEventDto[];
  selection: Selection;
  onDelete?: (id: string) => void;
}

export function PlanningInspector({ kind, events, selection, onDelete }: Props) {
  if (selection.type === 'none') {
    return <div className="kpi-card">Wähle einen Tag oder Event</div>;
  }
  if (selection.type === 'day') {
    const list = events.filter((e) => e.start_date === selection.date);
    return (
      <div className="kpi-card" style={{ display: 'grid', gap: 8 }}>
        <h4>{kind === 'production' ? 'Fertigung' : 'Montage'} – {selection.date}</h4>
        {list.length === 0 && <div className="badge">Keine Events</div>}
        {list.map((ev) => (
          <div key={ev.id} className="badge" style={{ display: 'grid', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>#{ev.order_id}</span>
              <span>{Math.round(ev.total_minutes/60)}h</span>
            </div>
            {kind === 'montage' && <div style={{ fontSize: 12 }}>Reise: {ev.travel_minutes} min</div>}
            {ev.employeeIds && ev.employeeIds.length > 0 && (
              <div style={{ fontSize: 12 }}>MA: {ev.employeeIds.join(', ')}</div>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (selection.type === 'event') {
    const ev = events.find((e) => e.id === selection.id);
    if (!ev) return <div className="kpi-card">Event nicht gefunden</div>;
    return (
      <div className="kpi-card" style={{ display: 'grid', gap: 6 }}>
        <h4>Event #{ev.id}</h4>
        <div>Auftrag: {ev.order_id}</div>
        <div>Datum: {ev.start_date} – {ev.end_date}</div>
        <div>Dauer: {Math.round(ev.total_minutes/60)}h</div>
        {kind === 'montage' && <div>Reise: {ev.travel_minutes} min</div>}
        {ev.employeeIds && ev.employeeIds.length > 0 && <div>MA: {ev.employeeIds.join(', ')}</div>}
        <div>Quelle: {ev.source ?? 'manual'}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="secondary" onClick={() => onDelete?.(ev.id)}>Löschen</button>
        </div>
      </div>
    );
  }
  if (selection.type === 'order') {
    return <div className="kpi-card">Auftrag #{selection.id} gewählt</div>;
  }
  return <div className="kpi-card">Keine Auswahl</div>;
}
