import React from 'react';

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyFn: (row: T) => string | number;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
  clickable?: boolean;
  className?: string;
  onSelectOrder?: (id: string) => void;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps<any>>(
  (
    {
      data,
      columns,
      keyFn,
      striped = true,
      hover = true,
      compact = false,
      clickable = false,
      className = '',
      onSelectOrder,
    },
    ref
  ) => {
    return (
      <div className="overflow-x-auto border border-border-light rounded-lg">
        <table
          ref={ref}
          className={`w-full ${className}`.trim()}
          style={{ borderCollapse: 'collapse' }}
        >
          <thead className="bg-bg-secondary border-b border-border-light sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left font-semibold text-sm text-fg-secondary"
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={keyFn(row)}
                className={`
                  ${striped && idx % 2 === 1 ? 'bg-bg-secondary' : 'bg-bg-primary'}
                  ${hover || clickable ? 'hover:bg-h16b-accent/5 transition-colors' : ''}
                  border-b border-border-light
                  ${clickable ? 'cursor-pointer' : ''}
                `}
                onClick={() => {
                  if (clickable && onSelectOrder && 'id' in row) {
                    onSelectOrder(row.id);
                  }
                }}
              >
                {columns.map((col) => {
                  const value = col.key && col.key in row ? row[col.key as keyof typeof row] : '';
                  return (
                    <td
                      key={String(col.key)}
                      className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-sm`}
                      style={{
                        width: col.width,
                        textAlign: col.align || 'left',
                      }}
                    >
                      {col.render ? col.render(value, row) : String(value || '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

interface TableEmptyProps {
  message?: string;
}

export const TableEmpty = ({ message = 'Keine Daten vorhanden' }: TableEmptyProps) => (
  <div className="flex justify-center items-center py-12">
    <p className="text-fg-tertiary text-lg">{message}</p>
  </div>
);
