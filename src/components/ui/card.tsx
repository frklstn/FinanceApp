import React from 'react';
import styles from './card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ children, className = '', glass = false, ...props }: CardProps) {
  return (
    <div
      className={`${styles.card} ${glass ? styles.glass : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
