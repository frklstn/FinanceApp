import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ children, className = '', glass = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        glass
          ? 'glass-card border-light-border/40 dark:border-dark-border/40'
          : 'bg-light-card border-light-border text-light-text-primary dark:bg-dark-card dark:border-dark-border dark:text-dark-text-primary'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
