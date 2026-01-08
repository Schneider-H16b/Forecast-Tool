import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantClass = variant !== 'default' ? `badge-${variant}` : '';
  return (
    <span className={`badge ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'error';
  label?: string;
  className?: string;
}

export const StatusBadge = ({ status, label, className = '' }: StatusBadgeProps) => {
  const statusClass = `status-${status}`;
  const statusSymbol = status === 'ok' ? '●' : status === 'warning' ? '⚠' : '✕';
  
  return (
    <span className={`badge ${className}`.trim()}>
      <span className={statusClass}>{statusSymbol}</span>
      <span>{label || (status === 'ok' ? 'OK' : status === 'warning' ? 'Warning' : 'Error')}</span>
    </span>
  );
};
