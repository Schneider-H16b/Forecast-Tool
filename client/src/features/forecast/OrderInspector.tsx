import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrderDetail } from '../../api/orderDetail';
import { useUIStore } from '../../store/uiStore';
import { patchOrderMeta } from '../../api/orders';
import { runAutoPlan } from '../../api/autoplan';

export default function OrderInspector({ orderId }: { orderId?: string }) {
  const hasOrder = Boolean(orderId);
  
  // All hooks must be called before any conditional returns
  const openModal = useUIStore(s=>s.openModal);
  const currentMonth = useUIStore(s=>s.currentMonth);
  const qc = useQueryClient();
  const [editingDist, setEditingDist] = useState(false);
  const [distValue, setDistValue] = useState<number>(0);
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order','detail', orderId],
    queryFn: () => fetchOrderDetail(orderId as string),
    enabled: hasOrder,
  });

  // Update distValue when order data changes
  React.useEffect(() => {
    if (data?.order) {
      setDistValue(data.order.distance_km ?? 0);
    }
  }, [data?.order?.distance_km]);

  const mutateMeta = useMutation({
    mutationFn: (v: number)=>patchOrderMeta(orderId as string, { distanceKm: v }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order','detail', orderId] });
      await qc.invalidateQueries({ queryKey: ['orders','list'] });
      setEditingDist(false);
    }
  });
  
  const autoPlan = useMutation({
    mutationFn: async () => {
      if (!data?.order) return null;
      const rangeStart = data.order.forecast_date ?? currentMonth;
      const d = new Date(rangeStart + 'T00:00:00Z');
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0,10);
      return runAutoPlan({
        startDate: rangeStart,
        endDate: end,
        includeProduction: true,
        includeMontage: true,
        overwriteExisting: false,
      });
    },
    onSuccess: async (result) => {
      if (!result || !data?.order) return;
      useUIStore.getState().openModal({ type: 'autoplanResult', result });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['events','month'] }),
        qc.invalidateQueries({ queryKey: ['orders','list'] }),
        qc.invalidateQueries({ queryKey: ['order','detail', data.order.id] }),
      ]);
    },
  });

  // Now safe to do conditional returns after all hooks
  if (!hasOrder) return <div><em>Kein Auftrag ausgewählt</em></div>;
  if (isLoading) return <div>Lade Auftrag…</div>;
  if (isError || !data) return <div>Fehler beim Laden</div>;
  
  const { order, events } = data;
  const prod = events.filter(e=>e.kind==='production');
  const mont = events.filter(e=>e.kind==='montage');
  
  return (
    <div style={{display:'grid', gap:12}}>
      <section>
        <h3 style={{margin:'6px 0'}}>#{order.id}</h3>
        <div style={{color:'var(--muted)'}}>{order.customer ?? ''} • {order.status}</div>
        <div style={{fontSize:12, marginTop:6}}>Forecast: {order.forecast_date ?? '-'} {order.forecast_miss ? ` • ⚠ +${order.miss_days ?? 0} Tage` : ''}</div>
      </section>
      <section>
        <h4>Aufwand</h4>
        <div className="badge">Summe: {order.sum_total ?? 0}</div>
        <div className="badge" style={{display:'flex', alignItems:'center', gap:8}}>
          <span>Distanz:</span>
          {!editingDist ? (
            <>
              <span>{order.distance_km ?? 0} km</span>
              <button className="link" onClick={()=>{ setDistValue(order.distance_km ?? 0); setEditingDist(true); }}>bearbeiten</button>
            </>
          ) : (
            <>
              <input style={{width:80}} type="number" value={distValue} onChange={(e)=>setDistValue(Number(e.target.value))} />
              <button className="secondary" onClick={()=>setEditingDist(false)} disabled={mutateMeta.isPending}>Abbrechen</button>
              <button onClick={()=>mutateMeta.mutate(distValue)} disabled={mutateMeta.isPending}>Speichern</button>
            </>
          )}
        </div>
      </section>
      <section>
        <h4>Planung – Fertigung</h4>
        {prod.length === 0 && <div className="badge">Keine</div>}
        {prod.map(ev => (
          <div key={ev.id} className="kpi-card" style={{padding:8}}>
            <div>{ev.start_date} – {ev.end_date}</div>
            <div style={{fontSize:12, color:'var(--muted)'}}>Minuten: {ev.total_minutes} {ev.source==='autoplan'?'• AUTO':''}</div>
            {ev.employeeIds && ev.employeeIds.length>0 && <div style={{fontSize:12}}>MA: {ev.employeeIds.join(', ')}</div>}
          </div>
        ))}
      </section>
      <section>
        <h4>Planung – Montage</h4>
        {mont.length === 0 && <div className="badge">Keine</div>}
        {mont.map(ev => (
          <div key={ev.id} className="kpi-card" style={{padding:8}}>
            <div>{ev.start_date} – {ev.end_date}</div>
            <div style={{fontSize:12, color:'var(--muted)'}}>Minuten: {ev.total_minutes} • Reise: {ev.travel_minutes}</div>
            {ev.employeeIds && ev.employeeIds.length>0 && <div style={{fontSize:12}}>MA: {ev.employeeIds.join(', ')}</div>}
          </div>
        ))}
      </section>
      <section>
        <h4>Aktionen</h4>
        <div style={{display:'grid', gap:6}}>
          <button className="btn" onClick={()=>openModal({ type:'positions', orderId: order.id })}>Positionen</button>
          <button className="btn" onClick={()=>openModal({ type:'assignment', orderId: order.id, kind: 'production' })}>Planen…</button>
          <button className="btn" onClick={()=>{ setDistValue(order.distance_km ?? 0); setEditingDist(true); }}>Distanz bearbeiten</button>
          <button className="btn" onClick={()=>autoPlan.mutate()} disabled={autoPlan.isPending}>AutoPlan (Auftrag)</button>
        </div>
      </section>
    </div>
  );
}
