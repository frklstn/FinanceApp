import React from 'react';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
}

export function Progress({
  value,
  className = '',
  variant = 'primary',
  showLabel = false,
  label,
}: ProgressProps) {
  const boundedValue = Math.min(Math.max(value, 0), 100);

  const colors = {
    primary: 'bg-primary shadow-sm shadow-primary/20',
    success: 'bg-success shadow-sm shadow-success/20',
    warning: 'bg-warning shadow-sm shadow-warning/20',
    danger: 'bg-danger shadow-sm shadow-danger/20',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
          {label && <span className="text-light-text-secondary dark:text-dark-text-secondary">{label}</span>}
          {showLabel && <span className="text-light-text-primary dark:text-dark-text-primary">{Math.round(boundedValue)}%</span>}
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[variant]}`}
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  );
}
