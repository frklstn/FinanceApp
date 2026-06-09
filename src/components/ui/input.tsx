import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, description, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-lg bg-light-card border text-sm focus:outline-none transition-all duration-200 placeholder:text-light-text-secondary/40 dark:bg-dark-bg/40 
            ${
              error
                ? 'border-danger/60 focus:border-danger focus:ring-1 focus:ring-danger'
                : 'border-light-border focus:border-primary dark:border-dark-border dark:focus:border-primary'
            } 
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger font-medium flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </p>
        )}
        {!error && description && (
          <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary/60">
            {description}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
