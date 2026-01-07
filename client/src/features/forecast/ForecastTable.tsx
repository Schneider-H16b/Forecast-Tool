import React from 'react';
import type { OrderDto } from '../../api/orders';

type Props = {
  rows: OrderDto[];
  onSelectOrder?: (id: string) => void;
};

export default function ForecastTable({ rows, onSelectOrder }: Props) {
  return (
    <div style={{overflow:'auto', border:'1px solid var(--border)', borderRadius:8}}>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead style={{position:'sticky', top:0, background:'var(--bg)', zIndex:1}}>
          <tr>
            {['Auftrag','Kunde','Forecast','Summe','Status','⚠','km'].map((h)=>(
              <th key={h} style={{textAlign:'left', padding:'8px 10px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:12, color:'var(--muted)'}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r=> (
            <tr key={r.id} style={{cursor:'pointer'}} onClick={()=>onSelectOrder?.(r.id)}>
              <td style={{padding:'8px 10px', borderBottom:'1px solid var(--border)'}}>{r.id}</td>
              <td style={{padding:'8px 10px', borderBottom:'1px solid var(--border)'}}>{r.customer ?? ''}</td>
              <td style={{padding:'8px 10px', borderBottom:'1px solid var(--border)'}}>{r.forecast_date ?? ''}</td>
              <td style={{padding:'8px 10px', borderBottom:'1px solid var(--border)'}}>{r.sum_total ?? ''}</td>
              <td style={{padding:'8px 10px', borderBottom:'1px solid var(--border)'}}>{r.status}</td>
              <td style={{padding:'8px 10px', borderBottom:'1px solid var(--border)', color: r.forecast_miss ? 'var(--warn)' : 'var(--muted)'}}>{r.forecast_miss ? '⚠' : ''}</td>
              <td style={{padding:'8px 10px', borderBottom:'1px solid var(--border)'}}>{r.distance_km ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
