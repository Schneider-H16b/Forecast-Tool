import React from 'react';
import type { OrderDto } from '../../api/orders';

type Props = {
  rows: OrderDto[];
  onSelectOrder?: (id: string) => void;
};

export default function ForecastTable({ rows, onSelectOrder }: Props) {
  return (
    <div className="overflow-x-auto border border-border-light rounded-lg shadow">
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead className="bg-bg-secondary border-b border-border-light sticky top-0 z-10">
          <tr>
            {['Auftrag','Kunde','Forecast','Summe','Status','⚠','km'].map((h)=>(
              <th key={h} className="px-4 py-3 text-left font-semibold text-sm text-fg-secondary">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx)=> (
            <tr
              key={r.id}
              className={`
                ${idx % 2 === 1 ? 'bg-bg-secondary' : 'bg-bg-primary'}
                hover:bg-h16b-accent/5 transition-colors
                border-b border-border-light
                cursor-pointer
              `}
              onClick={()=>onSelectOrder?.(r.id)}
            >
              <td className="px-4 py-3 text-sm">{r.id}</td>
              <td className="px-4 py-3 text-sm">{r.customer ?? ''}</td>
              <td className="px-4 py-3 text-sm">{r.forecast_date ?? ''}</td>
              <td className="px-4 py-3 text-sm text-right">{r.sum_total ?? ''}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  r.status === 'open' ? 'bg-h16b-accent/20 text-h16b-accent' :
                  r.status === 'delivered' ? 'bg-success/20 text-success' :
                  'bg-fg-tertiary/10 text-fg-tertiary'
                }`}>
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm" style={{color: r.forecast_miss ? 'var(--warning)' : 'var(--muted)'}}>{r.forecast_miss ? '⚠' : ''}</td>
              <td className="px-4 py-3 text-sm text-right">{r.distance_km ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
