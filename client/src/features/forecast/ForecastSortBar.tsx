import React from 'react';
import { useUIStore } from '../../store/uiStore';

const buttons: Array<{ key: 'id'|'customer'|'forecast'|'sum'|'status'; label: string }> = [
  { key: 'id', label: 'Auftrag' },
  { key: 'customer', label: 'Kunde' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'sum', label: 'Summe' },
  { key: 'status', label: 'Status' },
];

export default function ForecastSortBar(){
  const sort = useUIStore(s=>s.forecast.sort);
  const setF = useUIStore(s=>s.setForecast);
  function setKey(k: typeof sort.key){
    if (sort.key === k){
      setF({ sort: { key: k, dir: sort.dir === 'asc' ? 'desc' : 'asc' } });
    } else {
      setF({ sort: { key: k, dir: 'asc' } });
    }
  }
  return (
    <div style={{display:'flex', gap:8}}>
      {buttons.map(b=> (
        <button key={b.key} className="btn" onClick={()=>setKey(b.key)}>
          {b.label} {sort.key===b.key ? (sort.dir==='asc'?'↑':'↓') : ''}
        </button>
      ))}
    </div>
  );
}
