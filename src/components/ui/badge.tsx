import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

export function Badge({ children, className = '', variant = 'primary', ...props }: BadgeProps) {
  const baseStyle =
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium select-none border';

  const variants = {
    primary:
      'bg-primary/10 border-primary/20 text-primary dark:bg-primary/15 dark:border-primary/30',
    secondary:
      'bg-light-border/40 border-light-border/60 text-light-text-secondary dark:bg-dark-border/40 dark:border-dark-border/60 dark:text-dark-text-secondary',
    success:
      'bg-success/10 border-success/20 text-success dark:bg-success/15 dark:border-success/30',
    danger:
      'bg-danger/10 border-danger/20 text-danger dark:bg-danger/15 dark:border-danger/30',
    warning:
      'bg-warning/10 border-warning/20 text-warning dark:bg-warning/15 dark:border-warning/30',
    info: 'bg-info/10 border-info/20 text-info dark:bg-info/15 dark:border-info/30',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
