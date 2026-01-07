import React from 'react';
import { useToastStore } from '../../store/toastStore';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed',
      right: 16,
      bottom: 16,
      display: 'grid',
      gap: 8,
      zIndex: 1000,
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="kpi-card"
          style={{
            padding: 10,
            minWidth: 240,
            borderLeft: `4px solid ${t.kind === 'success' ? 'var(--ok)' : t.kind === 'error' ? 'var(--err)' : 'var(--muted)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>
            {t.message}
          </span>
          <button className="secondary" onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
