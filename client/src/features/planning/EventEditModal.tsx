import { useState } from 'react';
import Modal from '../../ui/components/Modal';
import { useUIStore } from '../../store/uiStore';
import { updatePlanEvent } from '../../api/events';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  event: {
    id: string;
    kind: 'production'|'montage';
    order_id: string;
    start_date: string;
    end_date: string;
    total_minutes: number;
    travel_minutes: number;
    employeeIds?: string[];
  };
}

export function EventEditModal({ event }: Props) {
  const close = useUIStore((s) => s.closeModal);
  const [durationHours, setDurationHours] = useState(Math.round(event.total_minutes / 60));
  const [travelMinutes, setTravelMinutes] = useState(event.travel_minutes ?? 0);
  const [employees, setEmployees] = useState((event.employeeIds ?? []).join(','));
  const qc = useQueryClient();
  const monthKey = event.start_date.slice(0, 7);
  const m = useMutation({
    mutationFn: async () => {
      const employeeIds = employees.split(',').map(s => s.trim()).filter(Boolean);
      const totalMinutes = Math.max(60, Math.round(durationHours * 60));
      return updatePlanEvent(event.id, {
        kind: event.kind,
        orderId: event.order_id,
        startDate: event.start_date,
        endDate: event.end_date,
        totalMinutes,
        travelMinutes,
        employeeIds,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['events','month', event.kind, monthKey] }),
        qc.invalidateQueries({ queryKey: ['events','month','all', monthKey] }),
        qc.invalidateQueries({ queryKey: ['order','detail', event.order_id] }),
      ]);
      close();
    },
  });

  return (
    <Modal open title={`Event ${event.id} bearbeiten`} onClose={close}>
      <div className="form">
        <label>
          <span>Dauer (Std.)</span>
          <input type="number" min={1} max={12} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} />
        </label>
        {event.kind === 'montage' && (
          <label>
            <span>Reisezeit (Min.)</span>
            <input type="number" min={0} max={600} value={travelMinutes} onChange={(e) => setTravelMinutes(Number(e.target.value))} />
          </label>
        )}
        <label>
          <span>Mitarbeiter-IDs (CSV)</span>
          <input value={employees} onChange={(e) => setEmployees(e.target.value)} />
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button className="secondary" onClick={close} disabled={m.isPending}>Abbrechen</button>
        <button onClick={() => m.mutate()} disabled={m.isPending}>Speichern</button>
      </div>
    </Modal>
  );
}
