import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'flat';
  clickable?: boolean;
  onClick?: () => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', clickable = false, onClick }, ref) => {
    const variantClass = variant === 'elevated' ? 'shadow-lg' : variant === 'flat' ? 'shadow-none' : 'shadow';
    const interactiveClass = clickable ? 'cursor-pointer hover:shadow-hover transition-all' : '';

    return (
      <div
        ref={ref}
        className={`card ${variantClass} ${interactiveClass} ${className}`.trim()}
        onClick={onClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader = ({ children, className = '', action }: CardHeaderProps) => (
  <div className={`card-header flex justify-between items-start ${className}`.trim()}>
    <div>{children}</div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody = ({ children, className = '' }: CardBodyProps) => (
  <div className={`card-body ${className}`.trim()}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => (
  <div className={`flex gap-3 mt-4 pt-4 border-t border-border-light ${className}`.trim()}>
    {children}
  </div>
);
