import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import Modal from '../../ui/components/Modal';
import { fetchOrderDetail, type OrderLineDto } from '../../api/orderDetail';

interface Props {
  orderId: string;
}

export function PositionsModal({ orderId }: Props) {
  const close = useUIStore((s) => s.closeModal);
  const [filter, setFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order','detail', orderId, 'lines'],
    queryFn: () => fetchOrderDetail(orderId),
    select: (res) => res.order.lines as OrderLineDto[],
  });

  const visible = useMemo(() => {
    const list = data ?? [];
    if (!filter) return list;
    const f = filter.toLowerCase();
    return list.filter((p) => [p.id, p.sku, p.qty, p.delivery_date].join(' ').toLowerCase().includes(f));
  }, [data, filter]);

  return (
    <Modal open title={`Positionen Auftrag ${orderId}`} onClose={close}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Suchen…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {isLoading && <div className="badge">Lade Positionen…</div>}
      {isError && <div className="badge" style={{ borderColor: 'var(--warn)' }}>Fehler beim Laden</div>}
      {!isLoading && !isError && (visible.length === 0 ? (
        <div className="empty">Keine Positionen verfügbar.</div>
      ) : (
        <div className="table simple">
          <div className="thead">
            <div>ID</div>
            <div>SKU</div>
            <div>Menge</div>
            <div>Lieferdatum</div>
          </div>
          {visible.map((p) => (
            <div key={p.id} className="tr">
              <div>{p.id}</div>
              <div>{p.sku ?? '-'}</div>
              <div>{p.qty}</div>
              <div>{p.delivery_date ?? '-'}</div>
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={close}>Schließen</button>
      </div>
    </Modal>
  );
}
