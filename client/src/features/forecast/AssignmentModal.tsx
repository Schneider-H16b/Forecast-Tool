import { useState } from 'react';
import Modal from '../../ui/components/Modal';
import { useUIStore } from '../../store/uiStore';

interface Props {
  orderId: string;
  kind: 'production'|'montage';
  initialDate?: string;
  onSubmit?: (data: { date: string; durationHours: number; travelMinutes: number; employeeIds: string[] }) => Promise<void> | void;
}

export function AssignmentModal({ orderId, kind, initialDate, onSubmit }: Props) {
  const close = useUIStore((s) => s.closeModal);
  const [date, setDate] = useState<string>(initialDate ?? '');
  const [durationHours, setDurationHours] = useState<number>(8);
  const [travelMinutes, setTravelMinutes] = useState<number>(kind === 'montage' ? 60 : 0);
  const [employees, setEmployees] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const employeeIds = employees
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await onSubmit?.({ date, durationHours, travelMinutes, employeeIds });
      close();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open title={`Auftrag ${orderId} planen (${kind})`} onClose={close}>
      <div className="form">
        <label>
          <span>Datum</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          <span>Dauer (Std.)</span>
          <input
            type="number"
            min={1}
            max={12}
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
          />
        </label>
        <label>
          <span>Reisezeit (Min.)</span>
          <input
            type="number"
            min={0}
            max={600}
            value={travelMinutes}
            onChange={(e) => setTravelMinutes(Number(e.target.value))}
          />
        </label>
        <label>
          <span>Mitarbeiter-IDs (CSV)</span>
          <input
            placeholder="z.B. e1,e2"
            value={employees}
            onChange={(e) => setEmployees(e.target.value)}
          />
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button className="secondary" onClick={close} disabled={submitting}>Abbrechen</button>
        <button onClick={handleSubmit} disabled={submitting || !date}>Planen</button>
      </div>
    </Modal>
  );
}
