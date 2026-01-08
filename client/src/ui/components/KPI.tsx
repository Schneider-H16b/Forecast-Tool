import React from 'react';

interface KPICardProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard = ({ value, label, trend, trendValue, icon, className = '' }: KPICardProps) => {
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-fg-tertiary';
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className={`kpi-card ${className}`.trim()}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="kpi-value">{value}</div>
          <div className="kpi-label">{label}</div>
          {trendValue && (
            <div className={`text-sm font-medium mt-2 ${trendColor}`}>
              {trendSymbol} {trendValue}
            </div>
          )}
        </div>
        {icon && <div className="flex-shrink-0 text-h16b-accent opacity-20 text-4xl">{icon}</div>}
      </div>
    </div>
  );
};

interface DashboardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export const DashboardGrid = ({ children, cols = 4, className = '' }: DashboardGridProps) => {
  const colsClass = `grid-cols-${cols}`;
  return (
    <div className={`grid ${colsClass} gap-4 ${className}`.trim()}>
      {children}
    </div>
  );
};
