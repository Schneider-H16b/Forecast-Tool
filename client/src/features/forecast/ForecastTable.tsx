import React from 'react';
import type { OrderDto } from '../../api/orders';
import { Table, TableEmpty } from '../../ui/components';

type Props = {
  rows: OrderDto[];
  onSelectOrder?: (id: string) => void;
};

export default function ForecastTable({ rows, onSelectOrder }: Props) {
  if (!rows.length) {
    return <TableEmpty message="Keine Aufträge gefunden" />;
  }

  return (
    <Table
      data={rows}
      keyFn={(r) => r.id}
      columns={[
        { key: 'id', header: 'Auftrag', width: '80px' },
        { key: 'customer', header: 'Kunde', render: (v) => v ?? '' },
        { key: 'forecast_date', header: 'Forecast', render: (v) => v ?? '' },
        { key: 'sum_total', header: 'Summe', align: 'right', render: (v) => v ?? '' },
        {
          key: 'status',
          header: 'Status',
          render: (v) => (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              v === 'open' ? 'bg-info/20 text-h16b-accent' :
              v === 'delivered' ? 'bg-success/20 text-success' :
              'bg-fg-tertiary/10 text-fg-tertiary'
            }`}>
              {v}
            </span>
          ),
        },
        {
          key: 'forecast_miss',
          header: 'Status',
          render: (v) => v ? <span className="text-warning">⚠ Verzug</span> : '',
          width: '60px',
        },
        { key: 'distance_km', header: 'km', align: 'right', render: (v) => v ?? '' },
      ]}
      hover
      striped
      clickable={!!onSelectOrder}
      onSelectOrder={onSelectOrder}
    />
  );
}
