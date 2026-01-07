import Modal from '../../ui/components/Modal';
import { useUIStore } from '../../store/uiStore';

export function AutoPlanResultModal({ result }: { result: unknown }) {
  const close = useUIStore((s) => s.closeModal);
  return (
    <Modal open title="AutoPlan Ergebnis" onClose={close}>
      <pre style={{ maxHeight: 360, overflow: 'auto', background: 'var(--bg-muted)', padding: 8 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={close}>Schließen</button>
      </div>
    </Modal>
  );
}
