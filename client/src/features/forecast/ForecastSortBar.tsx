import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../ui/components';

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
    <div className="flex gap-2">
      {buttons.map(b=> (
        <Button
          key={b.key}
          size="sm"
          variant={sort.key === b.key ? 'primary' : 'ghost'}
          onClick={() => setKey(b.key)}
        >
          {b.label} {sort.key === b.key ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
        </Button>
      ))}
    </div>
  );
}
