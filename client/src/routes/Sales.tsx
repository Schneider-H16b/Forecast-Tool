import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ThreePanelLayout } from '../app/ThreePanelLayout';
import { useUIStore } from '../store/uiStore';
import { useOrdersList } from '../hooks/useOrders';
import { fetchOrderDetail } from '../api/orderDetail';

type StatusFilter = 'all' | 'open' | 'delivered' | 'canceled';

function SalesFilters({ search, setSearch, status, setStatus, onlyDelayed, setOnlyDelayed }: {
  search: string;
  setSearch: (s: string) => void;
  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;
  onlyDelayed: boolean;
  setOnlyDelayed: (b: boolean) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h3>Filter</h3>
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Suche (Kunde / Order-ID)</span>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Muster GmbH / #123" />
      </label>
      <label style={{ display: 'grid', gap: 4 }}>
        <span>Status</span>
        <select value={status} onChange={(e)=>setStatus(e.target.value as StatusFilter)}>
          <option value="all">Alle</option>
          <option value="open">Offen</option>
          <option value="delivered">Geliefert</option>
          <option value="canceled">Storniert</option>
        </select>
      </label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={onlyDelayed} onChange={(e)=>setOnlyDelayed(e.target.checked)} />
        <span>Nur verspätete</span>
      </label>
    </div>
  );
}

function SalesTable({ rows, onSelect, selectedId }: { rows: any[]; onSelect: (id: string) => void; selectedId?: string }) {
  if (!rows.length) return <div className="kpi-card">Keine Orders im Zeitraum</div>;
  return (
    <div className="kpi-card" style={{ padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 120px', padding: '8px 12px', fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
        <span>Kunde</span>
        <span>Status</span>
        <span>Forecast</span>
        <span>Wert</span>
      </div>
      <div style={{ display: 'grid' }}>
        {rows.map(o => (
          <button
            key={o.id}
            onClick={()=>onSelect(o.id)}
            className="ghost-row"
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              display: 'grid',
              gridTemplateColumns: '1fr 110px 110px 120px',
              gap: 8,
              background: selectedId === o.id ? 'var(--surface)' : undefined,
            }}
          >
            <div style={{ display: 'grid', gap: 2 }}>
              <div style={{ fontWeight: 600 }}>{o.customer ?? 'Unbekannt'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>#{o.ext_id ?? o.id}</div>
            </div>
            <span>{o.status}</span>
            <span>{o.forecast_date ?? '–'}</span>
            <span>{o.sum_total ? o.sum_total.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) : '–'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SalesInspector({ orderId }: { orderId?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order','detail','sales', orderId],
    enabled: !!orderId,
    queryFn: () => fetchOrderDetail(orderId!),
  });
  if (!orderId) return <div className="kpi-card">Order auswählen</div>;
  if (isLoading) return <div className="kpi-card">Lade Order…</div>;
  if (isError || !data) return <div className="kpi-card" style={{ borderColor: 'var(--warn)' }}>Fehler beim Laden</div>;
  const { order, events } = data;
  return (
    <div className="kpi-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{order.customer ?? 'Unbekannt'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>#{order.ext_id ?? order.id}</div>
        </div>
        <span className="badge">{order.status}</span>
      </div>
      <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Forecast</span><span>{order.forecast_date ?? '–'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Wert</span><span>{order.sum_total ? order.sum_total.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) : '–'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Verspätungstage</span><span>{order.miss_days ?? '–'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Distanz (km)</span><span>{order.distance_km ?? '–'}</span></div>
      </div>
      <div style={{ fontWeight: 600, marginTop: 6 }}>Positionen</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {order.lines?.length ? order.lines.map(l => (
          <div key={l.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{l.sku ?? 'SKU'}</span>
              <span>{l.qty} Stk</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Lieferung: {l.delivery_date ?? '–'}</div>
          </div>
        )) : <div style={{ fontSize: 12, color: 'var(--muted)' }}>Keine Positionen</div>}
      </div>
      <div style={{ fontWeight: 600, marginTop: 6 }}>Geplante Events</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {events?.length ? events.map(ev => (
          <div key={ev.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 8, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{ev.kind}</span>
              <span>{ev.start_date} → {ev.end_date}</span>
            </div>
            <div>Duration: {ev.total_minutes} min</div>
          </div>
        )) : <div style={{ fontSize: 12, color: 'var(--muted)' }}>Keine Events geplant</div>}
      </div>
    </div>
  );
}

export default function Sales() {
  const month = useUIStore(s=>s.currentMonth);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [onlyDelayed, setOnlyDelayed] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();

  const statuses = useMemo(() => status === 'all' ? undefined : [status], [status]);
  const { data: orders = [], isLoading, isError } = useOrdersList({
    monthIso: month,
    search,
    statuses,
    onlyDelayed,
    onlyUnplanned: false,
    sort: 'forecast:asc',
  });

  return (
    <ThreePanelLayout
      sidebar={<SalesFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} onlyDelayed={onlyDelayed} setOnlyDelayed={setOnlyDelayed} />}
      inspector={<SalesInspector orderId={selected} />}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        {isLoading && <div className="kpi-card">Lade Orders…</div>}
        {isError && <div className="kpi-card" style={{ borderColor: 'var(--warn)' }}>Fehler beim Laden</div>}
        {!isLoading && !isError && (
          <SalesTable rows={orders} onSelect={setSelected} selectedId={selected} />
        )}
      </div>
    </ThreePanelLayout>
  );
}
